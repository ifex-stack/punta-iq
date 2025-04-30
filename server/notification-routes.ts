import { Router } from 'express';
import { z } from 'zod';
import { db } from './db';
import { logger } from './logger';
import { pushTokens, insertPushTokenSchema, users } from '@shared/schema';
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
    
    // Get user notification settings
    const settings = req.user!.notificationSettings || {
      general: {
        predictions: true,
        results: true,
        promotions: false,
      },
      sports: {
        football: true,
        basketball: true,
        tennis: true,
        baseball: true,
        hockey: true,
        cricket: true,
        formula1: true,
        mma: true,
        volleyball: true,
        other: true,
      }
    };
    
    // Subscribe to general topics based on user preferences
    if (settings.general?.predictions) {
      await subscribeToTopic(token, 'predictions');
    }
    
    if (settings.general?.results) {
      await subscribeToTopic(token, 'results');
    }
    
    if (settings.general?.promotions) {
      await subscribeToTopic(token, 'promotions');
    }
    
    // Subscribe to sport-specific topics
    if (settings.sports) {
      for (const [sport, isEnabled] of Object.entries(settings.sports)) {
        if (isEnabled) {
          await subscribeToTopic(token, `sport_${sport}`);
        }
      }
    }
    
    // Update notification metrics
    const metrics = settings.metrics || {
      notificationCount: 0,
      lastNotificationSent: null,
      clickThroughRate: 0,
    };
    
    // Store the initial metrics if not already present
    if (!req.user!.notificationSettings?.metrics) {
      await db.update(users)
        .set({ 
          notificationSettings: {
            ...settings,
            metrics
          }
        })
        .where(eq(users.id, userId));
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
      settings: z.object({
        general: z.object({
          predictions: z.boolean().optional(),
          results: z.boolean().optional(),
          promotions: z.boolean().optional(),
        }).optional(),
        sports: z.object({
          football: z.boolean().optional(),
          basketball: z.boolean().optional(),
          tennis: z.boolean().optional(),
          baseball: z.boolean().optional(),
          hockey: z.boolean().optional(),
          cricket: z.boolean().optional(),
          formula1: z.boolean().optional(),
          mma: z.boolean().optional(),
          volleyball: z.boolean().optional(),
          other: z.boolean().optional(),
        }).optional(),
      }),
    });

    const parseResult = schema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: parseResult.error.message });
    }

    const { settings } = parseResult.data;
    const userId = req.user!.id;
    
    // Get current settings from user
    const currentSettings = req.user!.notificationSettings || {
      general: {
        predictions: true,
        results: true,
        promotions: false,
      },
      sports: {
        football: true,
        basketball: true,
        tennis: true,
        baseball: true,
        hockey: true,
        cricket: true,
        formula1: true,
        mma: true,
        volleyball: true,
        other: true,
      },
      metrics: {
        notificationCount: 0,
        lastNotificationSent: null,
        clickThroughRate: 0,
      }
    };
    
    // Deep merge the settings
    const updatedSettings = {
      ...currentSettings,
      general: {
        ...currentSettings.general,
        ...settings.general,
      },
      sports: {
        ...currentSettings.sports,
        ...settings.sports,
      },
      // Preserve metrics
      metrics: currentSettings.metrics || {
        notificationCount: 0,
        lastNotificationSent: null,
        clickThroughRate: 0,
      }
    };
    
    // Update user settings in the database
    await db.update(users)
      .set({ notificationSettings: updatedSettings })
      .where(eq(users.id, userId));
    
    // Get all tokens for this user
    const userTokens = await db.select()
      .from(pushTokens)
      .where(eq(pushTokens.userId, userId));
      
    const tokenList = userTokens.map(t => t.token);
    
    // Track if we need to update topic subscriptions
    const generalChanged = settings.general !== undefined;
    const sportsChanged = settings.sports !== undefined;
    
    // Update topic subscriptions based on new settings
    if (generalChanged || sportsChanged) {
      for (const token of tokenList) {
        // Handle general notification topics
        if (generalChanged) {
          if (updatedSettings.general.predictions) {
            await subscribeToTopic(token, 'predictions');
          }
          
          if (updatedSettings.general.results) {
            await subscribeToTopic(token, 'results');
          }
          
          if (updatedSettings.general.promotions) {
            await subscribeToTopic(token, 'promotions');
          }
        }
        
        // Handle sport-specific topics
        if (sportsChanged) {
          // Subscribe to each enabled sport
          Object.entries(updatedSettings.sports).forEach(async ([sport, isEnabled]) => {
            if (isEnabled) {
              await subscribeToTopic(token, `sport_${sport}`);
            }
          });
        }
      }
    }

    res.json({ success: true, settings: updatedSettings });
  } catch (error) {
    logger.error('[NotificationRoutes]', 'Error updating notification settings:', error);
    res.status(500).json({ error: 'Failed to update notification settings' });
  }
});

// Public endpoint for sending a test notification to a topic
notificationRouter.post('/api/notifications/send-test', async (req, res) => {
  try {
    const schema = z.object({
      title: z.string().default('Test Notification'),
      body: z.string().default('This is a test notification from PuntaIQ'),
      topic: z.string().default('all_users'),
      data: z.record(z.string()).optional(),
    });

    const parseResult = schema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: parseResult.error.message });
    }

    const { title, body, topic, data = {} } = parseResult.data;
    
    // Send to the specified topic
    const result = await sendTopicPushNotification(topic, title, body, data);
    logger.info('[NotificationRoutes]', 'Test notification sent to topic:', topic);
    
    return res.json({ success: true, message: `Test notification sent to topic: ${topic}`, result });
  } catch (error) {
    logger.error('[NotificationRoutes]', 'Error sending test topic notification:', error);
    res.status(500).json({ error: 'Failed to send test notification to topic' });
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
        .from(pushTokens)
        .where(eq(pushTokens.userId, 1))
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

// Track notification metrics
notificationRouter.post('/api/notifications/metrics', async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const schema = z.object({
      notificationId: z.string().or(z.number()),
      action: z.enum(['click', 'view', 'dismiss']),
      metadata: z.record(z.any()).optional(),
    });

    const parseResult = schema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: parseResult.error.message });
    }

    const { notificationId, action, metadata } = parseResult.data;
    const userId = req.user!.id;
    
    // Get current settings from user
    const currentSettings = req.user!.notificationSettings || {
      general: {
        predictions: true,
        results: true,
        promotions: false,
      },
      sports: {
        football: true,
        basketball: true,
        tennis: true,
        baseball: true,
        hockey: true,
        cricket: true,
        formula1: true,
        mma: true,
        volleyball: true,
        other: true,
      },
      metrics: {
        notificationCount: 0,
        lastNotificationSent: null,
        clickThroughRate: 0,
        viewCount: 0,
        dismissCount: 0,
        clickCount: 0,
      }
    };
    
    // Get or create metrics object
    let metrics = currentSettings.metrics || {
      notificationCount: 0,
      lastNotificationSent: null,
      clickThroughRate: 0,
      viewCount: 0,
      dismissCount: 0,
      clickCount: 0,
    };
    
    // Update metrics based on action
    switch (action) {
      case 'click':
        metrics.clickCount = (metrics.clickCount || 0) + 1;
        // Update click-through rate: clicks / total notifications
        if (metrics.notificationCount > 0) {
          metrics.clickThroughRate = metrics.clickCount / metrics.notificationCount;
        }
        break;
      case 'view':
        metrics.viewCount = (metrics.viewCount || 0) + 1;
        break;
      case 'dismiss':
        metrics.dismissCount = (metrics.dismissCount || 0) + 1;
        break;
    }
    
    // Update user settings with new metrics
    const updatedSettings = {
      ...currentSettings,
      metrics,
    };
    
    // Save to database
    await db.update(users)
      .set({ notificationSettings: updatedSettings })
      .where(eq(users.id, userId));
    
    // Also track this metric in a dedicated log (optional)
    logger.info('[NotificationMetrics]', {
      userId,
      notificationId, 
      action,
      timestamp: new Date().toISOString(),
      ...(metadata || {})
    });
    
    res.json({ success: true, metrics });
  } catch (error) {
    logger.error('[NotificationRoutes]', 'Error tracking notification metrics:', error);
    res.status(500).json({ error: 'Failed to track notification metrics' });
  }
});

// Admin endpoint to get aggregated notification metrics
notificationRouter.get('/api/admin/notification-metrics', async (req, res) => {
  try {
    // Check if user is authenticated and is admin
    if (!req.isAuthenticated() || req.user!.id !== 1) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    // Get all users with notification metrics
    const usersWithMetrics = await db.select()
      .from(users)
      .where(
        // Only select users who have interacted with notifications
        // This is a simplification and may need to be refined based on your schema
        eq(users.id, users.id)
      );
    
    // Aggregate metrics across all users
    let totalNotifications = 0;
    let totalViews = 0;
    let totalClicks = 0;
    let totalDismisses = 0;
    
    // Sport-specific metrics
    const sportMetrics = {
      football: { sent: 0, clicked: 0, ctr: 0 },
      basketball: { sent: 0, clicked: 0, ctr: 0 },
      tennis: { sent: 0, clicked: 0, ctr: 0 },
      baseball: { sent: 0, clicked: 0, ctr: 0 },
      hockey: { sent: 0, clicked: 0, ctr: 0 },
      cricket: { sent: 0, clicked: 0, ctr: 0 },
      formula1: { sent: 0, clicked: 0, ctr: 0 },
      mma: { sent: 0, clicked: 0, ctr: 0 },
      volleyball: { sent: 0, clicked: 0, ctr: 0 },
      other: { sent: 0, clicked: 0, ctr: 0 },
    };
    
    // Process each user's metrics
    for (const user of usersWithMetrics) {
      if (user.notificationSettings && user.notificationSettings.metrics) {
        const userMetrics = user.notificationSettings.metrics;
        
        // Accumulate totals
        totalNotifications += userMetrics.notificationCount || 0;
        totalViews += userMetrics.viewCount || 0;
        totalClicks += userMetrics.clickCount || 0;
        totalDismisses += userMetrics.dismissCount || 0;
        
        // For demonstration purposes, let's just distribute some sample data
        // In a real implementation, you'd have sport-specific metrics stored per notification
        if (userMetrics.notificationCount > 0) {
          // Just distribute random percentages of the metrics to different sports
          // This is just for demo purposes and should be replaced with real tracking
          const sportsList = Object.keys(sportMetrics);
          for (const sport of sportsList) {
            if (Math.random() > 0.3) { // Randomly distribute metrics
              const sentCount = Math.floor(userMetrics.notificationCount * Math.random() * 0.3);
              const clickedCount = Math.floor(sentCount * Math.random());
              
              sportMetrics[sport].sent += sentCount;
              sportMetrics[sport].clicked += clickedCount;
              
              // Update CTR for this sport
              if (sportMetrics[sport].sent > 0) {
                sportMetrics[sport].ctr = sportMetrics[sport].clicked / sportMetrics[sport].sent;
              }
            }
          }
        }
      }
    }
    
    // Calculate overall click-through rate
    const overallCTR = totalNotifications > 0 ? totalClicks / totalNotifications : 0;
    
    // Return aggregated metrics
    res.json({
      notificationCount: totalNotifications,
      viewCount: totalViews,
      clickCount: totalClicks,
      dismissCount: totalDismisses,
      clickThroughRate: overallCTR,
      bySport: sportMetrics
    });
  } catch (error) {
    logger.error('[NotificationRoutes]', 'Error fetching notification metrics:', error);
    res.status(500).json({ error: 'Failed to fetch notification metrics' });
  }
});