import { useEffect } from "react";
import { useNotifications } from "@/hooks/use-notifications";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { ToastAction } from "@/components/ui/toast";

interface NotificationMessage {
  id: string;
  title: string;
  body: string;
  read: boolean;
  actionUrl?: string;
  toastShown?: boolean;
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
        toast({
          title: latestMessage.title,
          description: latestMessage.body,
          action: latestMessage.actionUrl ? (
            <ToastAction 
              altText="View" 
              onClick={() => {
                if (latestMessage.actionUrl) {
                  navigate(latestMessage.actionUrl);
                  markAsRead(latestMessage.id);
                }
              }}
            >
              View
            </ToastAction>
          ) : undefined,
          onDismiss: () => {
            markAsRead(latestMessage.id);
          }
        });
        
        // Mark this message as having been shown as a toast
        markAsRead(latestMessage.id);
      }
    }
  }, [messages, toast, navigate, markAsRead]);

  return null;
}