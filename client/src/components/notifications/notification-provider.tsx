import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { apiRequest } from "@/lib/queryClient";

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
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const response = await apiRequest("GET", "/api/notifications");
      const data = await response.json();
      setNotifications(data);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    
    // Set up polling for new notifications (every 30 seconds)
    const intervalId = setInterval(fetchNotifications, 30000);
    
    return () => clearInterval(intervalId);
  }, []);

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