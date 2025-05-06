/**
 * Notification Routes - Endpoints for managing notifications
 * 
 * These routes handle notification preferences, status, and manual triggering
 * of notifications for testing purposes.
 */

import { Router } from 'express';
import { z } from 'zod';
import { notificationScheduler } from './notification-scheduler';
import { logger } from './logger';
import { storage } from './storage';

export const notificationRouter = Router();

// Get notification settings for a user
notificationRouter.get('/api/notifications/settings', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  try {
    // Get the user's notification settings from storage
    const userId = req.user!.id;
    const userPreferences = await storage.getUserPreferences(userId);
    
    // Default settings if none exist yet
    const defaultSettings = {
      dailyDigest: true,
      matchAlerts: true,
      predictionResults: true,
      valueBetAlerts: false,
      timezone: 'Europe/London',
      digestTime: '07:00',
      pushEnabled: true
    };
    
    // Use stored settings or defaults
    const settings = userPreferences?.notificationSettings || defaultSettings;
    
    res.json(settings);
  } catch (error: any) {
    logger.error('[NotificationRoutes]', 'Error getting notification settings:', error);
    res.status(500).json({ error: 'Failed to get notification settings' });
  }
});

// Update notification settings for a user
notificationRouter.put('/api/notifications/settings', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  try {
    const schema = z.object({
      dailyDigest: z.boolean().optional(),
      matchAlerts: z.boolean().optional(),
      predictionResults: z.boolean().optional(),
      valueBetAlerts: z.boolean().optional(),
      timezone: z.string().optional(),
      digestTime: z.string().optional(),
      pushEnabled: z.boolean().optional()
    });
    
    const parseResult = schema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: parseResult.error.message });
    }
    
    const settings = parseResult.data;
    const userId = req.user!.id;
    
    // Get the current user preferences from storage
    const userPreferences = await storage.getUserPreferences(userId) || {};
    
    // Update the notification settings, preserving other preferences
    const updatedPreferences = {
      ...userPreferences,
      notificationSettings: {
        ...(userPreferences.notificationSettings || {}),
        ...settings
      }
    };
    
    // Save the updated preferences
    await storage.updateUserPreferences(userId, updatedPreferences);
    
    res.json({ 
      success: true, 
      message: 'Notification settings updated successfully',
      settings: updatedPreferences.notificationSettings
    });
  } catch (error: any) {
    logger.error('[NotificationRoutes]', 'Error updating notification settings:', error);
    res.status(500).json({ error: 'Failed to update notification settings' });
  }
});

// Get notification status (for admin use)
notificationRouter.get('/api/notifications/status', (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  // Only admins can access this endpoint
  if (!isAdmin(req)) {
    return res.status(403).json({ error: 'Forbidden - Admin access required' });
  }
  
  try {
    const status = notificationScheduler.getStatus();
    res.json(status);
  } catch (error: any) {
    logger.error('[NotificationRoutes]', 'Error getting notification status:', error);
    res.status(500).json({ error: 'Failed to get notification status' });
  }
});

// Get pending notifications (for admin use)
notificationRouter.get('/api/notifications/pending', (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  // Only admins can access this endpoint
  if (!isAdmin(req)) {
    return res.status(403).json({ error: 'Forbidden - Admin access required' });
  }
  
  try {
    const pendingNotifications = notificationScheduler.getPendingNotifications();
    res.json(pendingNotifications);
  } catch (error: any) {
    logger.error('[NotificationRoutes]', 'Error getting pending notifications:', error);
    res.status(500).json({ error: 'Failed to get pending notifications' });
  }
});

// Clear old notifications (for admin use)
notificationRouter.delete('/api/notifications/clear-old', (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  // Only admins can access this endpoint
  if (!isAdmin(req)) {
    return res.status(403).json({ error: 'Forbidden - Admin access required' });
  }
  
  try {
    const schema = z.object({
      olderThanDays: z.number().int().positive().default(7)
    });
    
    const parseResult = schema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: parseResult.error.message });
    }
    
    const { olderThanDays } = parseResult.data;
    
    const removedCount = notificationScheduler.clearOldNotifications(olderThanDays);
    
    res.json({ 
      success: true, 
      message: `Cleared ${removedCount} old notifications`, 
      removedCount 
    });
  } catch (error: any) {
    logger.error('[NotificationRoutes]', 'Error clearing old notifications:', error);
    res.status(500).json({ error: 'Failed to clear old notifications' });
  }
});

// Send a test notification to the current user
notificationRouter.post('/api/notifications/test', (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  try {
    const schema = z.object({
      type: z.enum(['daily_digest', 'match_alert', 'prediction_result', 'value_alert']).default('daily_digest'),
    });
    
    const parseResult = schema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: parseResult.error.message });
    }
    
    const { type } = parseResult.data;
    
    const userId = req.user!.id;
    
    // For now, we'll just schedule a notification for 10 seconds from now
    const scheduledFor = new Date(Date.now() + 10 * 1000);
    
    let notificationData;
    
    switch (type) {
      case 'daily_digest':
        notificationData = {
          title: 'Test: Your PuntaIQ Daily Prediction Digest',
          message: 'This is a test of your daily prediction digest'
        };
        break;
      case 'match_alert':
        notificationData = {
          title: 'Test: Upcoming Match Alert',
          message: 'This is a test of your match alert notification',
          matchId: 'test-match-1'
        };
        break;
      case 'prediction_result':
        notificationData = {
          title: 'Test: Prediction Result',
          message: 'This is a test of your prediction result notification',
          predictionId: 'test-prediction-1',
          result: 'win'
        };
        break;
      case 'value_alert':
        notificationData = {
          title: 'Test: Value Bet Alert',
          message: 'This is a test of your value bet alert notification',
          matchId: 'test-match-1',
          marketType: '1X2',
          value: 15
        };
        break;
    }
    
    // In a real implementation, we would get the user's timezone from storage
    const timezone = 'Europe/London';
    
    notificationScheduler.scheduleNotification({
      id: `test-notification-${userId}-${Date.now()}`,
      userId,
      type,
      scheduledFor,
      timezone,
      status: 'pending',
      data: notificationData
    });
    
    res.json({ 
      success: true, 
      message: `Test ${type} notification scheduled for ${scheduledFor.toISOString()}` 
    });
  } catch (error: any) {
    logger.error('[NotificationRoutes]', 'Error sending test notification:', error);
    res.status(500).json({ error: 'Failed to send test notification' });
  }
});

// Helper function to check if the user is an admin
function isAdmin(req: any): boolean {
  return req.isAuthenticated() && req.user?.role === 'admin';
}