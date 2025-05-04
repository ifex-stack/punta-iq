/**
 * Health check system for the AI Flask microservice
 * Automatically monitors and restarts the microservice when needed
 */
import { MicroserviceClient } from "./microservice-client";
import { spawn } from "child_process";
import path from "path";
import { createContextLogger } from "./logger";
import { fileURLToPath } from "url";

const logger = createContextLogger("MicroserviceHealthCheck");

export class MicroserviceHealthCheck {
  private client: MicroserviceClient;
  private checkInterval: NodeJS.Timeout | null = null;
  private consecutiveFailures: number = 0;
  private readonly maxFailures: number = 3;
  private readonly checkIntervalMs: number = 30000; // 30 seconds

  constructor() {
    this.client = new MicroserviceClient();
    logger.info("Microservice health check system initialized");
  }

  /**
   * Start the health check monitoring
   */
  public startMonitoring(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    logger.info("Starting microservice health monitoring");
    
    // Perform an immediate check
    this.performHealthCheck();
    
    // Set up recurring checks
    this.checkInterval = setInterval(() => {
      this.performHealthCheck();
    }, this.checkIntervalMs);
  }

  /**
   * Stop the health check monitoring
   */
  public stopMonitoring(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      logger.info("Microservice health monitoring stopped");
    }
  }

  /**
   * Perform a health check and restart if needed
   */
  private async performHealthCheck(): Promise<void> {
    logger.debug("Performing microservice health check");
    
    try {
      const isRunning = await this.client.isRunning();
      
      if (isRunning) {
        this.consecutiveFailures = 0;
        logger.debug("Microservice health check passed");
      } else {
        this.consecutiveFailures++;
        logger.warn(`Microservice health check failed (${this.consecutiveFailures}/${this.maxFailures})`);
        
        if (this.consecutiveFailures >= this.maxFailures) {
          logger.error(`Microservice health check failed ${this.consecutiveFailures} times, attempting restart`);
          this.restartMicroservice();
          this.consecutiveFailures = 0;
        }
      }
    } catch (error) {
      this.consecutiveFailures++;
      logger.error(`Error during microservice health check: ${error}`);
      
      if (this.consecutiveFailures >= this.maxFailures) {
        logger.error(`Microservice health check failed ${this.consecutiveFailures} times, attempting restart`);
        this.restartMicroservice();
        this.consecutiveFailures = 0;
      }
    }
  }

  /**
   * Restart the microservice
   */
  private restartMicroservice(): void {
    try {
      logger.info("Attempting to restart the AI microservice");
      
      // Get the path to the start script
      const scriptPath = path.join(process.cwd(), "scripts", "start-ai-service.js");
      
      // Spawn the Node.js process to run the script
      const childProcess = spawn("node", [scriptPath], {
        detached: true,
        stdio: ['ignore', 'ignore', 'ignore'],
      });
      
      // Detach the child process so it continues running independently
      childProcess.unref();
      
      logger.info(`AI microservice restart initiated with PID: ${childProcess.pid}`);
    } catch (error) {
      logger.error(`Failed to restart AI microservice: ${error}`);
    }
  }
}

// Export a singleton instance
export const microserviceHealthCheck = new MicroserviceHealthCheck();