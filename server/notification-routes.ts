import { Router } from 'express';
import { z } from 'zod';
import { db } from './db';
import { logger } from './logger';
import { pushTokens, insertPushTokenSchema } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { 
  sendPushNotification,
  sendMulticastPushNotification,
  sendTopicPushNotification,
  subscribeToTopic
} from './firebase-admin';

export const notificationRouter = Router();

// Register a device for push notifications
notificationRouter.post('/api/notifications/register-device', async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const schema = z.object({
      token: z.string().min(1),
      deviceType: z.enum(['android', 'ios', 'web']).optional(),
    });

    const parseResult = schema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: parseResult.error.message });
    }

    const { token, deviceType = 'web' } = parseResult.data;
    const userId = req.user!.id;

    // Check if this token is already registered for this user
    const existingToken = await db.select()
      .from(pushTokens)
      .where(
        eq(pushTokens.token, token)
      )
      .limit(1);

    // If token already exists, just return success
    if (existingToken.length > 0) {
      // Update last active time
      await db.update(pushTokens)
        .set({ lastUsedAt: new Date() })
        .where(eq(pushTokens.token, token));
        
      return res.json({ success: true, message: 'Token already registered' });
    }

    // Insert the new token
    const tokenData = insertPushTokenSchema.parse({
      userId,
      token,
      platform: deviceType, // Map deviceType to platform
      deviceName: 'Web Browser', // Default device name for web
    });

    await db.insert(pushTokens).values(tokenData);
    
    // Subscribe to topics based on user preferences
    if (req.user!.notificationSettings?.predictions) {
      await subscribeToTopic(token, 'predictions');
    }
    
    if (req.user!.notificationSettings?.results) {
      await subscribeToTopic(token, 'results');
    }
    
    if (req.user!.notificationSettings?.promotions) {
      await subscribeToTopic(token, 'promotions');
    }

    res.json({ success: true });
  } catch (error) {
    logger.error('[NotificationRoutes]', 'Error registering device:', error);
    res.status(500).json({ error: 'Failed to register device for notifications' });
  }
});

// Update notification settings
notificationRouter.post('/api/notifications/settings', async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const schema = z.object({
      predictions: z.boolean().optional(),
      results: z.boolean().optional(),
      promotions: z.boolean().optional(),
    });

    const parseResult = schema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: parseResult.error.message });
    }

    const settings = parseResult.data;
    const userId = req.user!.id;
    
    // Get current settings from user
    const currentSettings = req.user!.notificationSettings || {
      predictions: true,
      results: true,
      promotions: false,
    };
    
    // Merge new settings with current settings
    const updatedSettings = {
      ...currentSettings,
      ...settings,
    };
    
    // Update user settings in the database
    // Note: This would depend on your actual user update implementation
    // This is just a placeholder example
    /*
    await db.update(users)
      .set({ notificationSettings: updatedSettings })
      .where(eq(users.id, userId));
    */
    
    // Get all tokens for this user
    const userTokens = await db.select()
      .from(pushTokens)
      .where(eq(pushTokens.userId, userId));
      
    const tokenList = userTokens.map(t => t.token);
    
    // Update topic subscriptions based on new settings
    for (const token of tokenList) {
      // TODO: Add code to subscribe/unsubscribe from topics based on new settings
    }

    res.json({ success: true, settings: updatedSettings });
  } catch (error) {
    logger.error('[NotificationRoutes]', 'Error updating notification settings:', error);
    res.status(500).json({ error: 'Failed to update notification settings' });
  }
});

// Send test notification (admin only)
notificationRouter.post('/api/notifications/test', async (req, res) => {
  try {
    // Check if user is authenticated and is admin
    if (!req.isAuthenticated() || req.user!.id !== 1) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const schema = z.object({
      token: z.string().optional(),
      title: z.string().default('Test Notification'),
      body: z.string().default('This is a test notification from PuntaIQ'),
      data: z.record(z.string()).optional(),
    });

    const parseResult = schema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: parseResult.error.message });
    }

    const { token, title, body, data = {} } = parseResult.data;

    if (token) {
      // Send to specific token
      const result = await sendPushNotification(token, title, body, data);
      return res.json(result);
    } else {
      // Send to admin user
      const adminTokens = await db.select()
        .from(deviceTokens)
        .where(eq(deviceTokens.userId, 1))
        .limit(10);
        
      if (adminTokens.length === 0) {
        return res.status(404).json({ error: 'No tokens found for admin user' });
      }
      
      const tokens = adminTokens.map(t => t.token);
      const result = await sendMulticastPushNotification(tokens, title, body, data);
      return res.json(result);
    }
  } catch (error) {
    logger.error('[NotificationRoutes]', 'Error sending test notification:', error);
    res.status(500).json({ error: 'Failed to send test notification' });
  }
});

// Get all notifications for the current user
notificationRouter.get('/api/notifications', async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // This is a placeholder - in a real implementation, you would
    // fetch notifications from your database
    const notifications = [
      {
        id: 1,
        title: 'New Prediction',
        message: 'Manchester City vs Liverpool prediction is now available',
        isRead: false,
        createdAt: new Date().toISOString()
      },
      {
        id: 2,
        title: 'Prediction Result',
        message: 'Your Bayern Munich prediction was correct!',
        isRead: false,
        createdAt: new Date().toISOString()
      },
      {
        id: 3,
        title: 'Special Offer',
        message: '50% off Elite subscription for the next 24 hours',
        isRead: true,
        createdAt: new Date().toISOString()
      }
    ];

    res.json(notifications);
  } catch (error) {
    logger.error('[NotificationRoutes]', 'Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Mark notification as read
notificationRouter.put('/api/notifications/:id/read', async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid notification ID' });
    }

    // This is a placeholder - in a real implementation, you would
    // update the notification in your database
    
    res.json({ success: true });
  } catch (error) {
    logger.error('[NotificationRoutes]', 'Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});