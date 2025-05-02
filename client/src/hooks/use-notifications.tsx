import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { 
  getToken, 
  requestNotificationPermission, 
  getNotificationPermission, 
  isNotificationsSupported,
  setupMessageListener
} from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface NotificationsContextType {
  hasPermission: boolean;
  isLoading: boolean;
  requestPermission: () => Promise<NotificationPermission | boolean>;
  disableNotifications: () => Promise<boolean>;
  token: string | null;
  messages: any[];
  hasUnread: boolean;
  markAsRead: (id: string, options?: any) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  deleteAllNotifications: () => void;
}

const NotificationsContext = createContext<NotificationsContextType | null>(null);

export const NotificationsProvider = ({ children }: { children: ReactNode }) => {
  const [permission, setPermission] = useState<boolean>(false);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [messages, setMessages] = useState<any[]>([]);
  const [hasUnread, setHasUnread] = useState<boolean>(false);
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Fetch notifications from API
  const fetchNotifications = async () => {
    if (!user) {
      setMessages([]);
      setHasUnread(false);
      return;
    }
    
    try {
      setIsLoading(true);
      const response = await apiRequest('GET', '/api/notifications');
      
      // Check if response is ok before parsing
      if (!response.ok) {
        if (response.status === 401) {
          // Just log auth errors, the auth provider will handle redirecting if needed
          console.warn('Authentication required for notifications');
          return;
        }
        
        console.error(`Failed to fetch notifications: ${response.status} ${response.statusText}`);
        return;
      }
      
      const data = await response.json();
      
      // Make sure we have valid data before updating state
      if (Array.isArray(data)) {
        setMessages(data);
        setHasUnread(data.some((notification: any) => !notification.read));
      } else {
        console.error('Invalid notification data received from API:', data);
      }
    } catch (error) {
      // Only log non-auth errors
      if (!(error instanceof Error && error.message.includes('Authentication required'))) {
        console.error('Error fetching notifications:', error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Check for notification permission
  useEffect(() => {
    const checkPermission = async () => {
      // Skip if not supported
      if (!isNotificationsSupported()) {
        setPermission(false);
        setIsLoading(false);
        return;
      }

      const permissionState = await getNotificationPermission();
      setPermission(permissionState === 'granted');
      setIsLoading(false);
    };

    checkPermission();
  }, []);
  
  // Fetch notifications when user changes
  useEffect(() => {
    if (user) {
      fetchNotifications();
      
      // Poll for new notifications every 30 seconds
      const intervalId = setInterval(fetchNotifications, 30000);
      return () => clearInterval(intervalId);
    }
  }, [user]);

  // Register token with backend when user is authenticated
  useEffect(() => {
    const registerToken = async () => {
      if (!user || !permission) return;

      try {
        setIsLoading(true);
        const fcmToken = await getToken();
        
        if (fcmToken) {
          setToken(fcmToken);
          
          // Register token with backend
          await apiRequest('POST', '/api/notifications/register-token', {
            token: fcmToken,
            userId: user.id
          });
          
          // Set up listener for foreground messages
          setupMessageListener((payload) => {
            toast({
              title: payload.notification?.title || 'New notification',
              description: payload.notification?.body || '',
            });
            
            // Refresh notifications after receiving a new one
            fetchNotifications();
          });
        }
      } catch (error) {
        console.error('Error registering notification token:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user && permission) {
      registerToken();
    }
  }, [user, permission, toast]);

  // Subscribe to relevant notification topics
  useEffect(() => {
    const subscribeToTopics = async () => {
      if (!user || !token) return;

      try {
        // Subscribe to relevant topics based on user subscription tier
        await apiRequest('POST', '/api/notifications/subscribe', {
          token,
          topics: [
            'all_users',
            `tier_${user.subscriptionTier?.toLowerCase() || 'free'}`,
          ]
        });
      } catch (error) {
        console.error('Error subscribing to topics:', error);
      }
    };

    if (user && token) {
      subscribeToTopics();
    }
  }, [user, token]);

  const requestPermissionHandler = async () => {
    if (!isNotificationsSupported()) {
      throw new Error('Notifications not supported in this browser');
    }

    try {
      setIsLoading(true);
      const permissionResult = await requestNotificationPermission();
      setPermission(permissionResult === 'granted');
      
      if (permissionResult === 'granted') {
        // Get token after permission is granted
        const fcmToken = await getToken();
        setToken(fcmToken);
      }
      
      return permissionResult;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Mark notification as read
  const markAsRead = async (id: string) => {
    try {
      await apiRequest('PATCH', `/api/notifications/${id}/read`);
      setMessages(prev => 
        prev.map(notification => 
          notification.id === id 
            ? { ...notification, read: true, toastShown: true } 
            : notification
        )
      );
      // Update unread state
      const updatedMessages = messages.map(msg => 
        msg.id === id ? { ...msg, read: true } : msg
      );
      setHasUnread(updatedMessages.some(msg => !msg.read));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };
  
  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      await apiRequest('PATCH', '/api/notifications/read-all');
      setMessages(prev => 
        prev.map(notification => ({ ...notification, read: true }))
      );
      setHasUnread(false);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };
  
  // Delete a notification
  const deleteNotification = async (id: string) => {
    try {
      await apiRequest('DELETE', `/api/notifications/${id}`);
      setMessages(prev => prev.filter(notification => notification.id !== id));
      // Update unread state
      const remainingMessages = messages.filter(msg => msg.id !== id);
      setHasUnread(remainingMessages.some(msg => !msg.read));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };
  
  // Delete all notifications
  const deleteAllNotifications = async () => {
    try {
      await apiRequest('DELETE', '/api/notifications');
      setMessages([]);
      setHasUnread(false);
    } catch (error) {
      console.error('Error deleting all notifications:', error);
    }
  };
  
  // Disable notifications
  const disableNotificationsHandler = async () => {
    try {
      setIsLoading(true);
      
      if (token) {
        // Unregister token from backend
        const response = await apiRequest('POST', '/api/notifications/unregister-token', {
          token,
          userId: user?.id
        });
        
        if (!response.ok) {
          console.error('Error from server while unregistering token');
        }
        
        // Clear token in state and local storage
        setToken(null);
        localStorage.removeItem('fcmToken');
        localStorage.removeItem('push-notification-token');
      }
      
      // Reset permission state
      setPermission(false);
      
      return true;
    } catch (error) {
      console.error('Error disabling notifications:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <NotificationsContext.Provider
      value={{
        hasPermission: permission,
        isLoading,
        requestPermission: requestPermissionHandler,
        disableNotifications: disableNotificationsHandler,
        token,
        messages,
        hasUnread,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        deleteAllNotifications
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationsContext);

  if (!context) {
    throw new Error('useNotifications must be used within NotificationsProvider');
  }

  return context;
};