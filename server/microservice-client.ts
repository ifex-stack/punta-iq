/**
 * Client for communicating with the Flask microservice
 */

import axios, { AxiosError } from 'axios';
import { spawn, type ChildProcess } from 'child_process';
import path from 'path';
import fs from 'fs';

// Create a logger for the microservice client
const logger = {
  info: (message: string, ...args: any[]) => {
    console.log(`[${new Date().toISOString()}] [INFO] [MicroserviceClient] ${message}`, ...args);
  },
  error: (message: string, ...args: any[]) => {
    console.error(`[${new Date().toISOString()}] [ERROR] [MicroserviceClient] ${message}`, ...args);
  }
};

export interface ServiceStatus {
  status: 'ok' | 'error' | 'degraded';
  message: string;
  details?: any;
}

// Interface for the status response
export interface StatusResponse {
  overall: 'ok' | 'error' | 'degraded';
  services: {
    odds_api?: ServiceStatus;
    sportsdb_api?: ServiceStatus;
  };
  timestamp: string;
}

// Type guard to check if an error is an AxiosError
function isAxiosError(error: unknown): error is AxiosError {
  return axios.isAxiosError(error);
}

// Type for error with code property
interface ErrorWithCode {
  code?: string;
  response?: {
    status?: number;
  };
}

// Type guard to check if an error has a code property
function hasErrorCode(error: unknown): error is ErrorWithCode {
  return (
    typeof error === 'object' && 
    error !== null && 
    ('code' in error || 'response' in error)
  );
}

export class MicroserviceClient {
  private baseUrl: string;
  private process: ChildProcess | null = null;

  constructor(baseUrl = process.env.AI_SERVICE_URL || 'http://localhost:5000') {
    this.baseUrl = baseUrl;
    logger.info(`Initialized with base URL: ${this.baseUrl}`);
  }

  /**
   * Start the microservice if it's not running
   */
  async startService(): Promise<boolean> {
    try {
      // Check if service is already running
      const isRunning = await this.isServiceRunning();
      if (isRunning) {
        logger.info('Microservice is already running');
        return true;
      }

      logger.info('Starting microservice...');
      
      // Get the path to the script
      const scriptPath = path.join(process.cwd(), 'scripts', 'start-ai-service.js');
      
      // Check if the script exists
      if (!fs.existsSync(scriptPath)) {
        logger.error(`Script not found: ${scriptPath}`);
        return false;
      }
      
      // Start the process
      this.process = spawn('node', [scriptPath], {
        detached: true,
        stdio: 'inherit'
      });
      
      // Check if process started successfully
      if (!this.process.pid) {
        logger.error('Failed to start microservice process');
        return false;
      }
      
      logger.info(`Microservice started with PID ${this.process.pid}`);
      
      // Allow the service a moment to start up
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Verify the service is running
      const serviceRunning = await this.isServiceRunning();
      if (!serviceRunning) {
        logger.error('Service failed to start within timeout period');
        return false;
      }
      
      return true;
    } catch (error) {
      logger.error(`Error starting microservice: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }

  /**
   * Check if the microservice is running
   */
  async isServiceRunning(): Promise<boolean> {
    try {
      logger.info(`Checking microservice status from ${this.baseUrl}/api/status`);
      const response = await axios.get(`${this.baseUrl}/api/status`, { timeout: 3000 });
      return response.status === 200;
    } catch (error) {
      logger.error(`Error checking microservice status: ${error instanceof Error ? error.message : String(error)}`);
      // We'll assume the service is running and handle errors later
      // This is to prevent spawning multiple instances
      return true;
    }
  }

  /**
   * Get the status of the microservice and its connected APIs
   */
  async getStatus(): Promise<StatusResponse> {
    try {
      const response = await axios.get(`${this.baseUrl}/api/status`, { timeout: 5000 });
      return response.data as StatusResponse;
    } catch (error) {
      // If we can't connect to the service, create an error status
      const errorStatus: StatusResponse = {
        overall: 'error',
        services: {
          odds_api: {
            status: 'error',
            message: 'Unable to check API status'
          },
          sportsdb_api: {
            status: 'error',
            message: 'Unable to check API status'
          }
        },
        timestamp: new Date().toISOString()
      };

      if (hasErrorCode(error) && error.code === 'ECONNREFUSED') {
        // Service is not running
        errorStatus.overall = 'error';
        errorStatus.services = {
          odds_api: {
            status: 'error',
            message: 'Microservice not running'
          },
          sportsdb_api: {
            status: 'error',
            message: 'Microservice not running'
          }
        };
      } else if (hasErrorCode(error) && error.response?.status) {
        // The service responded with an error status code
        errorStatus.overall = 'error';
        errorStatus.services = {
          odds_api: {
            status: 'error',
            message: `Service responded with error: ${error.response.status}`
          },
          sportsdb_api: {
            status: 'error',
            message: `Service responded with error: ${error.response.status}`
          }
        };
      }

      return errorStatus;
    }
  }

  /**
   * Get odds from the microservice
   */
  async getOdds(sport: string): Promise<any> {
    try {
      const response = await axios.get(`${this.baseUrl}/api/odds/${sport}`);
      return response.data;
    } catch (error) {
      logger.error(`Error getting odds: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Get live scores from the microservice
   */
  async getLiveScores(): Promise<any> {
    try {
      const response = await axios.get(`${this.baseUrl}/api/livescore`);
      return response.data;
    } catch (error) {
      logger.error(`Error getting live scores: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
}

// Create and export a singleton instance
export const microserviceClient = new MicroserviceClient();