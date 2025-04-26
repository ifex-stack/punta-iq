import { useState, useEffect } from 'react';
import { useNotifications, Notification } from './notification-provider';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'wouter';
import {
  Bell,
  BellRing,
  Check,
  Star,
  Clock,
  Crown,
  Trophy,
  Sparkles,
  ChevronRight,
  X,
  MoreHorizontal,
  Dribbble, // Use Dribbble icon as a replacement for Football
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

export function NotificationDropdown() {
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    removeNotification, 
    clearAll 
  } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Handle bell animation when new notifications arrive
  useEffect(() => {
    if (unreadCount > 0) {
      setIsAnimating(true);
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [unreadCount]);

  // Handle the notification item click
  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
  };

  // Get the icon component for a notification
  const getNotificationIcon = (icon?: string) => {
    switch (icon) {
      case 'football': return <Dribbble className="w-5 h-5" />;
      case 'star': return <Star className="w-5 h-5" />;
      case 'clock': return <Clock className="w-5 h-5" />;
      case 'crown': return <Crown className="w-5 h-5" />;
      case 'trophy': return <Trophy className="w-5 h-5" />;
      default: return <Sparkles className="w-5 h-5" />;
    }
  };

  // Get style variant based on notification type
  const getVariantStyles = (type: Notification['type']) => {
    switch (type) {
      case 'info':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'success':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'warning':
        return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'error':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      default:
        return 'bg-primary/10 text-primary border-primary/20';
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className={`relative rounded-full shadow-md hover:shadow-lg transition-all border-primary/20 bg-background ${
            isAnimating ? 'animate-pulse-scale' : ''
          }`}
        >
          {unreadCount > 0 ? (
            <BellRing className="h-5 w-5 text-primary animate-float-subtle" />
          ) : (
            <Bell className="h-5 w-5 text-muted-foreground" />
          )}
          
          {unreadCount > 0 && (
            <Badge
              className="absolute -top-1 -right-1 flex items-center justify-center bg-primary text-primary-foreground text-xs min-w-5 min-h-5 px-1 rounded-full"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent
        className="w-80 p-0 mr-4 bg-popover/95 backdrop-blur-sm shadow-xl border-primary/10 rounded-xl"
        align="end"
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-semibold text-lg">Notifications</h3>
          
          <div className="flex gap-1">
            {unreadCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 px-2 text-xs"
                onClick={markAllAsRead}
              >
                <Check className="h-3.5 w-3.5 mr-1" />
                Mark all read
              </Button>
            )}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={clearAll}>
                  Clear all notifications
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsOpen(false)}>
                  Close
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        <ScrollArea className="h-[350px] overflow-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-8 px-4 text-center text-muted-foreground">
              <Bell className="h-10 w-10 mb-4 opacity-30" />
              <h4 className="text-sm font-medium">No notifications yet</h4>
              <p className="text-xs mt-1">
                We'll notify you when there are new predictions or important updates
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((notification) => {
                const timeAgo = formatDistanceToNow(new Date(notification.timestamp), {
                  addSuffix: true,
                });
                
                // Component for notification content
                const NotificationContent = () => (
                  <div
                    className={`group relative flex gap-3 p-4 transition-colors ${
                      notification.read ? 'opacity-70' : 'bg-primary/5'
                    } hover:bg-primary/5`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className={`shrink-0 rounded-full p-2 ${getVariantStyles(notification.type)}`}>
                      {getNotificationIcon(notification.icon)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-medium text-sm line-clamp-1">
                          {notification.title}
                        </h4>
                        
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeNotification(notification.id);
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                      
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                      
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-muted-foreground">
                          {timeAgo}
                        </span>
                        
                        {!notification.read && (
                          <Badge
                            variant="outline"
                            className="text-[10px] h-5 bg-primary/10 text-primary border-primary/30 rounded-full px-1.5 py-0"
                          >
                            New
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    {notification.link && (
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 self-center opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </div>
                );
                
                // Wrap in Link if has link property
                return notification.link ? (
                  <Link
                    key={notification.id}
                    to={notification.link}
                    onClick={() => {
                      handleNotificationClick(notification);
                      setIsOpen(false);
                    }}
                  >
                    <NotificationContent />
                  </Link>
                ) : (
                  <div key={notification.id}>
                    <NotificationContent />
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
        
        <div className="p-3 border-t border-border">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full h-8 text-xs"
            onClick={() => {
              /* TODO: Open settings page */
              setIsOpen(false);
            }}
          >
            Notification settings
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}