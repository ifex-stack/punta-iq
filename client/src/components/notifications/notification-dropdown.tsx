import { useState } from "react";
import { useNotifications } from "@/hooks/use-notifications";
import { useLocation } from "wouter";
import {
  Bell,
  BellOff,
  Check,
  ChevronDown,
  ChevronUp,
  Circle,
  Trash2,
  X,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface Notification {
  id: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string | Date;
  category?: string;
  actionUrl?: string;
  userId: number;
  toastShown?: boolean;
}

export function NotificationDropdown() {
  const { 
    messages, 
    hasUnread, 
    markAsRead, 
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
    isLoading,
    hasPermission,
    requestPermission,
  } = useNotifications();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const handleRequestPermission = async () => {
    try {
      await requestPermission();
      toast({
        title: "Notifications enabled",
        description: "You will now receive notifications from PuntaIQ",
      });
    } catch (error) {
      toast({
        title: "Permission denied",
        description: "Please enable notifications in your browser settings",
        variant: "destructive",
      });
    }
  };

  const handleItemClick = (notificationId: string, actionUrl?: string) => {
    if (actionUrl) {
      navigate(actionUrl);
    }
    markAsRead(notificationId);
    setIsOpen(false);
  };

  const handleDeleteAll = async () => {
    await deleteAllNotifications();
    toast({
      title: "Notifications cleared",
      description: "All notifications have been removed",
    });
    setIsOpen(false);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="relative rounded-full shadow-md bg-white dark:bg-gray-800"
        >
          {hasPermission ? (
            <Bell className="h-5 w-5" />
          ) : (
            <BellOff className="h-5 w-5" />
          )}
          {hasUnread && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]"
            >
              {messages?.filter((m: Notification) => !m.read).length || ""}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-80 md:w-96 max-h-[80vh] overflow-hidden p-0"
      >
        <DropdownMenuLabel className="flex items-center justify-between py-3 px-4 border-b">
          <div className="font-semibold">Notifications</div>
          <div className="flex space-x-2">
            {hasUnread && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs"
                onClick={() => markAllAsRead()}
              >
                <Check className="h-3.5 w-3.5 mr-1" />
                Mark all read
              </Button>
            )}
            {messages && messages.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs"
                onClick={handleDeleteAll}
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                Clear all
              </Button>
            )}
          </div>
        </DropdownMenuLabel>

        {!hasPermission ? (
          <div className="p-4 text-center bg-muted/30">
            <BellOff className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <h3 className="font-medium mb-1">Notifications are disabled</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Enable notifications to get updates about predictions, results, and more
            </p>
            <Button size="sm" onClick={handleRequestPermission}>
              Enable Notifications
            </Button>
          </div>
        ) : isLoading ? (
          <div className="py-8 text-center">
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
            <p className="text-sm text-muted-foreground mt-2">Loading notifications...</p>
          </div>
        ) : messages && messages.length > 0 ? (
          <ScrollArea className="max-h-[400px]">
            <DropdownMenuGroup>
              {messages.map((notification: Notification) => (
                <DropdownMenuItem
                  key={notification.id}
                  className={`px-4 py-3 flex flex-col items-start cursor-pointer ${
                    !notification.read ? "bg-muted/30" : ""
                  }`}
                  onClick={() => handleItemClick(notification.id, notification.actionUrl)}
                >
                  <div className="flex items-start justify-between w-full">
                    <div className="flex items-start">
                      {!notification.read && (
                        <Circle className="h-2 w-2 mr-2 mt-1.5 text-primary flex-shrink-0" />
                      )}
                      <div>
                        <div className="font-medium">{notification.title}</div>
                        <p className="text-sm text-muted-foreground mt-1">{notification.body}</p>
                        
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                          </span>
                          {notification.category && (
                            <Badge variant="outline" className="text-xs h-5 px-1.5 rounded-sm">
                              {notification.category}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notification.id);
                      }}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </ScrollArea>
        ) : (
          <div className="py-10 text-center">
            <Bell className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <h3 className="font-medium mb-1">No notifications</h3>
            <p className="text-sm text-muted-foreground">
              You're all caught up! Check back later for updates
            </p>
          </div>
        )}
        
        <DropdownMenuSeparator />
        
        <div className="p-2 flex justify-between items-center border-t">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="text-xs h-8 w-full"
          >
            <a href="/profile?tab=settings">
              <span>Settings</span>
              {isOpen ? (
                <ChevronUp className="ml-1 h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="ml-1 h-3.5 w-3.5" />
              )}
            </a>
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}