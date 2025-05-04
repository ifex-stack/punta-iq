/**
 * Analytics service for PuntaIQ
 * Tracks key metrics and events in the platform
 */
import { createContextLogger } from './logger';

// Create logger for analytics
const logger = createContextLogger('Analytics');

/**
 * Types of events that can be tracked
 */
export enum AnalyticsEventType {
  // User events
  USER_SIGNUP = 'user_signup',
  USER_LOGIN = 'user_login',
  USER_UPGRADE = 'user_upgrade',
  USER_DOWNGRADE = 'user_downgrade',
  USER_PREFERENCE_UPDATE = 'user_preference_update',

  // Prediction events
  PREDICTION_VIEW = 'prediction_view',
  PREDICTION_FILTER = 'prediction_filter',
  PREMIUM_PREDICTION_VIEW = 'premium_prediction_view',
  ACCUMULATOR_VIEW = 'accumulator_view',
  TIERED_PREDICTION_VIEW = 'tiered_prediction_view',

  // Feature usage
  FEATURE_USAGE = 'feature_usage',
  SEARCH_QUERY = 'search_query',
  
  // Subscription events
  SUBSCRIPTION_VIEW = 'subscription_view',
  SUBSCRIPTION_START = 'subscription_start',
  SUBSCRIPTION_CANCEL = 'subscription_cancel',
  
  // App performance
  APP_PERFORMANCE = 'app_performance',
  API_PERFORMANCE = 'api_performance',
  ERROR_OCCURRENCE = 'error_occurrence',
  
  // AI service events
  AI_SERVICE_STATUS_CHANGE = 'ai_service_status_change',
  AI_SERVICE_RESTART = 'ai_service_restart',
  
  // Fantasy football events
  FANTASY_TEAM_CREATE = 'fantasy_team_create',
  FANTASY_TEAM_UPDATE = 'fantasy_team_update',
  FANTASY_CONTEST_JOIN = 'fantasy_contest_join',
  
  // Referral events
  REFERRAL_LINK_CREATED = 'referral_link_created',
  REFERRAL_SIGNUP = 'referral_signup',
  REFERRAL_MILESTONE_ACHIEVED = 'referral_milestone_achieved'
}

/**
 * Analytics properties that can be tracked with events
 */
export interface AnalyticsProperties {
  userId?: number;
  sessionId?: string;
  deviceType?: string;
  browserInfo?: string;
  location?: string;
  duration?: number;
  path?: string;
  source?: string;
  value?: number;
  tier?: string;
  sport?: string;
  subscriptionPlan?: string;
  errorCode?: string;
  errorMessage?: string;
  performanceMetric?: string;
  responseTime?: number;
  customData?: Record<string, any>;
  [key: string]: any;
}

/**
 * Analytics service for tracking user and system events
 */
export class AnalyticsService {
  private static instance: AnalyticsService;
  private enabled: boolean = true;
  private anonymousMode: boolean = false;
  private sessionId: string;

  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {
    this.sessionId = this.generateSessionId();
    logger.info('Analytics service initialized');
  }

  /**
   * Get the singleton instance of the analytics service
   */
  public static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  /**
   * Generate a unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Set analytics enabled/disabled state
   */
  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    logger.info(`Analytics ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Set anonymous mode (doesn't collect personal identifiers)
   */
  public setAnonymousMode(anonymous: boolean): void {
    this.anonymousMode = anonymous;
    logger.info(`Anonymous mode ${anonymous ? 'enabled' : 'disabled'}`);
  }

  /**
   * Track an analytics event
   */
  public trackEvent(
    eventType: AnalyticsEventType,
    properties: AnalyticsProperties = {}
  ): void {
    if (!this.enabled) return;

    // Don't track user ID in anonymous mode
    const sanitizedProperties = this.anonymousMode
      ? { ...properties, userId: undefined }
      : properties;

    const event = {
      eventType,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      properties: sanitizedProperties
    };

    // Log the event for now. In production this would be sent to an analytics service
    logger.info(`Analytics event: ${eventType}`, event);
    
    // In production implementation, this would send to external analytics service
    // Future implementation will integrate with something like:
    // - Firebase Analytics
    // - Google Analytics 
    // - Mixpanel
    // - Segment
    // etc.
  }

  /**
   * Track API performance metrics
   */
  public trackApiPerformance(
    endpoint: string,
    responseTime: number,
    statusCode: number,
    userId?: number
  ): void {
    this.trackEvent(AnalyticsEventType.API_PERFORMANCE, {
      userId,
      path: endpoint,
      responseTime,
      statusCode,
    });
  }

  /**
   * Track errors for monitoring
   */
  public trackError(
    errorCode: string,
    errorMessage: string,
    path: string,
    userId?: number
  ): void {
    this.trackEvent(AnalyticsEventType.ERROR_OCCURRENCE, {
      userId,
      errorCode,
      errorMessage,
      path
    });
  }

  /**
   * Track AI service status changes
   */
  public trackAIServiceStatusChange(
    oldStatus: string,
    newStatus: string,
    responseTime?: number
  ): void {
    this.trackEvent(AnalyticsEventType.AI_SERVICE_STATUS_CHANGE, {
      customData: {
        oldStatus,
        newStatus
      },
      responseTime
    });
  }

  /**
   * Track prediction views with tier information
   */
  public trackPredictionView(
    userId: number,
    tier: string,
    sport: string,
    isPremium: boolean
  ): void {
    const eventType = isPremium 
      ? AnalyticsEventType.PREMIUM_PREDICTION_VIEW 
      : AnalyticsEventType.PREDICTION_VIEW;
    
    this.trackEvent(eventType, {
      userId,
      tier,
      sport,
      customData: {
        isPremium
      }
    });
  }

  /**
   * Track subscription events
   */
  public trackSubscriptionEvent(
    eventType: AnalyticsEventType.SUBSCRIPTION_START | 
               AnalyticsEventType.SUBSCRIPTION_CANCEL | 
               AnalyticsEventType.SUBSCRIPTION_VIEW,
    userId: number,
    subscriptionPlan: string,
    value?: number
  ): void {
    this.trackEvent(eventType, {
      userId,
      subscriptionPlan,
      value
    });
  }

  /**
   * Track feature usage
   */
  public trackFeatureUsage(
    userId: number,
    featureName: string,
    source: string
  ): void {
    this.trackEvent(AnalyticsEventType.FEATURE_USAGE, {
      userId,
      customData: {
        featureName
      },
      source
    });
  }
}

// Export singleton instance
export const analytics = AnalyticsService.getInstance();