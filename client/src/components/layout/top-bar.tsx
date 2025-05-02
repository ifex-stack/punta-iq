import { useAuth } from "@/hooks/use-auth";
import { 
  BellIcon, 
  MenuIcon, 
  HistoryIcon, 
  GlobeIcon, 
  Settings, 
  Sun,
  Moon,
  BarChart
} from "lucide-react";
import { PuntaIQLogo } from "@/components/ui/puntaiq-logo";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { AIServiceStatusIndicator } from "@/components/status/ai-service-status-indicator";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

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

  const { theme, setTheme } = useTheme();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [prevScrollPos, setPrevScrollPos] = useState(0);
  const [visible, setVisible] = useState(true);
  
  // Handle scroll behavior for hiding/showing header
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollPos = window.scrollY;
      const isScrollingDown = prevScrollPos < currentScrollPos;
      
      // Only hide header when scrolling down and past a threshold
      if (isScrollingDown && currentScrollPos > 50) {
        setVisible(false);
      } else {
        setVisible(true);
      }
      
      setPrevScrollPos(currentScrollPos);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [prevScrollPos]);
  
  // Animation variants for the header
  const headerVariants = {
    visible: { 
      y: 0,
      opacity: 1,
      transition: { duration: 0.2, ease: "easeOut" }
    },
    hidden: { 
      y: "-100%",
      opacity: 0.5,
      transition: { duration: 0.2, ease: "easeIn" }
    }
  };
  
  // Status indicator with touch-friendly size
  const StatusIndicator = () => (
    <div className="flex items-center gap-2">
      <div className="relative w-3 h-3">
        <motion.div
          className="absolute inset-0 rounded-full bg-green-500"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </div>
      <span className="text-xs font-medium text-green-500">AI Online</span>
    </div>
  );
  
  return (
    <motion.header 
      className="flex justify-between items-center px-4 py-3 bg-card/95 backdrop-blur-md shadow-sm sticky top-0 z-40"
      initial="visible"
      animate={visible ? "visible" : "hidden"}
      variants={headerVariants}
    >
      <Link href="/" className="flex items-center">
        <div className="relative">
          <PuntaIQLogo size="md" showText={false} />
          <AnimatePresence>
            <motion.div 
              className="absolute -top-1 -right-1" 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
            >
              <AIServiceStatusIndicator size="small" />
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="ml-3">
          <h1 className="text-lg font-bold font-sans text-foreground">PuntaIQ</h1>
        </div>
      </Link>
      
      {/* Desktop Navigation */}
      <div className="hidden md:flex items-center gap-2">
        <Link href="/history">
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-1 border-indigo-600 text-indigo-600 hover:bg-indigo-600 hover:text-white"
          >
            <HistoryIcon className="h-4 w-4" />
            <span className="ml-1">History</span>
          </Button>
        </Link>
        
        <Link href="/ai-service-status">
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-1 border-green-600 text-green-600 hover:bg-green-600 hover:text-white"
          >
            <GlobeIcon className="h-4 w-4" />
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
        
        <Link href="/profile">
          <Button className="ml-1 h-8 w-8 rounded-full bg-primary/80 hover:bg-primary p-0">
            <span className="text-sm text-white font-medium">{getUserInitials()}</span>
          </Button>
        </Link>
      </div>
      
      {/* Mobile Navigation */}
      <div className="flex md:hidden items-center gap-3">
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative touch-manipulation active:scale-95 transition-transform">
                <BellIcon className="h-5 w-5 text-muted-foreground" />
                {unreadCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs rounded-full bg-accent text-white p-0">
                    {unreadCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[calc(100vw-32px)] max-w-[320px]">
              <DropdownMenuLabel className="border-b pb-2 border-border">Notifications</DropdownMenuLabel>
              <div className="max-h-[60vh] overflow-y-auto pb-safe">
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
        
        <Button 
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="touch-manipulation active:scale-95 transition-transform"
        >
          {theme === 'dark' ? (
            <Sun className="h-5 w-5 text-muted-foreground" />
          ) : (
            <Moon className="h-5 w-5 text-muted-foreground" />
          )}
        </Button>

        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="touch-manipulation active:scale-95 transition-transform">
              <MenuIcon className="h-5 w-5 text-muted-foreground" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[85vw] max-w-[400px] pt-safe px-4 pb-safe">
            <div className="flex flex-col h-full">
              <div className="flex items-center mb-6 -mx-2">
                <PuntaIQLogo size="md" showText={false} />
                <div className="ml-3">
                  <h2 className="text-lg font-bold font-sans text-foreground">PuntaIQ</h2>
                </div>
              </div>
              
              <div className="flex flex-col gap-2">
                <AIServiceStatusIndicator size="large" className="mb-4" />
                
                <Link href="/profile">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start h-14 text-base rounded-xl mb-2 touch-manipulation active:scale-95 transition-transform"
                  >
                    <div className="mr-3 h-8 w-8 rounded-full bg-primary/80 flex items-center justify-center text-sm text-white font-medium">
                      {getUserInitials()}
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="font-medium">{user?.username || "Guest"}</span>
                      <span className="text-xs text-muted-foreground">View Profile</span>
                    </div>
                  </Button>
                </Link>
              </div>
              
              <div className="flex flex-col gap-2 my-4">
                <Link href="/history">
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start h-12 text-base rounded-lg mb-1 touch-manipulation active:scale-95 transition-transform"
                  >
                    <HistoryIcon className="mr-3 h-5 w-5" />
                    <span>Historical Dashboard</span>
                  </Button>
                </Link>
                
                <Link href="/ai-service-status">
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start h-12 text-base rounded-lg mb-1 touch-manipulation active:scale-95 transition-transform"
                  >
                    <GlobeIcon className="mr-3 h-5 w-5" />
                    <span>AI Service Status</span>
                  </Button>
                </Link>
                
                <Link href="/predictions">
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start h-12 text-base rounded-lg mb-1 touch-manipulation active:scale-95 transition-transform"
                  >
                    <BarChart className="mr-3 h-5 w-5" />
                    <span>Expert Predictions</span>
                  </Button>
                </Link>
              </div>
              
              <div className="mt-auto">
                <DropdownMenuSeparator className="my-4" />
                <Button 
                  variant="ghost" 
                  className="w-full justify-start h-12 text-base rounded-lg mb-1 touch-manipulation active:scale-95 transition-transform"
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                >
                  {theme === 'dark' ? (
                    <>
                      <Sun className="mr-3 h-5 w-5" />
                      <span>Light Mode</span>
                    </>
                  ) : (
                    <>
                      <Moon className="mr-3 h-5 w-5" />
                      <span>Dark Mode</span>
                    </>
                  )}
                </Button>
                
                <Button 
                  variant="ghost" 
                  className="w-full justify-start h-12 text-base rounded-lg touch-manipulation active:scale-95 transition-transform"
                >
                  <Settings className="mr-3 h-5 w-5" />
                  <span>Settings</span>
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </motion.header>
  );
};

export default TopBar;
