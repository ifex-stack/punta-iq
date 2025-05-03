import { createContextLogger } from "./logger";
import axios from "axios";
import { exec } from "child_process";
import path from "path";
import fs from "fs";
import { promisify } from "util";

const execPromise = promisify(exec);
const logger = createContextLogger("MicroserviceClient");

/**
 * Client for interacting with the AI microservice
 */
export class MicroserviceClient {
  private isServiceRunning: boolean = false;
  private lastCheckTime: number = 0;
  private checkInterval: number = 30000; // 30 seconds
  private startupAttempted: boolean = false;

  constructor() {
    logger.info("Initializing MicroserviceClient");
  }

  /**
   * Check if the AI microservice is running on the specified port
   */
  async isRunning(port: number = 5000): Promise<boolean> {
    const now = Date.now();
    
    // Only check once every 30 seconds unless forced
    if (now - this.lastCheckTime < this.checkInterval && this.lastCheckTime !== 0) {
      return this.isServiceRunning;
    }
    
    this.lastCheckTime = now;
    
    try {
      logger.debug(`Checking if microservice is running on port ${port}`);
      const response = await axios.get(`http://localhost:${port}/api/status`, {
        timeout: 2000
      });
      
      const isRunning = response.status === 200;
      this.isServiceRunning = isRunning;
      
      if (isRunning) {
        logger.debug(`Microservice is running on port ${port}`);
      } else {
        logger.warn(`Microservice check failed on port ${port}: ${response.status}`);
      }
      
      return isRunning;
    } catch (error) {
      logger.warn(`Failed to connect to microservice on port ${port}: ${error.message}`);
      this.isServiceRunning = false;
      return false;
    }
  }
  
  /**
   * Try to ensure the AI microservice is running
   */
  async ensureRunning(): Promise<boolean> {
    const isRunning = await this.isRunning();
    
    if (!isRunning && !this.startupAttempted) {
      logger.info("Microservice not running, attempting to start");
      return this.startService();
    }
    
    return isRunning;
  }
  
  /**
   * Start the AI microservice if it's not already running
   */
  async startService(): Promise<boolean> {
    // Only attempt to start the service once
    if (this.startupAttempted) {
      logger.warn("Startup already attempted, will not try again");
      return false;
    }
    
    this.startupAttempted = true;
    
    try {
      logger.info("Attempting to start AI microservice");
      
      // Find the AI service directory
      const aiServiceDir = path.resolve("ai_service");
      
      // Check if the directory exists
      if (!fs.existsSync(aiServiceDir)) {
        logger.error(`AI service directory not found at ${aiServiceDir}`);
        return false;
      }
      
      // Find the main.py file
      const mainPyPath = path.join(aiServiceDir, "api_service.py");
      
      if (!fs.existsSync(mainPyPath)) {
        logger.error(`API service file not found at ${mainPyPath}`);
        return false;
      }
      
      // Install requirements if needed
      const requirementsPath = path.join(aiServiceDir, "requirements.txt");
      
      if (fs.existsSync(requirementsPath)) {
        logger.info("Installing AI service requirements");
        
        try {
          await execPromise(`pip install -r ${requirementsPath}`);
          logger.info("Requirements installed successfully");
        } catch (error) {
          logger.error(`Failed to install requirements: ${error.message}`);
          // Continue anyway, as requirements might be installed but have version conflicts
        }
      }
      
      // Start the AI service
      logger.info(`Starting AI service with ${mainPyPath}`);
      
      // Use nohup to keep the process running after this process exits
      const startCommand = `cd ${aiServiceDir} && python ${path.basename(mainPyPath)} > ../ai_service_log.txt 2>&1 &`;
      
      await execPromise(startCommand);
      
      logger.info("AI service start command executed");
      
      // Wait for the service to start
      let retries = 5;
      while (retries > 0) {
        logger.info(`Waiting for AI service to start, ${retries} retries left`);
        
        // Wait for 2 seconds
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Check if the service is running
        const serviceRunning = await this.isRunning();
        
        if (serviceRunning) {
          logger.info("AI service started successfully");
          return true;
        }
        
        retries--;
      }
      
      logger.error("Failed to start AI service after multiple retries");
      return false;
    } catch (error) {
      logger.error(`Error starting AI service: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Check the status of the AI microservice
   */
  async checkStatus(): Promise<any> {
    try {
      // First ensure the service is running
      const isRunning = await this.ensureRunning();
      
      if (!isRunning) {
        return {
          status: "down",
          message: "AI service is not running"
        };
      }
      
      // Get detailed status from the status endpoint
      const response = await axios.get("http://localhost:5000/api/status", {
        timeout: 5000
      });
      
      return {
        status: "up",
        details: response.data
      };
    } catch (error) {
      logger.error(`Error checking AI service status: ${error.message}`);
      
      return {
        status: "error",
        message: `Failed to check AI service status: ${error.message}`
      };
    }
  }
}