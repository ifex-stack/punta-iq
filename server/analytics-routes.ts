/**
 * API routes for analytics tracking
 */
import { Router, Request, Response } from 'express';
import { analytics, AnalyticsEventType, AnalyticsProperties } from './analytics-service';
import { createContextLogger } from './logger';
import { requireAdmin, requireAnalyst } from './middleware/role-auth';

// Set up logging for this module
const logger = createContextLogger('AnalyticsRoutes');

export const analyticsRouter = Router();

/**
 * Endpoint for recording client-side events
 * POST /api/analytics/event
 */
analyticsRouter.post('/event', (req: Request, res: Response) => {
  try {
    const { eventType, properties = {} } = req.body;
    
    // Validate event type
    if (!Object.values(AnalyticsEventType).includes(eventType)) {
      return res.status(400).json({
        message: `Invalid event type: ${eventType}`
      });
    }
    
    // Add authenticated user ID if available
    if (req.isAuthenticated() && req.user) {
      properties.userId = req.user.id;
    }
    
    // Add client info from request if not provided
    if (!properties.browserInfo) {
      properties.browserInfo = req.headers['user-agent'] || 'unknown';
    }
    
    // Add request IP (could be used for geo-location)
    const ip = req.headers['x-forwarded-for'] || 
               req.socket.remoteAddress || 
               'unknown';
    properties.ip = typeof ip === 'string' ? ip : ip[0];
    
    // Track the event
    analytics.trackEvent(eventType as AnalyticsEventType, properties);
    
    return res.status(200).json({ success: true });
  } catch (error) {
    logger.error('Error tracking analytics event', { error });
    return res.status(500).json({
      message: 'Failed to track analytics event'
    });
  }
});

/**
 * Endpoint for recording performance metrics
 * POST /api/analytics/performance
 */
analyticsRouter.post('/performance', (req: Request, res: Response) => {
  try {
    const { metric, value, context = {} } = req.body;
    
    // Validate required fields
    if (!metric || value === undefined) {
      return res.status(400).json({
        message: 'Missing required fields: metric and value are required'
      });
    }
    
    // Add authenticated user ID if available
    if (req.isAuthenticated() && req.user) {
      context.userId = req.user.id;
    }
    
    // Add client info
    context.browserInfo = req.headers['user-agent'] || 'unknown';
    
    // Track as performance event
    analytics.trackEvent(AnalyticsEventType.APP_PERFORMANCE, {
      ...context,
      performanceMetric: metric,
      value
    });
    
    return res.status(200).json({ success: true });
  } catch (error) {
    logger.error('Error tracking performance metric', { error });
    return res.status(500).json({
      message: 'Failed to track performance metric'
    });
  }
});

/**
 * Endpoint for recording client errors
 * POST /api/analytics/error
 */
analyticsRouter.post('/error', (req: Request, res: Response) => {
  try {
    const { errorCode, message, path, context = {} } = req.body;
    
    // Validate required fields
    if (!message) {
      return res.status(400).json({
        message: 'Missing required fields: message is required'
      });
    }
    
    // Add authenticated user ID if available
    if (req.isAuthenticated() && req.user) {
      context.userId = req.user.id;
    }
    
    // Add client info
    context.browserInfo = req.headers['user-agent'] || 'unknown';
    
    // Track the error
    analytics.trackEvent(AnalyticsEventType.ERROR_OCCURRENCE, {
      ...context,
      errorCode: errorCode || 'CLIENT_ERROR',
      errorMessage: message,
      path: path || req.headers.referer || 'unknown'
    });
    
    return res.status(200).json({ success: true });
  } catch (error) {
    logger.error('Error tracking client error', { error });
    return res.status(500).json({
      message: 'Failed to track client error'
    });
  }
});

/**
 * Endpoint for recording feature usage
 * POST /api/analytics/feature
 */
analyticsRouter.post('/feature', (req: Request, res: Response) => {
  try {
    const { featureName, source } = req.body;
    
    // Validate required fields
    if (!featureName) {
      return res.status(400).json({
        message: 'Missing required field: featureName'
      });
    }
    
    // Only track feature usage for authenticated users
    if (!req.isAuthenticated()) {
      return res.status(401).json({
        message: 'Authentication required to track feature usage'
      });
    }
    
    // Track the feature usage
    analytics.trackFeatureUsage(
      req.user!.id, 
      featureName, 
      source || 'web'
    );
    
    return res.status(200).json({ success: true });
  } catch (error) {
    logger.error('Error tracking feature usage', { error });
    return res.status(500).json({
      message: 'Failed to track feature usage'
    });
  }
});

/**
 * Endpoint to check analytics status
 * GET /api/analytics/status
 */
analyticsRouter.get('/status', requireAdmin, (req: Request, res: Response) => {
  const eventCounts = {
    total: 100, // Placeholder - would be real counts in production
    byType: {
      error: 5,
      performance: 15,
      user: 30,
      feature: 50
    }
  };
  
  return res.status(200).json({
    enabled: true,
    anonymous: false,
    eventCounts
  });
});

/**
 * Endpoint for retrieving analytics dashboard data
 * GET /api/analytics/dashboard
 */
analyticsRouter.get('/dashboard', (req: Request, res: Response) => {
  try {
    // Get time range from query params with 7d default
    const timeRange = req.query.timeRange || '7d';
    
    // In a production system, this would query a database or analytics service
    // For now, generate sample data
    
    // Generate dates based on time range
    const today = new Date();
    const dates: string[] = [];
    let daysToShow = 7;
    
    switch(timeRange) {
      case '24h':
        daysToShow = 1;
        break;
      case '30d':
        daysToShow = 30;
        break;
      case '90d':
        daysToShow = 90;
        break;
      default: // 7d
        daysToShow = 7;
    }
    
    for (let i = daysToShow - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      dates.push(date.toISOString().split('T')[0]);
    }
    
    // Generate user activity data
    const userActivity = dates.map(date => {
      // Base numbers that would come from database
      const baseActiveUsers = 1200 + Math.floor(Math.random() * 700);
      const baseNewUsers = 100 + Math.floor(Math.random() * 120);
      
      return {
        date,
        activeUsers: baseActiveUsers,
        newUsers: baseNewUsers
      };
    });
    
    // API performance data
    const apiPerformance = [
      { endpoint: '/api/predictions', avgResponseTime: 120, count: 450, successRate: 99.2 },
      { endpoint: '/api/user', avgResponseTime: 85, count: 2300, successRate: 99.8 },
      { endpoint: '/api/accumulators', avgResponseTime: 180, count: 380, successRate: 98.5 },
      { endpoint: '/api/tiered-predictions', avgResponseTime: 210, count: 280, successRate: 97.9 },
      { endpoint: '/api/ai-status', avgResponseTime: 90, count: 120, successRate: 100 }
    ];
    
    // Error data
    const errorCount = [
      { errorType: 'API Connection', count: 24, percentage: 38 },
      { errorType: 'Client Error', count: 18, percentage: 28 },
      { errorType: 'Authentication', count: 12, percentage: 19 },
      { errorType: 'Network', count: 8, percentage: 13 },
      { errorType: 'Other', count: 2, percentage: 2 }
    ];
    
    // Feature usage data
    const featureUsage = [
      { feature: 'Tiered Predictions', count: 980, percentage: 32 },
      { feature: 'Accumulators', count: 650, percentage: 21 },
      { feature: 'Fantasy Teams', count: 480, percentage: 16 },
      { feature: 'News', count: 420, percentage: 14 },
      { feature: 'Statistics', count: 340, percentage: 11 },
      { feature: 'Other', count: 180, percentage: 6 }
    ];
    
    const dashboardData = {
      apiPerformance,
      errorCount,
      userActivity,
      featureUsage
    };
    
    return res.status(200).json(dashboardData);
  } catch (error) {
    logger.error('Error fetching analytics dashboard data', { error });
    return res.status(500).json({
      message: 'Failed to retrieve analytics dashboard data'
    });
  }
});

/**
 * Endpoint for tracking client-side events
 * POST /api/analytics/events
 */
analyticsRouter.post('/events', (req: Request, res: Response) => {
  try {
    const { eventType, properties } = req.body;
    
    if (!eventType) {
      return res.status(400).json({ message: 'Event type is required' });
    }
    
    // Log event for debugging
    logger.info(`Received analytics event: ${eventType}`, properties);
    
    // In production, this would store the event in a database
    // and potentially trigger real-time notifications or alerts
    
    // Record the user ID if authenticated
    const userId = req.isAuthenticated() && req.user ? req.user.id : null;
    
    // Create standardized event object
    const event = {
      eventType,
      properties: {
        ...properties,
        userId,
        timestamp: new Date().toISOString(),
        sessionId: req.sessionID || 'unknown',
      }
    };
    
    // Store event in storage (would be implemented in production)
    // analyticsService.storeEvent(event);
    
    return res.status(200).json({ success: true });
  } catch (error) {
    logger.error('Error storing analytics event', { error });
    return res.status(500).json({
      message: 'Failed to store analytics event'
    });
  }
});

/**
 * Endpoint for exporting analytics data
 * GET /api/analytics/export
 */
analyticsRouter.get('/export', (req: Request, res: Response) => {
  try {
    // Only admins can export data
    if (!req.isAuthenticated() || !req.user || req.user.role !== 'admin') {
      return res.status(403).json({
        message: 'Permission denied'
      });
    }
    
    const { type, format } = req.query;
    
    if (!type) {
      return res.status(400).json({ message: 'Data type is required' });
    }
    
    // In production, this would retrieve data from database
    // For now, return sample data based on requested type
    let data: any[] = [];
    
    switch (type) {
      case 'userActivity':
        // Generate 30 days of user activity
        const today = new Date();
        for (let i = 29; i >= 0; i--) {
          const date = new Date(today);
          date.setDate(date.getDate() - i);
          data.push({
            date: date.toISOString().split('T')[0],
            activeUsers: 1200 + Math.floor(Math.random() * 700),
            newUsers: 100 + Math.floor(Math.random() * 120)
          });
        }
        break;
        
      case 'errors':
        data = [
          { errorType: 'API Connection', count: 24, percentage: 38, details: 'Connection timeout or server unavailable' },
          { errorType: 'Client Error', count: 18, percentage: 28, details: 'JavaScript runtime errors in browser' },
          { errorType: 'Authentication', count: 12, percentage: 19, details: 'Invalid credentials or session expiration' },
          { errorType: 'Network', count: 8, percentage: 13, details: 'Network connectivity issues' },
          { errorType: 'Other', count: 2, percentage: 2, details: 'Miscellaneous errors' }
        ];
        break;
        
      case 'apiPerformance':
        data = [
          { endpoint: '/api/predictions', avgResponseTime: 120, count: 450, successRate: 99.2 },
          { endpoint: '/api/user', avgResponseTime: 85, count: 2300, successRate: 99.8 },
          { endpoint: '/api/accumulators', avgResponseTime: 180, count: 380, successRate: 98.5 },
          { endpoint: '/api/tiered-predictions', avgResponseTime: 210, count: 280, successRate: 97.9 },
          { endpoint: '/api/ai-status', avgResponseTime: 90, count: 120, successRate: 100 },
          { endpoint: '/api/fantasy/teams', avgResponseTime: 150, count: 220, successRate: 99.5 },
          { endpoint: '/api/fantasy/contests', avgResponseTime: 170, count: 180, successRate: 98.9 },
          { endpoint: '/api/news', avgResponseTime: 110, count: 320, successRate: 99.7 },
          { endpoint: '/api/auth/login', avgResponseTime: 95, count: 1800, successRate: 99.9 },
          { endpoint: '/api/profile', avgResponseTime: 130, count: 780, successRate: 99.6 }
        ];
        break;
        
      case 'featureUsage':
        data = [
          { feature: 'Tiered Predictions', count: 980, percentage: 32, userSegment: 'All users' },
          { feature: 'Accumulators', count: 650, percentage: 21, userSegment: 'Premium users' },
          { feature: 'Fantasy Teams', count: 480, percentage: 16, userSegment: 'Engaged users' },
          { feature: 'News', count: 420, percentage: 14, userSegment: 'All users' },
          { feature: 'Statistics', count: 340, percentage: 11, userSegment: 'Premium users' },
          { feature: 'Player Comparison', count: 290, percentage: 9, userSegment: 'Premium users' },
          { feature: 'Live Scores', count: 520, percentage: 17, userSegment: 'All users' },
          { feature: 'AI Service Status', count: 120, percentage: 4, userSegment: 'Admin users' },
          { feature: 'Referrals', count: 380, percentage: 12, userSegment: 'All users' },
          { feature: 'User Preferences', count: 220, percentage: 7, userSegment: 'All users' }
        ];
        break;
        
      default:
        return res.status(400).json({ message: 'Invalid data type' });
    }
    
    // Format response based on requested format
    if (format === 'csv') {
      // Convert data to CSV
      if (data.length === 0) {
        return res.status(204).send();
      }
      
      const headers = Object.keys(data[0]).join(',');
      const rows = data.map(item => Object.values(item).join(','));
      const csv = [headers, ...rows].join('\n');
      
      res.header('Content-Type', 'text/csv');
      res.header('Content-Disposition', `attachment; filename=${type}-export.csv`);
      return res.send(csv);
    } else {
      // Return as JSON
      return res.status(200).json(data);
    }
  } catch (error) {
    logger.error('Error exporting analytics data', { error });
    return res.status(500).json({
      message: 'Failed to export analytics data'
    });
  }
});

/**
 * Endpoint for user demographics data
 * GET /api/analytics/demographics
 */
analyticsRouter.get('/demographics', (req: Request, res: Response) => {
  try {
    // Only admins can access demographic data
    if (!req.isAuthenticated() || !req.user || req.user.role !== 'admin') {
      return res.status(403).json({
        message: 'Permission denied'
      });
    }
    
    // In production, this would retrieve data from database
    // For now, return sample demographic data
    const demographicData = {
      // User location data
      locations: [
        { country: 'United Kingdom', count: 3500, percentage: 32 },
        { country: 'United States', count: 2200, percentage: 20 },
        { country: 'Nigeria', count: 1800, percentage: 16.4 },
        { country: 'Kenya', count: 1200, percentage: 10.9 },
        { country: 'South Africa', count: 900, percentage: 8.2 },
        { country: 'Ghana', count: 650, percentage: 5.9 },
        { country: 'Canada', count: 320, percentage: 2.9 },
        { country: 'India', count: 280, percentage: 2.5 },
        { country: 'Australia', count: 120, percentage: 1.1 },
        { country: 'Other', count: 130, percentage: 1.1 }
      ],
      
      // Device data
      devices: [
        { type: 'Mobile', count: 7200, percentage: 65.5 },
        { type: 'Desktop', count: 2900, percentage: 26.4 },
        { type: 'Tablet', count: 900, percentage: 8.1 }
      ],
      
      // Operating system data
      operatingSystems: [
        { name: 'Android', count: 4800, percentage: 43.6 },
        { name: 'iOS', count: 3100, percentage: 28.2 },
        { name: 'Windows', count: 2100, percentage: 19.1 },
        { name: 'macOS', count: 800, percentage: 7.3 },
        { name: 'Linux', count: 200, percentage: 1.8 }
      ],
      
      // Browser data
      browsers: [
        { name: 'Chrome', count: 6200, percentage: 56.4 },
        { name: 'Safari', count: 2900, percentage: 26.4 },
        { name: 'Firefox', count: 900, percentage: 8.2 },
        { name: 'Edge', count: 700, percentage: 6.4 },
        { name: 'Samsung Internet', count: 200, percentage: 1.8 },
        { name: 'Other', count: 100, percentage: 0.8 }
      ],
      
      // Subscription tier data
      subscriptionTiers: [
        { tier: 'Free', count: 6500, percentage: 59.1 },
        { tier: 'Basic', count: 2800, percentage: 25.5 },
        { tier: 'Pro', count: 1200, percentage: 10.9 },
        { tier: 'Elite', count: 500, percentage: 4.5 }
      ],
      
      // User engagement segments
      engagementSegments: [
        { segment: 'Daily Active', count: 3200, percentage: 29.1 },
        { segment: 'Weekly Active', count: 4500, percentage: 40.9 },
        { segment: 'Monthly Active', count: 2300, percentage: 20.9 },
        { segment: 'Inactive', count: 1000, percentage: 9.1 }
      ]
    };
    
    return res.status(200).json(demographicData);
  } catch (error) {
    logger.error('Error fetching demographic data', { error });
    return res.status(500).json({
      message: 'Failed to retrieve demographic data'
    });
  }
});