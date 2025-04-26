import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useFeatureFlag } from '@/lib/feature-flags';
import { useToast } from '@/hooks/use-toast';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: Date;
  read: boolean;
  link?: string;
  icon?: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const DEMO_NOTIFICATIONS: Omit<Notification, 'id' | 'timestamp' | 'read'>[] = [
  {
    title: 'New Predictions Available',
    message: 'Fresh AI-generated predictions for today\'s football matches are now available!',
    type: 'info',
    icon: 'football',
    link: '/',
  },
  {
    title: 'Special 50x Accumulator',
    message: 'Our AI has identified a high-confidence accumulator with potential 50x returns!',
    type: 'success',
    icon: 'star',
    link: '/accumulators',
  },
  {
    title: 'Account Upgraded',
    message: 'Your account has been upgraded to Premium tier. Enjoy exclusive predictions!',
    type: 'success',
    icon: 'crown',
  },
  {
    title: 'Upcoming Matches',
    message: 'Major matches starting soon. Check predictions for optimal betting strategy.',
    type: 'warning',
    icon: 'clock',
    link: '/today',
  },
];

interface NotificationProviderProps {
  children: ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const demoNotificationsEnabled = useFeatureFlag('demoNotifications');
  const { toast } = useToast();
  
  // Initialize browser notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      // We don't request permission automatically to avoid disturbing the user
      // Permission will be requested when they first interact with notifications
    }
  }, []);
  
  // Load demo notifications if feature flag is enabled
  useEffect(() => {
    if (demoNotificationsEnabled && notifications.length === 0) {
      // Add demo notifications with slight delay between them
      DEMO_NOTIFICATIONS.forEach((notification, index) => {
        setTimeout(() => {
          const now = new Date();
          // Add with random delay
          const timestamp = new Date(now.getTime() - Math.random() * 60 * 60 * 1000 * index);
          
          addNotification({
            ...notification,
            timestamp,
          });
        }, index * 300); // Stagger the notification additions
      });
    }
  }, [demoNotificationsEnabled]);
  
  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      try {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
      } catch (error) {
        console.error('Error requesting notification permission:', error);
        return false;
      }
    }
    return false;
  };
  
  const showBrowserNotification = async (notification: Notification) => {
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/logo.png',
        });
      } else if (Notification.permission !== 'denied') {
        const granted = await requestNotificationPermission();
        if (granted) {
          new Notification(notification.title, {
            body: notification.message,
            icon: '/logo.png',
          });
        }
      }
    }
  };
  
  const addNotification = (newNotification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const notificationObj: Notification = {
      ...newNotification,
      id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: newNotification.timestamp || new Date(),
      read: false,
    };
    
    setNotifications(prev => [notificationObj, ...prev]);
    
    // Show toast for new notifications
    toast({
      title: notificationObj.title,
      description: notificationObj.message,
      variant: notificationObj.type === 'error' ? 'destructive' : 'default',
    });
    
    // Show browser notification if available
    showBrowserNotification(notificationObj);
    
    return notificationObj.id;
  };
  
  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(note => note.id === id ? { ...note, read: true } : note)
    );
  };
  
  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(note => ({ ...note, read: true }))
    );
  };
  
  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(note => note.id !== id));
  };
  
  const clearAll = () => {
    setNotifications([]);
  };
  
  const unreadCount = notifications.filter(note => !note.read).length;
  
  const value = {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
  };
  
  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  
  return context;
}