import { AnalyticsEventType, AnalyticsProperties } from '@/hooks/use-analytics';
import { apiRequest } from './queryClient';

/**
 * Analytics service for standardized client-side tracking
 */
export class AnalyticsService {
  /**
   * Track a client-side event with standardized parameters
   */
  public static async trackEvent(
    eventType: AnalyticsEventType,
    properties: AnalyticsProperties = {}
  ): Promise<void> {
    try {
      // Add standard event properties
      const enrichedProperties = {
        ...properties,
        timestamp: new Date().toISOString(),
        url: window.location.pathname,
        userAgent: navigator.userAgent,
        screenWidth: window.innerWidth,
        screenHeight: window.innerHeight,
        language: navigator.language,
      };

      // Send the event to the server
      await apiRequest('POST', '/api/analytics/events', {
        eventType,
        properties: enrichedProperties,
      });
    } catch (error) {
      console.error('Failed to track analytics event:', error);
    }
  }

  /**
   * Track a page view with enhanced context
   */
  public static async trackPageView(
    path: string,
    referrer: string = document.referrer,
    title: string = document.title
  ): Promise<void> {
    return this.trackEvent(AnalyticsEventType.FEATURE_USAGE, {
      customData: {
        featureName: 'page_view',
        pageName: path === '/' ? 'home' : path.split('/').filter(Boolean).join('-')
      },
      path,
      referrer,
      title,
      timeOnPage: 0, // Will be calculated on the server
    });
  }

  /**
   * Track client-side error with enhanced context
   */
  public static async trackError(
    errorMessage: string,
    errorStack?: string,
    context: AnalyticsProperties = {}
  ): Promise<void> {
    return this.trackEvent(AnalyticsEventType.ERROR_OCCURRENCE, {
      errorMessage,
      errorStack,
      ...context,
    });
  }

  /**
   * Track performance metric
   */
  public static async trackPerformance(
    metricName: string,
    value: number,
    context: AnalyticsProperties = {}
  ): Promise<void> {
    return this.trackEvent(AnalyticsEventType.APP_PERFORMANCE, {
      metricName,
      value,
      ...context,
    });
  }

  /**
   * Track feature usage
   */
  public static async trackFeatureUsage(
    featureName: string,
    context: AnalyticsProperties = {}
  ): Promise<void> {
    return this.trackEvent(AnalyticsEventType.FEATURE_USAGE, {
      featureName,
      ...context,
    });
  }

  /**
   * Export analytics data by type (for dashboard export functionality)
   */
  public static async exportAnalyticsData(dataType: string, format: 'csv' | 'json' = 'json'): Promise<Blob> {
    const response = await apiRequest('GET', `/api/analytics/export?type=${dataType}&format=${format}`);
    return await response.blob();
  }

  /**
   * Get user demographic data
   */
  public static async getUserDemographics(): Promise<any> {
    const response = await apiRequest('GET', '/api/analytics/demographics');
    return await response.json();
  }
}