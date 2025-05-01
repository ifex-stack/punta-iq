import cron from 'node-cron';
import { logger } from '../../logger';
import { MLServiceClient } from '../../ml-service-client';
import { db } from '../../db';
import { getMessagingInstance } from '../../firebase-admin';

/**
 * System health monitor that checks the health of various components
 * and services to ensure the platform is running optimally.
 */
export class SystemHealthMonitor {
  private mlServiceClient: MLServiceClient;
  private healthCheckJob: any;
  private apiStatusJob: any;
  
  // Statuses for different components
  private mlServiceStatus = {
    healthy: false,
    lastCheck: new Date(),
    error: null,
  };
  
  private apiStatus = {
    football: { healthy: false, lastCheck: new Date(), error: null },
    basketball: { healthy: false, lastCheck: new Date(), error: null },
    odds: { healthy: false, lastCheck: new Date(), error: null },
    // Add other APIs as needed
  };
  
  constructor() {
    this.mlServiceClient = new MLServiceClient();
    
    // Setup scheduled jobs
    this.setupJobs();
    
    logger.info('[SystemHealthMonitor]', 'System health monitor initialized');
  }
  
  /**
   * Set up scheduled monitoring jobs
   */
  private setupJobs() {
    // Check ML service health every 15 minutes
    this.healthCheckJob = cron.schedule('*/15 * * * *', () => {
      this.checkMlServiceHealth();
    });
    
    // Check API status every hour
    this.apiStatusJob = cron.schedule('0 * * * *', () => {
      this.checkApiStatus();
    });
    
    logger.info('[SystemHealthMonitor]', 'Health monitoring jobs scheduled');
  }
  
  /**
   * Check ML service health
   */
  async checkMlServiceHealth() {
    try {
      logger.info('[SystemHealthMonitor]', 'Checking ML service health');
      
      const healthResult = await this.mlServiceClient.healthCheck();
      
      // Update status
      this.mlServiceStatus = {
        healthy: healthResult.status === 'healthy',
        lastCheck: new Date(),
        error: healthResult.status !== 'healthy' ? healthResult : null,
      };
      
      logger.info('[SystemHealthMonitor]', 'ML service health check complete', { 
        status: this.mlServiceStatus.healthy ? 'healthy' : 'unhealthy',
        version: healthResult.version
      });
      
      // Alert if unhealthy
      if (!this.mlServiceStatus.healthy) {
        await this.alertOnUnhealthyService('ML Service', this.mlServiceStatus.error);
      }
    } catch (error) {
      logger.error('[SystemHealthMonitor]', 'Error checking ML service health', { error });
      
      this.mlServiceStatus = {
        healthy: false,
        lastCheck: new Date(),
        error,
      };
      
      await this.alertOnUnhealthyService('ML Service', error);
    }
  }
  
  /**
   * Check API status for various sports data providers
   */
  async checkApiStatus() {
    try {
      logger.info('[SystemHealthMonitor]', 'Checking API status');
      
      // Check football API
      await this.checkFootballApiStatus();
      
      // Check basketball API
      await this.checkBasketballApiStatus();
      
      // Check odds API
      await this.checkOddsApiStatus();
      
      // Check other APIs as needed
      
      logger.info('[SystemHealthMonitor]', 'API status check complete', { 
        football: this.apiStatus.football.healthy ? 'healthy' : 'unhealthy',
        basketball: this.apiStatus.basketball.healthy ? 'healthy' : 'unhealthy',
        odds: this.apiStatus.odds.healthy ? 'healthy' : 'unhealthy',
      });
      
      // Alert on any unhealthy APIs
      for (const [api, status] of Object.entries(this.apiStatus)) {
        if (!status.healthy) {
          await this.alertOnUnhealthyService(`${api.toUpperCase()} API`, status.error);
        }
      }
    } catch (error) {
      logger.error('[SystemHealthMonitor]', 'Error checking API status', { error });
    }
  }
  
  /**
   * Check football API status
   */
  private async checkFootballApiStatus() {
    try {
      // Implementation depends on the sports API being used
      // This would make a lightweight call to the football API to check its status
      
      // For simplicity, assume success if no error is thrown
      this.apiStatus.football = {
        healthy: true,
        lastCheck: new Date(),
        error: null,
      };
    } catch (error) {
      logger.error('[SystemHealthMonitor]', 'Football API status check failed', { error });
      
      this.apiStatus.football = {
        healthy: false,
        lastCheck: new Date(),
        error,
      };
    }
  }
  
  /**
   * Check basketball API status
   */
  private async checkBasketballApiStatus() {
    try {
      // Implementation depends on the sports API being used
      // This would make a lightweight call to the basketball API to check its status
      
      // For simplicity, assume success if no error is thrown
      this.apiStatus.basketball = {
        healthy: true,
        lastCheck: new Date(),
        error: null,
      };
    } catch (error) {
      logger.error('[SystemHealthMonitor]', 'Basketball API status check failed', { error });
      
      this.apiStatus.basketball = {
        healthy: false,
        lastCheck: new Date(),
        error,
      };
    }
  }
  
  /**
   * Check odds API status
   */
  private async checkOddsApiStatus() {
    try {
      // Implementation depends on the odds API being used
      // This would make a lightweight call to the odds API to check its status
      
      // For simplicity, assume success if no error is thrown
      this.apiStatus.odds = {
        healthy: true,
        lastCheck: new Date(),
        error: null,
      };
    } catch (error) {
      logger.error('[SystemHealthMonitor]', 'Odds API status check failed', { error });
      
      this.apiStatus.odds = {
        healthy: false,
        lastCheck: new Date(),
        error,
      };
    }
  }
  
  /**
   * Alert on unhealthy service (send admin notification)
   */
  private async alertOnUnhealthyService(serviceName: string, error: any) {
    try {
      logger.warn('[SystemHealthMonitor]', `Service unhealthy: ${serviceName}`, { error });
      
      // In production, you would send alerts to admins via email, SMS, etc.
      // For now, just log the alert
      logger.info('[SystemHealthMonitor]', `ALERT: ${serviceName} is unhealthy`, { 
        timestamp: new Date().toISOString(),
        errorMessage: error?.message || 'Unknown error',
      });
      
      // Send notification to admin users
      // This is an example of how you might do it with Firebase
      if (process.env.NODE_ENV === 'production') {
        const messaging = getMessagingInstance();
        
        // Get admin user FCM tokens - in a real scenario, you'd get this from your database
        // const adminTokens = await db.getAdminFcmTokens(); 
        
        // For demonstration purposes
        const adminTokens = ['admin_token_would_be_here_in_production'];
        
        if (adminTokens.length > 0) {
          await messaging.sendMulticast({
            notification: {
              title: `PuntaIQ System Alert`,
              body: `Service unhealthy: ${serviceName}`,
            },
            data: {
              type: 'system_alert',
              service: serviceName,
              timestamp: new Date().toISOString(),
              errorDetails: error ? JSON.stringify(error) : 'Unknown error',
            },
            tokens: adminTokens,
          });
        }
      }
    } catch (alertError) {
      logger.error('[SystemHealthMonitor]', 'Error sending service alert', { alertError, service: serviceName });
    }
  }
  
  /**
   * Get current system health status
   */
  getHealthStatus() {
    return {
      mlService: this.mlServiceStatus,
      apis: this.apiStatus,
      lastChecked: new Date(),
      systemTime: new Date(),
    };
  }
  
  /**
   * Start monitoring
   */
  start() {
    this.healthCheckJob.start();
    this.apiStatusJob.start();
    logger.info('[SystemHealthMonitor]', 'System health monitoring started');
    
    // Run an immediate health check
    this.checkMlServiceHealth();
    this.checkApiStatus();
  }
  
  /**
   * Stop monitoring
   */
  stop() {
    this.healthCheckJob.stop();
    this.apiStatusJob.stop();
    logger.info('[SystemHealthMonitor]', 'System health monitoring stopped');
  }
}

// Create a singleton instance
let monitorInstance: SystemHealthMonitor | null = null;

/**
 * Get the system health monitor instance
 */
export function getSystemHealthMonitor(): SystemHealthMonitor {
  if (!monitorInstance) {
    monitorInstance = new SystemHealthMonitor();
  }
  return monitorInstance;
}