import { Router } from "express";
import { openaiClient } from "./openai-client";
import { createContextLogger } from "./logger";
import http from 'http';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

const logger = createContextLogger('AIStatusRoutes');

// Configure AI service URL for the microservice
const AI_SERVICE_PORT = process.env.AI_SERVICE_PORT || 5000;
const AI_SERVICE_HOST = process.env.AI_SERVICE_HOST || 'localhost';
const AI_SERVICE_BASE_URL = `http://${AI_SERVICE_HOST}:${AI_SERVICE_PORT}`;

// Cache microservice status
let cachedMicroserviceStatus = null;
let lastStatusCheck = 0;
const STATUS_CACHE_TTL = 10 * 1000; // 10 seconds

/**
 * Checks if the AI microservice is running and returns its status
 */
async function getMicroserviceStatus(): Promise<any> {
  // Use cached status if available and recent
  const now = Date.now();
  if (cachedMicroserviceStatus && (now - lastStatusCheck < STATUS_CACHE_TTL)) {
    return cachedMicroserviceStatus;
  }

  return new Promise<any>((resolve) => {
    const testReq = http.request(
      `${AI_SERVICE_BASE_URL}/api/status`,
      { method: 'GET', timeout: 3000 },
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
              
              // Cache the status
              cachedMicroserviceStatus = {
                running: true,
                status: statusData.overall,
                services: statusData.services,
                lastChecked: new Date().toISOString()
              };
              lastStatusCheck = now;
              
              resolve(cachedMicroserviceStatus);
            } catch (e) {
              logger.warn('Failed to parse AI service status response');
              
              // Cache a simplified status
              cachedMicroserviceStatus = {
                running: true,
                status: 'ok',
                error: 'Could not parse status response',
                lastChecked: new Date().toISOString()
              };
              lastStatusCheck = now;
              
              resolve(cachedMicroserviceStatus);
            }
          });
        } else {
          // Service responded but with an error
          logger.warn(`AI service responded with status code ${res.statusCode}`);
          
          // Cache error status
          cachedMicroserviceStatus = {
            running: true,
            status: 'error',
            error: `Service responded with status code ${res.statusCode}`,
            lastChecked: new Date().toISOString()
          };
          lastStatusCheck = now;
          
          resolve(cachedMicroserviceStatus);
        }
      }
    );

    testReq.on('error', (error) => {
      // Service is not running
      logger.warn(`AI service is not running: ${error.message}`);
      
      // Cache error status
      cachedMicroserviceStatus = {
        running: false,
        status: 'error',
        error: 'AI service is not running',
        lastChecked: new Date().toISOString()
      };
      lastStatusCheck = now;
      
      resolve(cachedMicroserviceStatus);
    });

    testReq.on('timeout', () => {
      logger.warn('AI service status check timed out');
      testReq.destroy();
      
      // Cache timeout status
      cachedMicroserviceStatus = {
        running: false,
        status: 'error',
        error: 'Connection to AI service timed out',
        lastChecked: new Date().toISOString()
      };
      lastStatusCheck = now;
      
      resolve(cachedMicroserviceStatus);
    });

    testReq.end();
  });
}

/**
 * Manually start the AI service
 * @returns Promise that resolves to whether the service started successfully
 */
async function startAIService(): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    logger.info('Manually starting AI microservice...');

    // Check if the python script exists
    const scriptPath = path.resolve(process.cwd(), 'ai_service', 'api_service.py');
    if (!fs.existsSync(scriptPath)) {
      logger.error(`AI service script not found at: ${scriptPath}`);
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
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: true  // Run in the background
    });

    // Unref the process to allow our process to exit independently
    aiProcess.unref();

    let startupTimeout = setTimeout(() => {
      logger.warn('AI service startup timed out after 8 seconds');
      resolve(false);
    }, 8000);

    // Capture output for debugging
    if (aiProcess.stdout) {
      aiProcess.stdout.on('data', (data) => {
        const output = data.toString().trim();
        logger.info(`[AI Service] ${output}`);
        
        // If we see a startup message, consider the service started
        if (output.includes('Starting PuntaIQ API Service') || output.includes('Running on')) {
          clearTimeout(startupTimeout);
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
      resolve(false);
    });
  });
}

export function setupAiStatusRoutes(app: any) {
  const aiStatusRouter = Router();
  
  // OpenAI client status endpoint
  aiStatusRouter.get("/api/predictions/ai-status", (req, res) => {
    try {
      logger.info('Checking AI capabilities');
      
      const aiStatus = {
        enabled: openaiClient.hasApiKey(),
        capabilities: [
          { name: "match_insights", available: openaiClient.hasApiKey() },
          { name: "trend_analysis", available: openaiClient.hasApiKey() },
          { name: "ai_explanations", available: openaiClient.hasApiKey() },
          { name: "enhanced_accumulators", available: openaiClient.hasApiKey() },
        ],
        apiProvider: "OpenAI",
        model: "gpt-4o",
        apiStatus: openaiClient.hasApiKey() ? "connected" : "unavailable",
        requiresApiKey: !openaiClient.hasApiKey(),
        status: openaiClient.hasApiKey() ? "connected" : "unavailable"
      };
      
      logger.info('OpenAI status check completed', { 
        enabled: aiStatus.enabled, 
        apiStatus: aiStatus.apiStatus,
        hasApiKey: openaiClient.hasApiKey()
      });
      
      return res.status(200).json(aiStatus);
    } catch (error) {
      logger.error('Error getting OpenAI status', error);
      return res.status(500).json({ 
        error: "Error checking AI status",
        enabled: false,
        apiStatus: "error",
        status: "error",
        requiresApiKey: true
      });
    }
  });
  
  // AI microservice status check endpoint
  aiStatusRouter.get("/api/ai-status", async (req, res) => {
    try {
      const status = await getMicroserviceStatus();
      res.json(status);
    } catch (error) {
      logger.error(`Error getting AI service status: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({
        error: 'Failed to check AI service status',
        message: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Start AI microservice endpoint
  aiStatusRouter.post("/api/ai-status/start", async (req, res) => {
    try {
      // First check if it's already running
      const status = await getMicroserviceStatus();
      
      if (status.running) {
        return res.json({
          success: true,
          message: 'AI service is already running',
          status
        });
      }
      
      // Try to start the service
      const started = await startAIService();
      
      if (started) {
        res.json({
          success: true,
          message: 'AI service started successfully'
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Failed to start AI service'
        });
      }
    } catch (error) {
      logger.error(`Error starting AI service: ${error instanceof Error ? error.message : String(error)}`);
      res.status(500).json({
        success: false,
        error: 'Failed to start AI service',
        message: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // Use AI status router
  app.use(aiStatusRouter);
}