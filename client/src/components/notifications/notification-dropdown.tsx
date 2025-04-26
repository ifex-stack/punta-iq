import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Bell,
  BellRing,
  CheckCheck,
  Trash2,
  Calendar,
  Trophy,
  AlertCircle,
  Info,
  CreditCard,
  Clock
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import { 
  useNotifications, 
  NotificationType, 
  NotificationPriority,
  type Notification 
} from "@/lib/notifications";
import { useFeatureFlag } from "@/lib/feature-flags";

export function NotificationDropdown() {
  const [open, setOpen] = useState(false);
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    requestPermission,
    hasPermission
  } = useNotifications();
  const [, navigate] = useLocation();
  const notificationsEnabled = useFeatureFlag('notifications');
  
  // Mark notifications as read when dropdown opens
  useEffect(() => {
    if (open && unreadCount > 0) {
      markAllAsRead();
    }
  }, [open, unreadCount, markAllAsRead]);
  
  if (!notificationsEnabled) {
    return null;
  }
  
  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    markAsRead(notification.id);
    
    // Navigate if link provided
    if (notification.link) {
      navigate(notification.link);
    }
    
    // Close popover
    setOpen(false);
  };
  
  // Get icon based on notification type
  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case NotificationType.PREDICTION_READY:
        return <Info className="h-4 w-4 text-blue-500" />;
      case NotificationType.MATCH_STARTING:
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case NotificationType.MATCH_RESULT:
        return <Trophy className="h-4 w-4 text-green-500" />;
      case NotificationType.ACCUMULATOR_RESULT:
        return <Trophy className="h-4 w-4 text-violet-500" />;
      case NotificationType.SYSTEM_ANNOUNCEMENT:
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case NotificationType.SUBSCRIPTION_UPDATE:
        return <CreditCard className="h-4 w-4 text-green-500" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };
  
  // Helper function to format relative time
  const formatRelativeTime = (date: Date) => {
    return formatDistanceToNow(date, { addSuffix: true });
  };
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          {unreadCount > 0 ? (
            <>
              <BellRing className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            </>
          ) : (
            <Bell className="h-5 w-5" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4">
          <div className="font-semibold">Notifications</div>
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                <CheckCheck className="h-4 w-4 mr-1" />
                Mark all read
              </Button>
            )}
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-destructive hover:text-destructive"
              onClick={clearAll}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <Separator />
        
        {!hasPermission && (
          <div className="p-4 text-center">
            <p className="text-sm mb-2">Enable browser notifications to stay updated.</p>
            <Button size="sm" onClick={requestPermission}>
              Enable Notifications
            </Button>
          </div>
        )}
        
        {notifications.length === 0 ? (
          <div className="py-8 text-center">
            <Bell className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No notifications yet</p>
          </div>
        ) : (
          <ScrollArea className="h-[300px]">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 hover:bg-accent cursor-pointer ${
                  !notification.isRead ? 'bg-accent/50' : ''
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{notification.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatRelativeTime(notification.timestamp)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(notification.id);
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </ScrollArea>
        )}
      </PopoverContent>
    </Popover>
  );
}