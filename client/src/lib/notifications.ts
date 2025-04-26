import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useFeatureFlag } from './feature-flags';

// The types of notifications the app can send
export enum NotificationType {
  PREDICTION_READY = 'prediction_ready',
  MATCH_STARTING = 'match_starting',
  MATCH_RESULT = 'match_result',
  ACCUMULATOR_RESULT = 'accumulator_result',
  SYSTEM_ANNOUNCEMENT = 'system_announcement',
  SUBSCRIPTION_UPDATE = 'subscription_update'
}

// Notification priority levels
export enum NotificationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high'
}

// Notification data structure
export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  timestamp: Date;
  isRead: boolean;
  priority: NotificationPriority;
  data?: Record<string, any>;
}

// Check if browser notifications are supported
export function areBrowserNotificationsSupported(): boolean {
  return 'Notification' in window;
}

// Request permission for browser notifications
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!areBrowserNotificationsSupported()) {
    return 'denied';
  }
  
  return await Notification.requestPermission();
}

// Get current notification permission state
export function getNotificationPermission(): NotificationPermission | null {
  if (!areBrowserNotificationsSupported()) {
    return null;
  }
  
  return Notification.permission;
}

// Show a browser notification
export function showBrowserNotification(title: string, options?: NotificationOptions): void {
  if (!areBrowserNotificationsSupported() || Notification.permission !== 'granted') {
    return;
  }
  
  // Create and show the notification
  const notification = new Notification(title, options);
  
  // Handle notification click
  notification.onclick = () => {
    // Focus on the window/tab
    window.focus();
    
    // Navigate to a specific URL if provided
    if (options?.data?.url) {
      window.location.href = options.data.url;
    }
    
    // Close the notification
    notification.close();
  };
}

// Store a notification in local storage
export function storeNotification(notification: Notification): void {
  try {
    // Get existing notifications
    const existingNotifications = getStoredNotifications();
    
    // Add new notification
    existingNotifications.push(notification);
    
    // Sort by timestamp (newest first)
    existingNotifications.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    
    // Limit to last 50 notifications
    const limitedNotifications = existingNotifications.slice(0, 50);
    
    // Save to local storage
    localStorage.setItem('puntaiq_notifications', JSON.stringify(limitedNotifications));
  } catch (error) {
    console.error('Failed to store notification:', error);
  }
}

// Get all stored notifications
export function getStoredNotifications(): Notification[] {
  try {
    const storedNotifications = localStorage.getItem('puntaiq_notifications');
    
    if (!storedNotifications) {
      return [];
    }
    
    // Parse the stored JSON
    const parsed = JSON.parse(storedNotifications);
    
    // Ensure each notification has a timestamp as a Date object
    return parsed.map((notification: any) => ({
      ...notification,
      timestamp: new Date(notification.timestamp)
    }));
  } catch (error) {
    console.error('Failed to get stored notifications:', error);
    return [];
  }
}

// Mark a notification as read
export function markNotificationAsRead(notificationId: string): void {
  try {
    const notifications = getStoredNotifications();
    
    // Find and update the notification
    const updatedNotifications = notifications.map(notification => 
      notification.id === notificationId
        ? { ...notification, isRead: true }
        : notification
    );
    
    // Save updated notifications
    localStorage.setItem('puntaiq_notifications', JSON.stringify(updatedNotifications));
  } catch (error) {
    console.error('Failed to mark notification as read:', error);
  }
}

// Mark all notifications as read
export function markAllNotificationsAsRead(): void {
  try {
    const notifications = getStoredNotifications();
    
    // Update all notifications
    const updatedNotifications = notifications.map(notification => 
      ({ ...notification, isRead: true })
    );
    
    // Save updated notifications
    localStorage.setItem('puntaiq_notifications', JSON.stringify(updatedNotifications));
  } catch (error) {
    console.error('Failed to mark all notifications as read:', error);
  }
}

// Delete a notification
export function deleteNotification(notificationId: string): void {
  try {
    const notifications = getStoredNotifications();
    
    // Filter out the notification to delete
    const updatedNotifications = notifications.filter(
      notification => notification.id !== notificationId
    );
    
    // Save updated notifications
    localStorage.setItem('puntaiq_notifications', JSON.stringify(updatedNotifications));
  } catch (error) {
    console.error('Failed to delete notification:', error);
  }
}

// Clear all notifications
export function clearAllNotifications(): void {
  localStorage.removeItem('puntaiq_notifications');
}

// Get unread notification count
export function getUnreadNotificationCount(): number {
  const notifications = getStoredNotifications();
  return notifications.filter(notification => !notification.isRead).length;
}

// Custom hook for using notifications in components
export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { toast } = useToast();
  const notificationsEnabled = useFeatureFlag('notifications');
  
  // Load notifications from storage
  useEffect(() => {
    if (notificationsEnabled) {
      const loadedNotifications = getStoredNotifications();
      setNotifications(loadedNotifications);
      setUnreadCount(loadedNotifications.filter(n => !n.isRead).length);
    }
  }, [notificationsEnabled]);
  
  // Add a new notification
  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'isRead'>) => {
    // Create full notification object
    const newNotification: Notification = {
      ...notification,
      id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      isRead: false
    };
    
    // Show browser notification if permission granted
    if (getNotificationPermission() === 'granted') {
      showBrowserNotification(newNotification.title, {
        body: newNotification.message,
        icon: '/logo.png',
        data: { 
          url: newNotification.link,
          ...newNotification.data
        }
      });
    }
    
    // Store in local storage
    storeNotification(newNotification);
    
    // Update state
    setNotifications(prev => [newNotification, ...prev].slice(0, 50));
    setUnreadCount(prev => prev + 1);
    
    // Show toast notification
    toast({
      title: newNotification.title,
      description: newNotification.message,
      duration: 5000,
    });
    
    return newNotification;
  };
  
  // Mark notification as read
  const markAsRead = (notificationId: string) => {
    markNotificationAsRead(notificationId);
    
    // Update state
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId
          ? { ...notification, isRead: true }
          : notification
      )
    );
    
    setUnreadCount(prev => Math.max(0, prev - 1));
  };
  
  // Mark all as read
  const markAllAsRead = () => {
    markAllNotificationsAsRead();
    
    // Update state
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, isRead: true }))
    );
    
    setUnreadCount(0);
  };
  
  // Delete a notification
  const deleteNotificationById = (notificationId: string) => {
    const notification = notifications.find(n => n.id === notificationId);
    deleteNotification(notificationId);
    
    // Update state
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    
    // Update unread count if needed
    if (notification && !notification.isRead) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };
  
  // Clear all notifications
  const clearAll = () => {
    clearAllNotifications();
    setNotifications([]);
    setUnreadCount(0);
  };
  
  return {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification: deleteNotificationById,
    clearAll,
    requestPermission: requestNotificationPermission,
    hasPermission: getNotificationPermission() === 'granted'
  };
}