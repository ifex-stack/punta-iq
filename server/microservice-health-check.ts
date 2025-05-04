/**
 * Microservice health check system
 * Monitors the Flask AI microservice and attempts to restart it if it's down
 */
import { spawn } from 'child_process';
import path from 'path';
import { MicroserviceClient } from './microservice-client';
import { createContextLogger } from './logger';

const logger = createContextLogger('MicroserviceHealthCheck');
const client = new MicroserviceClient();

// Health check interval in milliseconds (default: check every 30 seconds)
const HEALTH_CHECK_INTERVAL = 30 * 1000;

// Number of consecutive failures before attempting restart
const MAX_FAILURES_BEFORE_RESTART = 3;

// Max number of restart attempts before giving up
const MAX_RESTART_ATTEMPTS = 2;

// Cooldown period after restart attempt (in milliseconds)
const RESTART_COOLDOWN = 60 * 1000;

let failureCount = 0;
let restartAttempts = 0;
let lastRestartTime = 0;
let isCheckInProgress = false;
let checkInterval: NodeJS.Timeout | null = null;

/**
 * Start the microservice health check system
 */
export function startMicroserviceHealthCheck() {
  logger.info('Starting microservice health monitoring');
  
  // Clear any existing intervals
  if (checkInterval) {
    clearInterval(checkInterval);
  }
  
  // Reset counters
  failureCount = 0;
  restartAttempts = 0;
  
  // Set up periodic health check
  checkInterval = setInterval(performHealthCheck, HEALTH_CHECK_INTERVAL);
  
  // Run an immediate health check
  performHealthCheck();
  
  return {
    stop: () => {
      if (checkInterval) {
        clearInterval(checkInterval);
        checkInterval = null;
        logger.info('Microservice health monitoring stopped');
      }
    }
  };
}

/**
 * Perform a health check on the microservice
 */
async function performHealthCheck() {
  // Prevent multiple concurrent checks
  if (isCheckInProgress) {
    return;
  }
  
  isCheckInProgress = true;
  logger.debug('Performing microservice health check');
  
  try {
    const isRunning = await client.isRunning();
    
    if (isRunning) {
      // Service is running, reset failure count
      if (failureCount > 0) {
        logger.info(`Microservice recovered after ${failureCount} failures`);
      }
      failureCount = 0;
      logger.debug('Microservice health check passed');
    } else {
      // Service is not running
      failureCount++;
      logger.warn(`Microservice health check failed (${failureCount}/${MAX_FAILURES_BEFORE_RESTART})`);
      
      // If we've reached the threshold, attempt restart
      if (failureCount >= MAX_FAILURES_BEFORE_RESTART) {
        await attemptServiceRestart();
      }
    }
  } catch (error) {
    // Error during health check
    failureCount++;
    logger.error(`Error during microservice health check (${failureCount}/${MAX_FAILURES_BEFORE_RESTART}): ${error}`);
    
    // If we've reached the threshold, attempt restart
    if (failureCount >= MAX_FAILURES_BEFORE_RESTART) {
      await attemptServiceRestart();
    }
  } finally {
    isCheckInProgress = false;
  }
}

/**
 * Attempt to restart the microservice
 */
async function attemptServiceRestart() {
  const currentTime = Date.now();
  
  // Check if we're in cooldown period
  if (currentTime - lastRestartTime < RESTART_COOLDOWN) {
    logger.info('Skipping restart attempt (in cooldown period)');
    return;
  }
  
  // Check if we've exceeded max restart attempts
  if (restartAttempts >= MAX_RESTART_ATTEMPTS) {
    logger.warn(`Exceeded maximum restart attempts (${MAX_RESTART_ATTEMPTS}). Service may require manual intervention.`);
    return;
  }
  
  restartAttempts++;
  lastRestartTime = currentTime;
  
  logger.info(`Attempting microservice restart (attempt ${restartAttempts}/${MAX_RESTART_ATTEMPTS})`);
  
  try {
    // Get the path to the start script
    const scriptPath = path.join(process.cwd(), 'scripts', 'start-ai-service.js');
    
    // Spawn the Node.js process to run the script
    const childProcess = spawn('node', [scriptPath], {
      detached: true, 
      stdio: ['ignore', 'ignore', 'ignore'],
    });
    
    // Detach the child process
    childProcess.unref();
    
    logger.info(`Restart initiated, process ID: ${childProcess.pid}`);
    
    // Wait a bit for the service to start
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Check if the service is now running
    const isNowRunning = await client.isRunning();
    
    if (isNowRunning) {
      logger.info('Microservice successfully restarted');
      failureCount = 0; // Reset failure count on successful restart
    } else {
      logger.error('Microservice failed to restart');
    }
  } catch (error) {
    logger.error(`Error during microservice restart: ${error}`);
  }
}