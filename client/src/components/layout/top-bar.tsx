import { useAuth } from "@/hooks/use-auth";
import { BellIcon } from "lucide-react";
import { PuntaIQLogo } from "@/components/ui/puntaiq-logo";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/theme/theme-toggle";

// Type definition for notification
type Notification = {
  id: number;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
};

const TopBar = () => {
  const { user } = useAuth();

  // This would be a real API endpoint in production
  // For this MVP, we'll use dummy notifications
  const { data: notifications } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    queryFn: async () => {
      // Since we don't have an actual notifications endpoint yet, return mock data
      return [
        {
          id: 1,
          title: "New Prediction",
          message: "Manchester City vs Liverpool prediction is now available",
          isRead: false,
          createdAt: new Date().toISOString()
        },
        {
          id: 2,
          title: "Prediction Result",
          message: "Your Bayern Munich prediction was correct!",
          isRead: false,
          createdAt: new Date().toISOString()
        },
        {
          id: 3,
          title: "Special Offer",
          message: "50% off Elite subscription for the next 24 hours",
          isRead: true,
          createdAt: new Date().toISOString()
        }
      ];
    },
    enabled: !!user, // Only fetch if user is logged in
  });

  // Count unread notifications
  const unreadCount = notifications?.filter(n => !n.isRead).length || 0;

  // Format date for notifications
  const formatNotificationDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.round(diffMs / 60000);
    
    if (diffMins < 60) {
      return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
    } else if (diffMins < 1440) {
      const hours = Math.floor(diffMins / 60);
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(diffMins / 1440);
      return `${days} day${days !== 1 ? 's' : ''} ago`;
    }
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user) return "";
    
    return user.username
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="flex justify-between items-center px-4 py-3 bg-card shadow-md">
      <Link href="/" className="flex items-center">
        <PuntaIQLogo size="md" showText={false} />
        <div className="ml-3">
          <h1 className="text-lg font-bold font-sans text-foreground">PuntaIQ</h1>
        </div>
      </Link>
      
      <div className="flex items-center gap-2">
        {/* Historical Dashboard Button */}
        <Link href="/history">
          <Button
            variant="outline"
            size="sm"
            className="hidden md:flex items-center gap-1 border-indigo-600 text-indigo-600 hover:bg-indigo-600 hover:text-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 3v18h18"></path>
              <path d="m19 9-5 5-4-4-3 3"></path>
            </svg>
            <span className="ml-1">History</span>
          </Button>
        </Link>
        
        {/* AI Service Status Link */}
        <Link href="/ai-service-status">
          <Button
            variant="outline"
            size="sm"
            className="hidden md:flex items-center gap-1 border-green-600 text-green-600 hover:bg-green-600 hover:text-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"></path>
              <path d="M12 2v2"></path>
              <path d="M12 20v2"></path>
              <path d="m4.93 4.93 1.41 1.41"></path>
              <path d="m17.66 17.66 1.41 1.41"></path>
              <path d="M2 12h2"></path>
              <path d="M20 12h2"></path>
              <path d="m6.34 17.66-1.41 1.41"></path>
              <path d="m19.07 4.93-1.41 1.41"></path>
            </svg>
            <span className="ml-1">AI Status</span>
          </Button>
        </Link>

        <ThemeToggle variant="ghost" />
        
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <BellIcon className="h-5 w-5 text-muted-foreground" />
                {unreadCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs rounded-full bg-accent text-white p-0">
                    {unreadCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <div className="p-2 font-medium border-b border-border">
                Notifications
              </div>
              <div className="max-h-[300px] overflow-y-auto">
                {notifications && notifications.length > 0 ? (
                  notifications.map(notification => (
                    <DropdownMenuItem key={notification.id} className="p-3 cursor-pointer">
                      <div className="w-full">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="font-medium text-sm">{notification.title}</h4>
                          <span className="text-xs text-muted-foreground">
                            {formatNotificationDate(notification.createdAt)}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {notification.message}
                        </p>
                        {!notification.isRead && (
                          <div className="w-2 h-2 rounded-full bg-primary absolute top-3 right-3"></div>
                        )}
                      </div>
                    </DropdownMenuItem>
                  ))
                ) : (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    No notifications
                  </div>
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        
        <Link href="/profile" className="ml-1 h-8 w-8 rounded-full bg-primary/80 hover:bg-primary flex items-center justify-center text-sm text-white font-medium">
          {getUserInitials()}
        </Link>
      </div>
    </header>
  );
};

export default TopBar;
