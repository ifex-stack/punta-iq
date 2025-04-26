import React from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Check, Trash2, Bell } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';
import { 
  useNotifications, 
  NotificationBell, 
  getNotificationIcon 
} from './notification-provider';
import { Notification } from '@shared/schema';

export function NotificationDropdown() {
  const { 
    notifications, 
    unreadCount, 
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
    loading
  } = useNotifications();

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  const handleClearAll = async () => {
    await deleteAllNotifications();
  };

  const renderNotificationTime = (timestamp: Date) => {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <NotificationBell unreadCount={unreadCount} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-medium">Notifications</h3>
          <div className="flex space-x-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Bell className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleMarkAllAsRead}>
                  <Check className="mr-2 h-4 w-4" />
                  <span>Mark all as read</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleClearAll}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  <span>Clear all</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <ScrollArea className="h-[300px]">
          {loading ? (
            <div className="flex justify-center items-center p-4">
              <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              <p>No notifications</p>
              <p className="text-sm">You're all caught up!</p>
            </div>
          ) : (
            <div>
              {notifications.map((notification: Notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={markAsRead}
                  onDelete={deleteNotification}
                  formatTime={renderNotificationTime}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: number) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  formatTime: (date: Date) => string;
}

function NotificationItem({ 
  notification,
  onMarkAsRead,
  onDelete,
  formatTime 
}: NotificationItemProps) {
  const handleMarkAsRead = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!notification.read) {
      await onMarkAsRead(notification.id);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await onDelete(notification.id);
  };

  return (
    <div 
      className={`p-4 border-b hover:bg-muted/50 flex transition-colors cursor-pointer ${
        !notification.read ? 'bg-muted/30' : ''
      }`}
      onClick={handleMarkAsRead}
    >
      <div className="mr-3 mt-1">
        {getNotificationIcon(notification.type)}
      </div>
      <div className="flex-1">
        <div className="flex items-start justify-between">
          <h4 className="font-medium text-sm">{notification.title}</h4>
          <div className="flex items-center space-x-1 ml-2">
            {!notification.read && (
              <div className="w-2 h-2 rounded-full bg-primary"></div>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-50 hover:opacity-100"
              onClick={handleDelete}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
        <p className="text-xs text-muted-foreground mt-2">
          {formatTime(notification.timestamp)}
        </p>
      </div>
    </div>
  );
}