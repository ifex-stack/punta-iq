import { apiRequest, queryClient } from "./queryClient";

interface NotificationMetadata {
  title?: string;
  body?: string;
  type?: 'prediction' | 'result' | 'promotion' | 'system';
  sport?: string;
  match?: string;
  hasAction?: boolean;
  action?: string;
  url?: string;
  timestamp?: string;
  reason?: string;
  deviceInfo?: {
    type: string;
    os?: string;
    browser?: string;
  };
  [key: string]: any;
}

/**
 * Track notification metrics to measure engagement and effectiveness
 */
export async function trackNotificationMetric(
  notificationId: string | number,
  action: 'click' | 'view' | 'dismiss',
  metadata: NotificationMetadata = {}
) {
  try {
    // Add timestamp if not present
    if (!metadata.timestamp) {
      metadata.timestamp = new Date().toISOString();
    }
    
    // Add client device info
    if (!metadata.deviceInfo) {
      metadata.deviceInfo = {
        type: 'web',
        browser: navigator.userAgent,
      };
    }

    await apiRequest('POST', '/api/notifications/metrics', {
      notificationId,
      action,
      metadata
    });
    
    // Invalidate admin metrics if this is an admin user
    if (queryClient.getQueryData(['/api/user'])?.id === 1) {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/notification-metrics'] });
    }
    
    return true;
  } catch (error) {
    console.error('Failed to track notification metric:', error);
    return false;
  }
}

/**
 * Track when a notification is displayed to the user
 */
export function trackNotificationView(
  notificationId: string | number, 
  metadata: NotificationMetadata = {}
) {
  return trackNotificationMetric(notificationId, 'view', metadata);
}

/**
 * Track when a notification is clicked by the user
 */
export function trackNotificationClick(
  notificationId: string | number, 
  metadata: NotificationMetadata = {}
) {
  return trackNotificationMetric(notificationId, 'click', metadata);
}

/**
 * Track when a notification is dismissed by the user
 */
export function trackNotificationDismiss(
  notificationId: string | number, 
  metadata: NotificationMetadata = {}
) {
  return trackNotificationMetric(notificationId, 'dismiss', metadata);
}

/**
 * Track when a notification is created (for admin/debugging purposes)
 */
export function trackNotificationCreated(
  notificationId: string | number,
  metadata: NotificationMetadata = {}
) {
  console.log('Notification created:', notificationId, metadata);
  // This is just logged locally for now, but could be sent to the server
  // in the future if we want to track notification creation metrics
}