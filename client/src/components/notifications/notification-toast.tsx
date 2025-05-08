import { useEffect, useState } from "react";
import { useNotifications } from "@/hooks/use-notifications";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { ToastAction } from "@/components/ui/toast";
import { 
  trackNotificationView, 
  trackNotificationClick, 
  trackNotificationDismiss 
} from "@/lib/notification-metrics";

interface NotificationMessage {
  id: string;
  title: string;
  body: string;
  read: boolean;
  actionUrl?: string;
  toastShown?: boolean;
  type?: 'prediction' | 'result' | 'promotion' | 'system';
  sport?: string;
  match?: string;
  data?: Record<string, any>;
}

export function NotificationToastListener() {
  const { toast } = useToast();
  const { messages, markAsRead } = useNotifications();
  const [, navigate] = useLocation();

  // Track which notifications we've already shown toasts for
  const [shownNotifications, setShownNotifications] = useState<Set<string>>(new Set());
  
  useEffect(() => {
    // Listen for new messages and display them as toasts
    if (messages && messages.length > 0) {
      // Check localStorage to see if we've displayed the welcome notification before
      const hasDisplayedWelcome = localStorage.getItem('welcome_notification_shown') === 'true';
      
      // Find messages that haven't been shown as toasts yet and aren't in our shown set
      const unshownMessages = messages.filter((msg: NotificationMessage) => {
        // Skip welcome notification if we've already shown it in this session
        if (msg.title === "Welcome to PuntaIQ!" && hasDisplayedWelcome) {
          return false;
        }
        
        return !msg.toastShown && !shownNotifications.has(msg.id);
      });
      
      // Only show one notification at a time
      if (unshownMessages.length > 0) {
        const latestMessage = unshownMessages[0];
        
        // Extract notification metadata for tracking
        const metadata = {
          title: latestMessage.title,
          body: latestMessage.body,
          type: latestMessage.type || 'system',
          sport: latestMessage.sport,
          match: latestMessage.match,
          hasAction: !!latestMessage.actionUrl,
          ...(latestMessage.data || {})
        };
        
        // Track that this notification was viewed
        trackNotificationView(latestMessage.id, metadata);
        
        // Add this notification to our set of shown notifications
        setShownNotifications(prev => {
          const newSet = new Set(prev);
          newSet.add(latestMessage.id);
          return newSet;
        });
        
        // If this is the welcome notification, mark that we've shown it
        if (latestMessage.title === "Welcome to PuntaIQ!") {
          localStorage.setItem('welcome_notification_shown', 'true');
        }
        
        // Handle marking as read and dismissal tracking
        const handleDismiss = () => {
          trackNotificationDismiss(latestMessage.id, {
            ...metadata,
            reason: 'user_dismissed'
          });
          markAsRead(latestMessage.id);
        };
        
        toast({
          title: latestMessage.title,
          description: latestMessage.body,
          action: latestMessage.actionUrl ? (
            <ToastAction 
              altText="View" 
              onClick={() => {
                if (latestMessage.actionUrl) {
                  // Track notification click before navigation
                  trackNotificationClick(latestMessage.id, {
                    ...metadata,
                    action: 'navigate',
                    url: latestMessage.actionUrl
                  });
                  navigate(latestMessage.actionUrl);
                  markAsRead(latestMessage.id);
                }
              }}
            >
              View
            </ToastAction>
          ) : undefined,
          onOpenChange: (open) => {
            if (!open) {
              handleDismiss();
            }
          }
        });
      }
    }
  }, [messages, toast, navigate, markAsRead, shownNotifications]);

  return null;
}