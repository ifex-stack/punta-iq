/**
 * API routes for analytics tracking
 */
import { Router, Request, Response } from 'express';
import { analytics, AnalyticsEventType, AnalyticsProperties } from './analytics-service';
import { createContextLogger } from './logger';

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
analyticsRouter.get('/status', (req: Request, res: Response) => {
  // Only allow admin users to check analytics status
  if (req.isAuthenticated() && req.user && req.user.role === 'admin') {
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
  }
  
  return res.status(403).json({
    message: 'Permission denied'
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