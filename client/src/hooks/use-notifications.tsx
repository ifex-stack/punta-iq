import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { 
  isNotificationsSupported, 
  requestNotificationPermission,
  getNotificationPermission
} from "@/lib/firebase";
import * as firebaseMessaging from "@/lib/firebase";

type NotificationsContextType = {
  hasPermission: boolean | null;
  isLoading: boolean;
  requestPermission: () => Promise<boolean>;
  notifications: Notification[];
  markAsRead: (id: number) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: number) => void;
};

export type Notification = {
  id: number;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
};

const NotificationsContext = createContext<NotificationsContextType | null>(null);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [tokenRegistered, setTokenRegistered] = useState(false);

  // Get notification permission status
  useEffect(() => {
    const checkPermission = async () => {
      try {
        // Check if notifications are supported
        if (!isNotificationsSupported()) {
          console.warn('Notifications not supported in this browser');
          return;
        }

        // Check notification permission status
        const permission = getNotificationPermission();
        setHasPermission(permission === 'granted');
      } catch (error) {
        console.error('Error checking notification permission:', error);
      }
    };

    checkPermission();
  }, []);

  // Register token when user is authenticated and permission is granted
  useEffect(() => {
    const registerToken = async () => {
      if (!user || !hasPermission || tokenRegistered) {
        return;
      }

      try {
        // Get device token
        const token = await firebaseMessaging.getToken();
        if (!token) {
          console.error('No registration token available');
          return;
        }

        // Register token with backend
        await apiRequest('POST', '/api/notifications/register-device', { token });
        setTokenRegistered(true);
        console.log('Push notification token registered successfully');
      } catch (error) {
        console.error('Error registering notification token:', error);
      }
    };

    registerToken();
  }, [user, hasPermission, tokenRegistered]);

  // Fetch notifications
  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ['/api/notifications'],
    queryFn: () => apiRequest('GET', '/api/notifications').then(res => res.json()),
    enabled: !!user,
  });

  // Mark notification as read
  const markAsReadMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('PUT', `/api/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    },
  });

  // Mark all notifications as read
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('PUT', '/api/notifications/read-all');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    },
  });

  // Delete notification
  const deleteNotificationMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/notifications/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    },
  });

  // Request notification permission
  const requestPermission = async () => {
    try {
      const permission = await requestNotificationPermission();
      const granted = permission === 'granted';
      setHasPermission(granted);
      
      if (granted) {
        toast({
          title: "Notifications enabled",
          description: "You'll now receive updates on predictions and results.",
        });
        
        // If user is logged in, register token immediately
        if (user && !tokenRegistered) {
          const token = await firebaseMessaging.getToken();
          if (token) {
            await apiRequest('POST', '/api/notifications/register-device', { token });
            setTokenRegistered(true);
          }
        }
      } else {
        toast({
          title: "Permission denied",
          description: "Please enable notifications in your browser settings to receive updates.",
          variant: "destructive",
        });
      }
      
      return granted;
    } catch (error) {
      console.error('Error requesting permission:', error);
      toast({
        title: "Error",
        description: "Failed to request notification permission. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  return (
    <NotificationsContext.Provider
      value={{
        hasPermission,
        isLoading,
        requestPermission,
        notifications,
        markAsRead: (id) => markAsReadMutation.mutate(id),
        markAllAsRead: () => markAllAsReadMutation.mutate(),
        deleteNotification: (id) => deleteNotificationMutation.mutate(id),
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationsProvider");
  }
  return context;
}