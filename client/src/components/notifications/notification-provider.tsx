import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";

interface Notification {
  id: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
  category?: string;
  actionUrl?: string;
  userId: number;
  toastShown?: boolean;
}

interface NotificationProviderProps {
  children: ReactNode;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  deleteAllNotifications: () => void;
  refetchNotifications: () => Promise<void>;
  isLoading: boolean;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export function NotificationProvider({ children }: NotificationProviderProps) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasAuthError, setHasAuthError] = useState(false);

  const fetchNotifications = async () => {
    // Skip if not logged in
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const response = await apiRequest("GET", "/api/notifications");
      
      if (!response.ok) {
        // Handle auth errors specifically
        if (response.status === 401) {
          setHasAuthError(true);
          throw new Error("Authentication required");
        }
        
        throw new Error(`Failed to fetch notifications: ${response.status}`);
      }
      
      const data = await response.json();
      setNotifications(Array.isArray(data) ? data : []);
      setHasAuthError(false);
    } catch (error) {
      // Only log error if it's not an auth error we're already handling
      if (!hasAuthError) {
        console.error("Failed to fetch notifications:", error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Refetch when user state changes or login occurs
  useEffect(() => {
    if (user) {
      // Clear any previous auth errors when user changes
      setHasAuthError(false);
      fetchNotifications();
      
      // Set up polling for new notifications (every 30 seconds) only when authenticated
      const intervalId = setInterval(fetchNotifications, 30000);
      return () => clearInterval(intervalId);
    } else {
      // Clear notifications when not logged in
      setNotifications([]);
      setIsLoading(false);
    }
  }, [user]);

  const markAsRead = async (id: string) => {
    try {
      await apiRequest("PATCH", `/api/notifications/${id}/read`);
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === id 
            ? { ...notification, read: true } 
            : notification
        )
      );
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await apiRequest("PATCH", "/api/notifications/read-all");
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read: true }))
      );
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await apiRequest("DELETE", `/api/notifications/${id}`);
      setNotifications(prev => 
        prev.filter(notification => notification.id !== id)
      );
    } catch (error) {
      console.error("Failed to delete notification:", error);
    }
  };

  const deleteAllNotifications = async () => {
    try {
      await apiRequest("DELETE", "/api/notifications");
      setNotifications([]);
    } catch (error) {
      console.error("Failed to delete all notifications:", error);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        deleteAllNotifications,
        refetchNotifications: fetchNotifications,
        isLoading
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotificationContext() {
  const context = useContext(NotificationContext);
  
  if (!context) {
    throw new Error("useNotificationContext must be used within NotificationProvider");
  }
  
  return context;
}