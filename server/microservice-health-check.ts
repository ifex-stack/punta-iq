/**
 * Microservice Health Check Module
 * Monitors the AI microservice and ensures it's properly running
 */
import { MicroserviceClient } from "./microservice-client";
import { createContextLogger } from "./logger";

const logger = createContextLogger("MicroserviceHealth");

class MicroserviceHealthMonitor {
  private client: MicroserviceClient;
  private checkIntervalMs: number = 60000; // Check every minute
  private interval: NodeJS.Timeout | null = null;
  private consecutiveFailures: number = 0;
  private maxFailures: number = 3;
  private isMonitoring: boolean = false;
  
  constructor() {
    this.client = new MicroserviceClient();
    logger.info("Microservice Health Monitor initialized");
  }
  
  /**
   * Start the health monitoring service
   */
  public start(): void {
    if (this.isMonitoring) {
      logger.warn("Monitoring already active");
      return;
    }
    
    logger.info(`Starting health checks at ${this.checkIntervalMs}ms intervals`);
    this.isMonitoring = true;
    
    // Perform an immediate check
    this.checkHealth();
    
    // Set up the interval for regular checks
    this.interval = setInterval(() => this.checkHealth(), this.checkIntervalMs);
  }
  
  /**
   * Stop the health monitoring service
   */
  public stop(): void {
    if (!this.isMonitoring || !this.interval) {
      return;
    }
    
    clearInterval(this.interval);
    this.interval = null;
    this.isMonitoring = false;
    logger.info("Health checks stopped");
  }
  
  /**
   * Check the health of the microservice
   */
  private async checkHealth(): Promise<void> {
    logger.debug("Performing microservice health check");
    
    try {
      const isRunning = await this.client.isRunning();
      
      if (isRunning) {
        if (this.consecutiveFailures > 0) {
          logger.info(`Microservice recovered after ${this.consecutiveFailures} failures`);
        }
        this.consecutiveFailures = 0;
        logger.debug("Microservice health check passed");
      } else {
        this.handleFailure("Microservice not running");
      }
    } catch (error) {
      this.handleFailure(`Microservice health check failed: ${error}`);
    }
  }
  
  /**
   * Handle a health check failure
   */
  private handleFailure(reason: string): void {
    this.consecutiveFailures++;
    
    logger.warn(`Health check failure #${this.consecutiveFailures}: ${reason}`);
    
    if (this.consecutiveFailures >= this.maxFailures) {
      logger.error(`Maximum failures reached (${this.maxFailures}). Attempting microservice restart.`);
      this.attemptRestart();
    }
  }
  
  /**
   * Try to restart the microservice
   */
  private async attemptRestart(): Promise<void> {
    try {
      logger.info("Attempting to restart microservice");

      // This will be a no-op if the microservice isn't running
      // and will try to start it if it isn't
      const isRunning = await this.client.isRunning();
      
      if (isRunning) {
        logger.info("Microservice successfully restarted");
        this.consecutiveFailures = 0;
      } else {
        logger.error("Failed to restart microservice");
      }
    } catch (error) {
      logger.error(`Error during microservice restart: ${error}`);
    }
  }
}

// Singleton instance
export const microserviceHealthMonitor = new MicroserviceHealthMonitor();