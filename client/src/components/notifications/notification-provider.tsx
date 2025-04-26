import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { toast } from '@/hooks/use-toast';
import { Bell, BellOff, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Notification } from '@shared/schema';

type NotificationContextType = {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: number) => Promise<void>;
  deleteAllNotifications: () => Promise<void>;
  loading: boolean;
  socket: WebSocket | null;
  socketConnected: boolean;
  createNotification: (notification: Omit<Notification, 'id' | 'read' | 'timestamp'>) => Promise<void>;
};

const NotificationContext = createContext<NotificationContextType | null>(null);

type NotificationProviderProps = {
  children: ReactNode;
};

export const NotificationProvider = ({ children }: NotificationProviderProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [socketConnected, setSocketConnected] = useState(false);

  // Query to fetch notifications
  const { data: notifications = [], isLoading: loading } = useQuery({
    queryKey: ['/api/notifications'],
    queryFn: async () => {
      if (!user) return [];
      const res = await apiRequest('GET', '/api/notifications');
      return res.json();
    },
    enabled: !!user,
  });

  // Calculate unread count
  const unreadCount = notifications.filter((notification: Notification) => !notification.read).length;

  // Setup WebSocket connection
  useEffect(() => {
    if (!user) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const newSocket = new WebSocket(wsUrl);

    newSocket.onopen = () => {
      console.log('WebSocket connected');
      setSocketConnected(true);
      // Authenticate with WebSocket server
      newSocket.send(JSON.stringify({
        type: 'authenticate',
        userId: user.id,
        token: 'placeholder-token' // In a real app, we would use a real auth token
      }));
    };

    newSocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('WebSocket message received:', data);

        // Handle different message types
        if (data.type === 'notification') {
          // Invalidate notifications query to trigger a refetch
          queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
          
          // Show toast notification
          toast({
            title: data.title,
            description: data.message,
            variant: data.notificationType === 'error' ? 'destructive' : 'default',
          });
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
        // Silent fail for WebSocket message parsing errors to avoid disrupting the UI
      }
    };

    newSocket.onclose = () => {
      console.log('WebSocket disconnected');
      setSocketConnected(false);
      
      // Don't attempt to reconnect if the user is not authenticated
      if (!user) return;
      
      // Implement an exponential backoff for reconnection attempts
      // but don't show any errors to the user during this process
      let reconnectAttempt = 0;
      const maxReconnectAttempts = 5;
      
      const attemptReconnect = () => {
        reconnectAttempt++;
        
        // Stop trying after max attempts
        if (reconnectAttempt > maxReconnectAttempts) {
          console.log(`Giving up reconnection after ${maxReconnectAttempts} attempts`);
          return;
        }
        
        // Exponential backoff - wait longer between each attempt
        const reconnectDelay = Math.min(Math.pow(2, reconnectAttempt) * 1000, 30000);
        console.log(`Will attempt WebSocket reconnection in ${reconnectDelay}ms (attempt ${reconnectAttempt})`);
        
        setTimeout(() => {
          // Don't attempt reconnection if component is unmounted
          if (!user) return;
          
          try {
            console.log(`Attempting WebSocket reconnection (attempt ${reconnectAttempt})`);
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsUrl = `${protocol}//${window.location.host}/ws`;
            const reconnectSocket = new WebSocket(wsUrl);
            
            reconnectSocket.onopen = () => {
              console.log('WebSocket reconnected successfully');
              setSocketConnected(true);
              reconnectSocket.send(JSON.stringify({
                type: 'authenticate',
                userId: user.id,
              }));
            };
            
            reconnectSocket.onclose = () => {
              console.log('Reconnection failed, will try again');
              setSocketConnected(false);
              attemptReconnect();
            };
            
            // Handle errors silently
            reconnectSocket.onerror = () => {
              console.log('Error during reconnection attempt');
              // Don't show any UI errors
            };
            
            setSocket(reconnectSocket);
          } catch (error) {
            console.error('Failed to reconnect:', error);
            attemptReconnect();
          }
        }, reconnectDelay);
      };
      
      // Start reconnection process
      attemptReconnect();
    };
    
    newSocket.onerror = (error) => {
      console.error('WebSocket error:', error);
      // Don't show an error toast for WebSocket connection issues
      // as they can happen frequently and would lead to UI spam
      setSocketConnected(false);
      
      // Attempt to silently reconnect after a delay without showing errors to the user
      const reconnectTimeout = setTimeout(() => {
        if (!user) return;
        try {
          console.log('Attempting silent WebSocket reconnection...');
          const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
          const wsUrl = `${protocol}//${window.location.host}/ws`;
          const reconnectSocket = new WebSocket(wsUrl);
          
          // Set up minimal handlers just to reconnect
          reconnectSocket.onopen = () => {
            console.log('WebSocket reconnected successfully');
            setSocketConnected(true);
            reconnectSocket.send(JSON.stringify({
              type: 'authenticate',
              userId: user.id,
            }));
          };
          
          // Set new socket
          setSocket(reconnectSocket);
        } catch (reconnectError) {
          console.error('Silent reconnection failed:', reconnectError);
          // Still don't show error to user
        }
      }, 3000); // Try to reconnect after 3 seconds
      
      // Clean up timeout on component unmount
      return () => clearTimeout(reconnectTimeout);
    };

    setSocket(newSocket);

    // Clean up on unmount
    return () => {
      newSocket.close();
    };
  }, [user, queryClient]);

  // Create a new notification (this would typically be called by the server)
  const createNotificationMutation = useMutation({
    mutationFn: async (notification: Omit<Notification, 'id' | 'read' | 'timestamp'>) => {
      const res = await apiRequest('POST', '/api/notifications', notification);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create notification',
        variant: 'destructive',
      });
    },
  });

  // Mark notification as read
  const markAsReadMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('PATCH', `/api/notifications/${id}/read`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to mark notification as read',
        variant: 'destructive',
      });
    },
  });

  // Mark all notifications as read
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('PATCH', '/api/notifications/read-all');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to mark all notifications as read',
        variant: 'destructive',
      });
    },
  });

  // Delete a notification
  const deleteNotificationMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('DELETE', `/api/notifications/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete notification',
        variant: 'destructive',
      });
    },
  });

  // Delete all notifications
  const deleteAllNotificationsMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('DELETE', '/api/notifications');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete all notifications',
        variant: 'destructive',
      });
    },
  });

  // Wrapper methods for mutations
  const markAsRead = useCallback(async (id: number) => {
    await markAsReadMutation.mutateAsync(id);
  }, [markAsReadMutation]);

  const markAllAsRead = useCallback(async () => {
    await markAllAsReadMutation.mutateAsync();
  }, [markAllAsReadMutation]);

  const deleteNotification = useCallback(async (id: number) => {
    await deleteNotificationMutation.mutateAsync(id);
  }, [deleteNotificationMutation]);

  const deleteAllNotifications = useCallback(async () => {
    await deleteAllNotificationsMutation.mutateAsync();
  }, [deleteAllNotificationsMutation]);

  const createNotification = useCallback(async (notification: Omit<Notification, 'id' | 'read' | 'timestamp'>) => {
    await createNotificationMutation.mutateAsync(notification);
  }, [createNotificationMutation]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        deleteAllNotifications,
        loading,
        socket,
        socketConnected,
        createNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

// Helper functions to get appropriate icon based on notification type
export function getNotificationIcon(type: string) {
  switch (type) {
    case 'success':
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    case 'error':
      return <AlertCircle className="h-5 w-5 text-red-500" />;
    case 'warning':
      return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    case 'info':
    default:
      return <Info className="h-5 w-5 text-blue-500" />;
  }
}

// Helper for bell icon with badge
export function NotificationBell({ unreadCount }: { unreadCount: number }) {
  return (
    <div className="relative">
      {unreadCount > 0 ? (
        <Bell className="h-6 w-6" />
      ) : (
        <BellOff className="h-6 w-6 text-muted-foreground" />
      )}
      {unreadCount > 0 && (
        <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-white">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </div>
  );
}