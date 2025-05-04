import { useCallback, useEffect } from 'react';
import { useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';

// Analytics event types must match server-side enum
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

// Properties interface
export interface AnalyticsProperties {
  [key: string]: any;
}

/**
 * Hook for tracking analytics events
 */
export function useAnalytics() {
  const [location] = useLocation();

  // Track page views
  useEffect(() => {
    // Track page view on route change
    trackPageView(location);
  }, [location]);

  /**
   * Track a generic event
   */
  const trackEvent = useCallback(async (
    eventType: AnalyticsEventType,
    properties: AnalyticsProperties = {}
  ) => {
    try {
      // Add current path if not provided
      if (!properties.path) {
        properties.path = window.location.pathname;
      }
      
      // Add timestamp
      properties.clientTimestamp = new Date().toISOString();
      
      // Send to server
      await apiRequest('POST', '/api/analytics/event', {
        eventType,
        properties
      });
    } catch (error) {
      // Don't throw errors from analytics tracking
      console.error('Analytics error:', error);
    }
  }, []);

  /**
   * Track page view
   */
  const trackPageView = useCallback((path: string) => {
    // Extract page name from path
    const pageName = path === '/' 
      ? 'home' 
      : path.split('/').filter(Boolean).join('-');
    
    trackEvent(AnalyticsEventType.FEATURE_USAGE, {
      customData: {
        featureName: 'page_view',
        pageName
      },
      path
    });
  }, [trackEvent]);

  /**
   * Track client-side error
   */
  const trackError = useCallback(async (
    message: string,
    errorCode?: string,
    context: AnalyticsProperties = {}
  ) => {
    try {
      await apiRequest('POST', '/api/analytics/error', {
        message,
        errorCode: errorCode || 'CLIENT_ERROR',
        path: window.location.pathname,
        context
      });
    } catch (error) {
      // Don't throw errors from analytics tracking
      console.error('Error tracking error:', error);
    }
  }, []);

  /**
   * Track performance metric
   */
  const trackPerformance = useCallback(async (
    metric: string,
    value: number,
    context: AnalyticsProperties = {}
  ) => {
    try {
      await apiRequest('POST', '/api/analytics/performance', {
        metric,
        value,
        context: {
          ...context,
          path: window.location.pathname
        }
      });
    } catch (error) {
      // Don't throw errors from analytics tracking
      console.error('Error tracking performance:', error);
    }
  }, []);

  /**
   * Track feature usage
   */
  const trackFeature = useCallback(async (
    featureName: string,
    source: string = 'client'
  ) => {
    try {
      await apiRequest('POST', '/api/analytics/feature', {
        featureName,
        source
      });
    } catch (error) {
      // Don't throw errors from analytics tracking
      console.error('Error tracking feature:', error);
    }
  }, []);

  /**
   * Track prediction view
   */
  const trackPredictionView = useCallback((
    tier: string,
    sport: string,
    isPremium: boolean
  ) => {
    trackEvent(
      isPremium ? AnalyticsEventType.PREMIUM_PREDICTION_VIEW : AnalyticsEventType.PREDICTION_VIEW,
      {
        tier,
        sport,
        customData: {
          isPremium
        }
      }
    );
  }, [trackEvent]);

  /**
   * Track accumulator view
   */
  const trackAccumulatorView = useCallback((
    tier: string,
    size: number
  ) => {
    trackEvent(AnalyticsEventType.ACCUMULATOR_VIEW, {
      tier,
      customData: {
        size
      }
    });
  }, [trackEvent]);

  /**
   * Global error handler for uncaught errors
   */
  useEffect(() => {
    const handleGlobalError = (event: ErrorEvent) => {
      trackError(
        event.message || 'Unknown error',
        'UNCAUGHT_ERROR',
        {
          stack: event.error?.stack,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        }
      );
    };

    // Add global error handler
    window.addEventListener('error', handleGlobalError);
    
    return () => {
      // Clean up when component unmounts
      window.removeEventListener('error', handleGlobalError);
    };
  }, [trackError]);

  return {
    trackEvent,
    trackPageView,
    trackError,
    trackPerformance,
    trackFeature,
    trackPredictionView,
    trackAccumulatorView
  };
}