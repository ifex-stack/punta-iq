import { Express } from 'express';
import { automationManager } from './index';
import { logger } from '../logger';

/**
 * Setup routes for managing automation
 */
export function setupAutomationRoutes(app: Express): void {
  // Get system health status
  app.get('/api/admin/system-health', async (req, res) => {
    try {
      // In production, ensure this is restricted to admin users
      if (req.isAuthenticated() && isAdmin(req.user)) {
        const healthStatus = automationManager.getSystemHealth();
        
        res.json({
          success: true,
          data: healthStatus
        });
      } else {
        res.status(403).json({ 
          success: false, 
          message: 'Unauthorized access to system health' 
        });
      }
    } catch (error) {
      logger.error('[AutomationRoutes]', 'Error getting system health', { error });
      res.status(500).json({ 
        success: false, 
        message: 'Error retrieving system health' 
      });
    }
  });
  
  // Manually trigger prediction generation (admin only)
  app.post('/api/admin/trigger-predictions', async (req, res) => {
    try {
      // In production, ensure this is restricted to admin users
      if (req.isAuthenticated() && isAdmin(req.user)) {
        logger.info('[AutomationRoutes]', 'Admin triggered manual prediction generation', { 
          userId: req.user.id, 
          timestamp: new Date().toISOString() 
        });
        
        // Trigger prediction generation
        await automationManager.triggerPredictionGeneration();
        
        res.json({
          success: true,
          message: 'Prediction generation triggered successfully',
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(403).json({ 
          success: false, 
          message: 'Unauthorized access to trigger predictions' 
        });
      }
    } catch (error) {
      logger.error('[AutomationRoutes]', 'Error triggering predictions', { error });
      res.status(500).json({ 
        success: false, 
        message: 'Error triggering predictions'
      });
    }
  });
  
  // Start all automated processes (admin only)
  app.post('/api/admin/start-automation', async (req, res) => {
    try {
      // In production, ensure this is restricted to admin users
      if (req.isAuthenticated() && isAdmin(req.user)) {
        logger.info('[AutomationRoutes]', 'Admin started automation', { 
          userId: req.user.id, 
          timestamp: new Date().toISOString() 
        });
        
        // Start automation
        await automationManager.startAll();
        
        res.json({
          success: true,
          message: 'Automation started successfully',
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(403).json({ 
          success: false, 
          message: 'Unauthorized access to start automation' 
        });
      }
    } catch (error) {
      logger.error('[AutomationRoutes]', 'Error starting automation', { error });
      res.status(500).json({ 
        success: false, 
        message: 'Error starting automation'
      });
    }
  });
  
  // Stop all automated processes (admin only)
  app.post('/api/admin/stop-automation', async (req, res) => {
    try {
      // In production, ensure this is restricted to admin users
      if (req.isAuthenticated() && isAdmin(req.user)) {
        logger.info('[AutomationRoutes]', 'Admin stopped automation', { 
          userId: req.user.id, 
          timestamp: new Date().toISOString() 
        });
        
        // Stop automation
        await automationManager.stopAll();
        
        res.json({
          success: true,
          message: 'Automation stopped successfully',
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(403).json({ 
          success: false, 
          message: 'Unauthorized access to stop automation' 
        });
      }
    } catch (error) {
      logger.error('[AutomationRoutes]', 'Error stopping automation', { error });
      res.status(500).json({ 
        success: false, 
        message: 'Error stopping automation'
      });
    }
  });
}

/**
 * Check if a user is an admin
 * This is a simple implementation - in production, you'd check the user's role
 */
function isAdmin(user: any): boolean {
  // In this example, we're checking if the user has an admin role
  return user && (user.role === 'admin' || user.isAdmin === true);
}