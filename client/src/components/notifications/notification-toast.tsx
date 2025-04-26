import React, { useEffect } from 'react';
import { useNotifications } from './notification-provider';
import { useToast } from '@/hooks/use-toast';
import { Bell } from 'lucide-react';

/**
 * Component that listens for WebSocket notifications and displays them as toasts
 * This should be mounted once in the app layout
 */
export function NotificationToastListener() {
  const { socket, socketConnected } = useNotifications();
  const { toast } = useToast();

  useEffect(() => {
    if (!socket || !socketConnected) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        
        // Only handle push notification type messages
        if (data.type === 'push_notification') {
          toast({
            title: data.title,
            description: data.body,
            variant: 'default',
            // Using a custom icon is not supported in the Toast component
          });
        }
      } catch (error) {
        console.error('Error handling WebSocket notification:', error);
      }
    };

    // Add event listener for messages
    socket.addEventListener('message', handleMessage);

    // Clean up the event listener on unmount
    return () => {
      socket.removeEventListener('message', handleMessage);
    };
  }, [socket, socketConnected, toast]);

  // This component doesn't render anything visible
  return null;
}

/**
 * Component that displays a test notification button (for development only)
 */
export function NotificationTestButton() {
  const { toast } = useToast();
  
  const handleTestNotification = async () => {
    try {
      const response = await fetch('/api/notifications/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Test Notification',
          body: 'This is a test notification from the client!',
          data: {
            testId: Date.now(),
          },
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to send test notification');
      }
      
      const result = await response.json();
      
      toast({
        title: 'Test Sent',
        description: result.message,
        variant: 'default',
      });
    } catch (error) {
      console.error('Error sending test notification:', error);
      toast({
        title: 'Error',
        description: 'Failed to send test notification',
        variant: 'destructive',
      });
    }
  };
  
  return (
    <button
      onClick={handleTestNotification}
      className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
    >
      Test Notification
    </button>
  );
}