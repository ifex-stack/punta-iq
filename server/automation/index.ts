import { logger } from '../logger';
import { getPredictionScheduler } from './schedulers/prediction-scheduler';
import { getSystemHealthMonitor } from './monitors/system-health-monitor';

/**
 * Main automation module that initializes and manages all automated processes.
 */
export class AutomationManager {
  private static instance: AutomationManager;
  private initialized = false;
  private running = false;
  
  // Scheduler and monitor instances
  private predictionScheduler: ReturnType<typeof getPredictionScheduler>;
  private systemHealthMonitor: ReturnType<typeof getSystemHealthMonitor>;
  
  private constructor() {
    // Private constructor for singleton
  }
  
  /**
   * Get the singleton instance
   */
  public static getInstance(): AutomationManager {
    if (!AutomationManager.instance) {
      AutomationManager.instance = new AutomationManager();
    }
    return AutomationManager.instance;
  }
  
  /**
   * Initialize the automation manager
   */
  public async initialize(): Promise<void> {
    if (this.initialized) {
      logger.info('[AutomationManager]', 'Already initialized');
      return;
    }
    
    try {
      logger.info('[AutomationManager]', 'Initializing automation manager');
      
      // Initialize prediction scheduler
      this.predictionScheduler = getPredictionScheduler();
      
      // Initialize system health monitor
      this.systemHealthMonitor = getSystemHealthMonitor();
      
      this.initialized = true;
      logger.info('[AutomationManager]', 'Automation manager initialized successfully');
    } catch (error) {
      logger.error('[AutomationManager]', 'Error initializing automation manager', { error });
      throw error;
    }
  }
  
  /**
   * Start all automated processes
   */
  public async startAll(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
    
    try {
      logger.info('[AutomationManager]', 'Starting all automated processes');
      
      // Start prediction scheduler
      this.predictionScheduler.start();
      
      // Start system health monitor
      this.systemHealthMonitor.start();
      
      this.running = true;
      logger.info('[AutomationManager]', 'All automated processes started successfully');
    } catch (error) {
      logger.error('[AutomationManager]', 'Error starting automated processes', { error });
      throw error;
    }
  }
  
  /**
   * Stop all automated processes
   */
  public async stopAll(): Promise<void> {
    if (!this.initialized) {
      logger.warn('[AutomationManager]', 'Cannot stop - not initialized');
      return;
    }
    
    try {
      logger.info('[AutomationManager]', 'Stopping all automated processes');
      
      // Stop prediction scheduler
      this.predictionScheduler.stop();
      
      // Stop system health monitor
      this.systemHealthMonitor.stop();
      
      this.running = false;
      logger.info('[AutomationManager]', 'All automated processes stopped successfully');
    } catch (error) {
      logger.error('[AutomationManager]', 'Error stopping automated processes', { error });
      throw error;
    }
  }
  
  /**
   * Get prediction scheduler instance
   */
  public getPredictionScheduler() {
    return this.predictionScheduler;
  }
  
  /**
   * Get system health monitor instance
   */
  public getSystemHealthMonitor() {
    return this.systemHealthMonitor;
  }
  
  /**
   * Manually trigger prediction generation
   * Useful for testing or on-demand generation
   */
  public async triggerPredictionGeneration(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
    
    try {
      logger.info('[AutomationManager]', 'Manually triggering prediction generation');
      await this.predictionScheduler.triggerPredictionGeneration();
      logger.info('[AutomationManager]', 'Manual prediction generation completed');
    } catch (error) {
      logger.error('[AutomationManager]', 'Error triggering prediction generation', { error });
      throw error;
    }
  }
  
  /**
   * Get current system health status
   */
  public getSystemHealth() {
    if (!this.initialized) {
      return {
        initialized: false,
        status: 'not_initialized',
        timestamp: new Date(),
      };
    }
    
    return {
      initialized: true,
      status: 'operational',
      timestamp: new Date(),
      details: this.systemHealthMonitor.getHealthStatus(),
    };
  }
}

// Export singleton instance
export const automationManager = AutomationManager.getInstance();

// Export schedulers and monitors
export { getPredictionScheduler } from './schedulers/prediction-scheduler';
export { getSystemHealthMonitor } from './monitors/system-health-monitor';