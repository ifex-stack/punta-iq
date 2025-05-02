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