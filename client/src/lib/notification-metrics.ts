/**
 * Utility functions for tracking notification metrics and debugging
 * These metrics are stored in localStorage and only used for development/debugging purposes
 */

export type NotificationEvent = {
  type: string;
  timestamp: number;
  data?: any;
};

export type NotificationMetrics = {
  events: NotificationEvent[];
  deliverySuccessCount: number;
  deliveryFailureCount: number;
  totalReceived: number;
  lastConnectedAt: number | null;
  lastDisconnectedAt: number | null;
  lastReconnectAttempt: number | null;
  reconnectAttempts: number;
  avgDeliveryTime: number | null;
};

const NOTIFICATION_METRICS_KEY = '_notification_metrics';

// Initialize metrics object
const initializeMetrics = (): NotificationMetrics => ({
  events: [],
  deliverySuccessCount: 0,
  deliveryFailureCount: 0,
  totalReceived: 0,
  lastConnectedAt: null,
  lastDisconnectedAt: null,
  lastReconnectAttempt: null,
  reconnectAttempts: 0,
  avgDeliveryTime: null
});

// Get metrics from localStorage
export const getNotificationMetrics = (): NotificationMetrics => {
  try {
    const metricsJSON = localStorage.getItem(NOTIFICATION_METRICS_KEY);
    if (!metricsJSON) {
      return initializeMetrics();
    }
    return JSON.parse(metricsJSON);
  } catch (error) {
    console.error('Error retrieving notification metrics:', error);
    return initializeMetrics();
  }
};

// Save metrics to localStorage
const saveMetrics = (metrics: NotificationMetrics): void => {
  try {
    // Limit events array to prevent localStorage overflow
    if (metrics.events.length > 50) {
      metrics.events = metrics.events.slice(-50);
    }
    localStorage.setItem(NOTIFICATION_METRICS_KEY, JSON.stringify(metrics));
  } catch (error) {
    console.error('Error saving notification metrics:', error);
  }
};

// Record a notification event
export const recordNotificationEvent = (
  type: string,
  data?: any
): void => {
  const metrics = getNotificationMetrics();
  
  const event: NotificationEvent = {
    type,
    timestamp: Date.now(),
    data
  };
  
  metrics.events.push(event);
  
  // Update specific counters based on event type
  switch (type) {
    case 'delivery_success':
      metrics.deliverySuccessCount++;
      metrics.totalReceived++;
      
      // Update average delivery time if we have delivery time data
      if (data?.deliveryTime) {
        if (metrics.avgDeliveryTime === null) {
          metrics.avgDeliveryTime = data.deliveryTime;
        } else {
          metrics.avgDeliveryTime = (
            (metrics.avgDeliveryTime * (metrics.deliverySuccessCount - 1)) + 
            data.deliveryTime
          ) / metrics.deliverySuccessCount;
        }
      }
      break;
      
    case 'delivery_failure':
      metrics.deliveryFailureCount++;
      break;
      
    case 'websocket_connected':
      metrics.lastConnectedAt = Date.now();
      break;
      
    case 'websocket_disconnected':
      metrics.lastDisconnectedAt = Date.now();
      break;
      
    case 'websocket_reconnect_attempt':
      metrics.lastReconnectAttempt = Date.now();
      metrics.reconnectAttempts++;
      break;
  }
  
  saveMetrics(metrics);
};

// Clear all metrics data
export const clearNotificationMetrics = (): void => {
  localStorage.removeItem(NOTIFICATION_METRICS_KEY);
};

// Get a summary of notification performance
export const getNotificationPerformanceSummary = (): {
  deliveryRate: number;
  avgDeliveryTime: number | null;
  reconnectAttempts: number;
  eventsLast24h: number;
} => {
  const metrics = getNotificationMetrics();
  
  const totalAttempted = metrics.deliverySuccessCount + metrics.deliveryFailureCount;
  const deliveryRate = totalAttempted > 0 
    ? (metrics.deliverySuccessCount / totalAttempted) * 100 
    : 0;
  
  // Count events in the last 24 hours
  const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
  const eventsLast24h = metrics.events.filter(event => event.timestamp >= oneDayAgo).length;
  
  return {
    deliveryRate,
    avgDeliveryTime: metrics.avgDeliveryTime,
    reconnectAttempts: metrics.reconnectAttempts,
    eventsLast24h
  };
};

// Export whether WebSocket is currently connected
export const isWebSocketConnected = (): boolean => {
  return localStorage.getItem('_ws_connected') === 'true';
};

// Set WebSocket connection status
export const setWebSocketConnected = (connected: boolean): void => {
  localStorage.setItem('_ws_connected', connected ? 'true' : 'false');
  
  recordNotificationEvent(
    connected ? 'websocket_connected' : 'websocket_disconnected'
  );
};