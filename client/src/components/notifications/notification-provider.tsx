import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  useNotifications, 
  NotificationType,
  NotificationPriority,
  type Notification
} from '@/lib/notifications';
import { useFeatureFlag } from '@/lib/feature-flags';

// Mock prediction examples for testing
const PREDICTION_EXAMPLES = [
  {
    title: 'New Football Predictions Available',
    message: 'Check out today\'s Premier League predictions with high confidence ratings.',
    link: '/',
    type: NotificationType.PREDICTION_READY,
    priority: NotificationPriority.MEDIUM
  },
  {
    title: 'Special Accumulator Alert',
    message: 'A new accumulator with 30.0 odds has been generated for you.',
    link: '/',
    type: NotificationType.PREDICTION_READY,
    priority: NotificationPriority.HIGH
  },
  {
    title: 'Match Starting Soon',
    message: 'Liverpool vs Manchester United starts in 30 minutes.',
    link: '/',
    type: NotificationType.MATCH_STARTING,
    priority: NotificationPriority.MEDIUM
  }
];

interface NotificationProviderProps {
  children: ReactNode;
}

// Notification context for accessing notifications across the app
const NotificationContext = createContext<ReturnType<typeof useNotifications> | undefined>(undefined);

export function NotificationProvider({ children }: NotificationProviderProps) {
  const notificationMethods = useNotifications();
  const demoNotificationsEnabled = useFeatureFlag('demoNotifications');
  
  // For demo purposes, add some notifications when the app first loads
  useEffect(() => {
    if (demoNotificationsEnabled) {
      // Create demo notifications with delays
      const timer1 = setTimeout(() => {
        notificationMethods.addNotification({
          title: PREDICTION_EXAMPLES[0].title,
          message: PREDICTION_EXAMPLES[0].message,
          link: PREDICTION_EXAMPLES[0].link,
          type: PREDICTION_EXAMPLES[0].type,
          priority: PREDICTION_EXAMPLES[0].priority
        });
      }, 5000); // 5 seconds after load
      
      const timer2 = setTimeout(() => {
        notificationMethods.addNotification({
          title: PREDICTION_EXAMPLES[1].title,
          message: PREDICTION_EXAMPLES[1].message,
          link: PREDICTION_EXAMPLES[1].link,
          type: PREDICTION_EXAMPLES[1].type,
          priority: PREDICTION_EXAMPLES[1].priority
        });
      }, 15000); // 15 seconds after load
      
      // Clean up timers
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    }
  }, [demoNotificationsEnabled, notificationMethods]);
  
  return (
    <NotificationContext.Provider value={notificationMethods}>
      {children}
    </NotificationContext.Provider>
  );
}

// Custom hook for using the notification context
export function useNotificationContext() {
  const context = useContext(NotificationContext);
  
  if (context === undefined) {
    throw new Error('useNotificationContext must be used within a NotificationProvider');
  }
  
  return context;
}