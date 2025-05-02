/**
 * API routes for AI service status monitoring and display
 */
import { Router, Request, Response } from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { createContextLogger } from './logger';
import fs from 'fs';
import { MicroserviceClient } from './microservice-client';

// Set up logging for this module
const logger = createContextLogger('AIStatus');

// Setup async exec function
const execAsync = promisify(exec);

// Path to the scripts directory
const scriptsDir = path.join(process.cwd(), 'scripts');

// Create a microservice client for API communication
const microserviceClient = new MicroserviceClient();

export const aiStatusRouter = Router();

// Track the status over time to detect patterns
let consecutiveSuccesses = 0;
let consecutiveFailures = 0;
const MAX_TRACKING = 5; // Track up to 5 consecutive events
let lastCheckTime = 0;
let lastStatus = 'unknown';
let responseTimeHistory: number[] = [];

// Route to get AI service status with enhanced monitoring
aiStatusRouter.get('/', async (req: Request, res: Response) => {
  try {
    logger.info('Checking AI service status');
    
    // Implement rate limiting for status checks (prevent hammering the service)
    const now = Date.now();
    const timeSinceLastCheck = now - lastCheckTime;
    if (timeSinceLastCheck < 2000 && lastStatus !== 'unknown' && req.query.force !== 'true') {
      // Return cached status if checked within last 2 seconds (unless force=true)
      logger.debug('Returning cached status due to rate limiting');
      const cachedStatus = {
        status: lastStatus,
        message: lastStatus === 'online' 
          ? 'The AI sports prediction service is online and fully operational.'
          : lastStatus === 'degraded'
            ? 'The AI sports prediction service is running but with limited functionality.'
            : 'The AI sports prediction service is currently offline.',
        cached: true,
        lastChecked: new Date(lastCheckTime).toISOString(),
        responseTime: {
          avg: responseTimeHistory.reduce((sum, time) => sum + time, 0) / responseTimeHistory.length,
          history: responseTimeHistory
        }
      };
      return res.json(cachedStatus);
    }
    
    // Start timing the request for performance metrics
    const startTime = Date.now();
    
    // Check if the service is running using our client (handles circuit breaker and error management)
    const isRunning = await microserviceClient.isRunning();
    
    // Calculate response time
    const responseTime = Date.now() - startTime;
    
    // Update response time history (max 10 items)
    responseTimeHistory.push(responseTime);
    if (responseTimeHistory.length > 10) {
      responseTimeHistory.shift();
    }
    
    // Update tracking variables
    lastCheckTime = now;
    
    if (isRunning) {
      try {
        // If it's running, get detailed status
        const statusData = await microserviceClient.getStatus();
        
        // Analyze the status
        const isFullyOperational = statusData.overall === 'ok';
        
        // Update consecutive tracking counters
        if (isFullyOperational) {
          consecutiveSuccesses = Math.min(consecutiveSuccesses + 1, MAX_TRACKING);
          consecutiveFailures = 0;
        } else {
          consecutiveFailures = Math.min(consecutiveFailures + 1, MAX_TRACKING);
          consecutiveSuccesses = 0;
        }
        
        // Determine status based on pattern recognition
        let currentStatus = 'degraded';
        if (isFullyOperational && consecutiveSuccesses >= 3) {
          currentStatus = 'online';
        }
        
        lastStatus = currentStatus;
        logger.info('AI service status check successful', { status: currentStatus, responseTime });
        
        return res.json({
          status: currentStatus,
          message: currentStatus === 'online'
            ? 'The AI sports prediction service is online and fully operational.'
            : 'The AI sports prediction service is running but with limited functionality.',
          detailed: {
            overall: statusData.overall,
            services: statusData.services,
            timestamp: statusData.timestamp,
            responseTime,
            consecutiveSuccesses,
            consecutiveFailures
          }
        });
      } catch (statusError) {
        // If we get here, the service is running but had an error fetching detailed status
        consecutiveFailures = Math.min(consecutiveFailures + 1, MAX_TRACKING);
        consecutiveSuccesses = 0;
        lastStatus = 'degraded';
        
        logger.warn('Service is running but detailed status check failed', { error: statusError });
        return res.json({
          status: 'degraded',
          message: 'The AI sports prediction service is running but with limited functionality.',
          detailed: {
            overall: 'degraded',
            services: {
              'status-api': { status: 'error', message: 'Status check failed' }
            },
            timestamp: new Date().toISOString(),
            responseTime,
            consecutiveSuccesses,
            consecutiveFailures
          }
        });
      }
    } else {
      // Service is not running
      consecutiveFailures = Math.min(consecutiveFailures + 1, MAX_TRACKING);
      consecutiveSuccesses = 0;
      lastStatus = 'offline';
      
      return res.json({
        status: 'offline',
        message: 'The AI sports prediction service is currently offline.',
        detailed: {
          overall: 'offline',
          services: {
            'ai-predictions': { status: 'error', lastCheck: new Date().toISOString() },
            'api-service': { status: 'error', lastCheck: new Date().toISOString() }
          },
          timestamp: new Date().toISOString(),
          responseTime,
          consecutiveSuccesses,
          consecutiveFailures
        }
      });
    }
  } catch (error: unknown) {
    // An unexpected error occurred
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error checking AI service status', { error });
    
    return res.status(500).json({
      status: 'error',
      message: `Error checking service status: ${errorMessage}`,
    });
  }
});

// Route to start/restart the AI service
aiStatusRouter.post('/start', async (req: Request, res: Response) => {
  try {
    logger.info('User requested AI service restart');
    
    // Ensure the user is authorized (optional, depends on your auth setup)
    /* 
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const user = req.user;
    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    */
    
    // Check if service is already running
    const isRunning = await microserviceClient.isRunning();
    if (isRunning) {
      logger.info('AI service is already running, no restart needed');
      return res.json({
        message: 'AI service is already running, no restart needed.',
        success: true,
        timestamp: new Date().toISOString()
      });
    }
    
    // Get the path to the start script
    const scriptPath = path.join(scriptsDir, 'start-ai-service.js');
    
    // Check if script exists
    if (!fs.existsSync(scriptPath)) {
      throw new Error(`Start script not found at: ${scriptPath}`);
    }
    
    logger.info(`Starting AI service using script: ${scriptPath}`);
    
    // Spawn the Node.js process to run the script with output capturing
    const childProcess = exec(`node ${scriptPath}`, {
      env: {
        ...process.env,
        AI_SERVICE_MANUAL_START: 'true' // Flag to indicate this is a manual restart
      }
    });
    
    // Capture output for better debugging
    let stdoutChunks = '';
    let stderrChunks = '';
    
    if (childProcess.stdout) {
      childProcess.stdout.on('data', (data) => {
        const output = data.toString();
        stdoutChunks += output;
        logger.info(`[AI Service Start] ${output.trim()}`);
      });
    }
    
    if (childProcess.stderr) {
      childProcess.stderr.on('data', (data) => {
        const output = data.toString();
        stderrChunks += output;
        logger.error(`[AI Service Start Error] ${output.trim()}`);
      });
    }
    
    logger.info('AI service restart initiated successfully');
    
    // Respond immediately without waiting for the process to complete
    return res.json({
      message: 'AI service restart initiated successfully. This may take a moment to complete.',
      success: true,
      timestamp: new Date().toISOString()
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error starting AI service', { error });
    return res.status(500).json({
      message: `Error starting AI service: ${errorMessage}`,
      success: false
    });
  }
});