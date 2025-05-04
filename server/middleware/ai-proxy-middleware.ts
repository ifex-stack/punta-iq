/**
 * AI Proxy Middleware
 * 
 * This middleware proxies requests to /ai-service/* to the AI microservice
 * running on port 5000. It includes fallback handling for when the microservice
 * is not available.
 */

import { Request, Response, NextFunction } from 'express';
import http from 'http';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { createContextLogger } from '../logger';

const logger = createContextLogger('AIProxyMiddleware');

// Configure AI service URL
const AI_SERVICE_PORT = process.env.AI_SERVICE_PORT || 5000;
const AI_SERVICE_HOST = process.env.AI_SERVICE_HOST || 'localhost';
const AI_SERVICE_BASE_URL = `http://${AI_SERVICE_HOST}:${AI_SERVICE_PORT}`;

// Track service status
let isServiceStarting = false;
let serviceStartAttempt = 0;
const MAX_START_ATTEMPTS = 3;

/**
 * Attempts to start the AI microservice
 * @returns Promise that resolves when the service start attempt is complete
 */
async function startAIService(): Promise<boolean> {
  if (isServiceStarting) {
    logger.info('AI service start already in progress, waiting...');
    return false;
  }

  if (serviceStartAttempt >= MAX_START_ATTEMPTS) {
    logger.warn(`Maximum start attempts (${MAX_START_ATTEMPTS}) reached for AI service`);
    return false;
  }

  isServiceStarting = true;
  serviceStartAttempt++;

  return new Promise<boolean>((resolve) => {
    logger.info(`Attempting to start AI microservice (attempt ${serviceStartAttempt})...`);

    // Check if the python script exists
    const scriptPath = path.resolve(process.cwd(), 'ai_service', 'api_service.py');
    if (!fs.existsSync(scriptPath)) {
      logger.error(`AI service script not found at: ${scriptPath}`);
      isServiceStarting = false;
      resolve(false);
      return;
    }

    // Start the API microservice
    const aiProcess = spawn('python', [scriptPath], {
      cwd: path.resolve(process.cwd(), 'ai_service'),
      env: {
        ...process.env,
        PYTHONUNBUFFERED: '1'  // Force unbuffered output for logs
      },
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let startupTimeout = setTimeout(() => {
      logger.warn('AI service startup timed out after 10 seconds');
      isServiceStarting = false;
      resolve(false);
    }, 10000);

    // Capture output for debugging
    if (aiProcess.stdout) {
      aiProcess.stdout.on('data', (data) => {
        const output = data.toString().trim();
        logger.info(`[AI Service] ${output}`);
        
        // If we see a startup message, consider the service started
        if (output.includes('Starting PuntaIQ API Service') || output.includes('Running on')) {
          clearTimeout(startupTimeout);
          isServiceStarting = false;
          resolve(true);
        }
      });
    }

    if (aiProcess.stderr) {
      aiProcess.stderr.on('data', (data) => {
        logger.error(`[AI Service Error] ${data.toString().trim()}`);
      });
    }

    aiProcess.on('error', (error) => {
      logger.error(`Failed to start AI service: ${error.message}`);
      clearTimeout(startupTimeout);
      isServiceStarting = false;
      resolve(false);
    });

    aiProcess.on('close', (code) => {
      if (code !== 0) {
        logger.error(`AI service process exited with code ${code}`);
        clearTimeout(startupTimeout);
        isServiceStarting = false;
        resolve(false);
      }
    });
  });
}

/**
 * Checks if the AI service is running
 * @returns Promise that resolves to true if the service is running
 */
async function checkServiceStatus(): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    const testReq = http.request(
      `${AI_SERVICE_BASE_URL}/api/status`,
      { method: 'GET', timeout: 1000 },
      (res) => {
        if (res.statusCode === 200) {
          // Service is running
          let data = '';
          res.on('data', (chunk) => {
            data += chunk;
          });
          res.on('end', () => {
            try {
              const statusData = JSON.parse(data);
              logger.info(`AI service is running, status: ${statusData.overall}`);
              resolve(true);
            } catch (e) {
              logger.warn('Failed to parse AI service status response');
              resolve(true); // Still consider it running if we got a 200
            }
          });
        } else {
          // Service responded but with an error
          logger.warn(`AI service responded with status code ${res.statusCode}`);
          resolve(false);
        }
      }
    );

    testReq.on('error', () => {
      // Service is not running
      resolve(false);
    });

    testReq.on('timeout', () => {
      testReq.destroy();
      resolve(false);
    });

    testReq.end();
  });
}

/**
 * AI Proxy Middleware - forwards requests to /ai-service/* to the AI microservice
 * Includes auto-start capability if the microservice is down
 */
export default async function aiProxyMiddleware(req: Request, res: Response, next: NextFunction) {
  // Only proxy requests that start with /ai-service/
  if (!req.path.startsWith('/ai-service/')) {
    return next();
  }

  logger.info(`Processing AI service request: ${req.method} ${req.path}`);
  
  // Check if the service is running
  const isRunning = await checkServiceStatus();
  
  if (!isRunning) {
    logger.warn('AI service is not running, attempting to start it');
    
    // Try to start the service
    const started = await startAIService();
    
    if (!started) {
      logger.error('Failed to start AI service');
      return res.status(503).json({
        error: 'AI Service Unavailable',
        message: 'AI microservice is not running and failed to start automatically',
        code: 'AI_SERVICE_UNAVAILABLE',
        path: req.path
      });
    }
    
    // Wait a moment for the service to fully initialize
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  // Rewrite the path to remove the /ai-service prefix
  const targetPath = req.path.replace(/^\/ai-service/, '');
  const targetUrl = `${AI_SERVICE_BASE_URL}${targetPath}${req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : ''}`;

  logger.info(`Proxying to AI service: ${targetUrl}`);

  // Forward the request to the AI service
  try {
    const proxyReq = http.request(
      targetUrl, 
      {
        method: req.method,
        headers: {
          ...req.headers,
          host: `${AI_SERVICE_HOST}:${AI_SERVICE_PORT}`,
        },
        timeout: 15000, // 15 second timeout
      },
      (proxyRes) => {
        // Copy status code
        res.statusCode = proxyRes.statusCode || 500;
        
        // Copy headers
        Object.keys(proxyRes.headers).forEach((key) => {
          const headerValue = proxyRes.headers[key];
          if (headerValue !== undefined) {
            res.setHeader(key, headerValue);
          }
        });
        
        // Stream the response data
        proxyRes.pipe(res);
      }
    );
    
    // Handle errors
    proxyReq.on('error', (error) => {
      logger.error(`Error proxying to AI service: ${error instanceof Error ? error.message : String(error)}`);
      
      // If we haven't sent a response yet, send a 502 Bad Gateway
      if (!res.headersSent) {
        res.status(502).json({
          error: 'AI Service Unavailable',
          message: 'Could not connect to the AI microservice',
          code: 'AI_SERVICE_UNAVAILABLE',
          path: req.path
        });
      }
    });
    
    proxyReq.on('timeout', () => {
      logger.error('AI service request timed out');
      proxyReq.destroy();
      
      if (!res.headersSent) {
        res.status(504).json({
          error: 'AI Service Timeout',
          message: 'Request to AI microservice timed out',
          code: 'AI_SERVICE_TIMEOUT',
          path: req.path
        });
      }
    });
    
    // Forward request body if present
    if (req.body) {
      const bodyData = typeof req.body === 'string' 
        ? req.body 
        : JSON.stringify(req.body);
      
      proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
      proxyReq.write(bodyData);
    }
    
    proxyReq.end();
  } catch (error) {
    logger.error(`Failed to create proxy request: ${error instanceof Error ? error.message : String(error)}`);
    
    // Return an error response
    res.status(502).json({
      error: 'AI Service Proxy Error',
      message: 'Failed to create proxy request to AI microservice',
      code: 'AI_PROXY_ERROR',
      path: req.path
    });
  }
}