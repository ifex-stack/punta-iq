import { useEffect } from "react";
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

  useEffect(() => {
    // Listen for new messages and display them as toasts
    if (messages && messages.length > 0) {
      // Only show the latest message that has not been shown yet
      const latestMessage = messages.find((msg: NotificationMessage) => !msg.toastShown);
      if (latestMessage) {
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
  }, [messages, toast, navigate, markAsRead]);

  return null;
}