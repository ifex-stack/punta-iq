import { Link, useLocation } from "wouter";
import {
  BarChart2,
  CrownIcon,
  UserIcon,
  WrenchIcon,
  AwardIcon,
  LineChart,
  Activity,
  Home,
  CreditCard,
  TrendingUp,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { motion } from "framer-motion";

interface BottomNavigationProps {
  activePage: "predictions_stats" | "fantasy" | "subscription" | "profile" | "admin" | "gamification" | "history" | "livescore" | "home";
}

const BottomNavigation = ({ activePage }: BottomNavigationProps) => {
  const [location] = useLocation();
  const { user } = useAuth();
  
  // Check if the user is an admin (ID 1)
  const isAdmin = user?.id === 1;

  // Helper function to determine the active state
  const isActive = (page: string) => {
    return activePage === page;
  };

  // Animation variants for nav items
  const navItemVariants = {
    active: { 
      scale: 1.1, 
      y: -4,
      transition: { type: "spring", stiffness: 400, damping: 15 } 
    },
    inactive: { 
      scale: 1, 
      y: 0,
      transition: { type: "spring", stiffness: 400, damping: 17 } 
    }
  };

  // Safe area padding for notched devices
  const safeAreaClass = "pb-safe";

  return (
    <nav className={`fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-md border-t border-border z-50 ${safeAreaClass} shadow-lg`}>
      {/* Use max-width to center the navigation on larger screens and add consistent padding */}
      <div className="max-w-screen-lg mx-auto px-1">
        <div className={`grid ${isAdmin ? 'grid-cols-6' : 'grid-cols-5'} h-16`}>
          {/* Home/Dashboard */}
          <Link href="/">
            <a className="flex flex-col items-center justify-center py-2 focus:outline-none touch-manipulation active:opacity-70">
              <motion.div 
                className="relative flex flex-col items-center"
                initial="inactive"
                animate={isActive("home") ? "active" : "inactive"}
                variants={navItemVariants}
              >
                {isActive("home") && (
                  <motion.div 
                    className="absolute -top-1.5 left-1/2 w-1 h-1 bg-primary rounded-full"
                    layoutId="navIndicator"
                    transition={{ type: "spring", bounce: 0.5, duration: 0.6 }}
                  />
                )}
                <Home className={`h-6 w-6 mb-1 ${isActive("home") ? "text-primary" : "text-muted-foreground"}`} />
                <span className={`text-[10px] ${isActive("home") ? "text-primary font-medium" : "text-muted-foreground"}`}>
                  Home
                </span>
              </motion.div>
            </a>
          </Link>
          
          {/* Predictions */}
          <Link href="/predictions">
            <a className="flex flex-col items-center justify-center py-2 focus:outline-none touch-manipulation active:opacity-70">
              <motion.div 
                className="relative flex flex-col items-center"
                initial="inactive"
                animate={isActive("predictions_stats") ? "active" : "inactive"}
                variants={navItemVariants}
              >
                {isActive("predictions_stats") && (
                  <motion.div 
                    className="absolute -top-1.5 left-1/2 w-1 h-1 bg-primary rounded-full"
                    layoutId="navIndicator"
                    transition={{ type: "spring", bounce: 0.5, duration: 0.6 }}
                  />
                )}
                <TrendingUp className={`h-6 w-6 mb-1 ${isActive("predictions_stats") ? "text-primary" : "text-muted-foreground"}`} />
                <span className={`text-[10px] ${isActive("predictions_stats") ? "text-primary font-medium" : "text-muted-foreground"}`}>
                  Predictions
                </span>
              </motion.div>
            </a>
          </Link>
          
          {/* LiveScore */}
          <Link href="/livescore">
            <a className="flex flex-col items-center justify-center py-2 focus:outline-none touch-manipulation active:opacity-70">
              <motion.div 
                className="relative flex flex-col items-center"
                initial="inactive"
                animate={isActive("livescore") ? "active" : "inactive"}
                variants={navItemVariants}
              >
                {isActive("livescore") && (
                  <motion.div 
                    className="absolute -top-1.5 left-1/2 w-1 h-1 bg-primary rounded-full"
                    layoutId="navIndicator"
                    transition={{ type: "spring", bounce: 0.5, duration: 0.6 }}
                  />
                )}
                <Activity className={`h-6 w-6 mb-1 ${isActive("livescore") ? "text-primary" : "text-muted-foreground"}`} />
                <span className={`text-[10px] ${isActive("livescore") ? "text-primary font-medium" : "text-muted-foreground"}`}>
                  LiveScore
                </span>
              </motion.div>
            </a>
          </Link>
          
          {/* Subscription */}
          <Link href="/subscription">
            <a className="flex flex-col items-center justify-center py-2 focus:outline-none touch-manipulation active:opacity-70">
              <motion.div 
                className="relative flex flex-col items-center"
                initial="inactive"
                animate={isActive("subscription") ? "active" : "inactive"}
                variants={navItemVariants}
              >
                {isActive("subscription") && (
                  <motion.div 
                    className="absolute -top-1.5 left-1/2 w-1 h-1 bg-primary rounded-full"
                    layoutId="navIndicator"
                    transition={{ type: "spring", bounce: 0.5, duration: 0.6 }}
                  />
                )}
                <CreditCard className={`h-6 w-6 mb-1 ${isActive("subscription") ? "text-primary" : "text-muted-foreground"}`} />
                <span className={`text-[10px] ${isActive("subscription") ? "text-primary font-medium" : "text-muted-foreground"}`}>
                  Pricing
                </span>
              </motion.div>
            </a>
          </Link>
          
          {/* Profile/Account */}
          <Link href="/profile">
            <a className="flex flex-col items-center justify-center py-2 focus:outline-none touch-manipulation active:opacity-70">
              <motion.div 
                className="relative flex flex-col items-center"
                initial="inactive"
                animate={isActive("profile") ? "active" : "inactive"}
                variants={navItemVariants}
              >
                {isActive("profile") && (
                  <motion.div 
                    className="absolute -top-1.5 left-1/2 w-1 h-1 bg-primary rounded-full"
                    layoutId="navIndicator"
                    transition={{ type: "spring", bounce: 0.5, duration: 0.6 }}
                  />
                )}
                <UserIcon className={`h-6 w-6 mb-1 ${isActive("profile") ? "text-primary" : "text-muted-foreground"}`} />
                <span className={`text-[10px] ${isActive("profile") ? "text-primary font-medium" : "text-muted-foreground"}`}>
                  Profile
                </span>
              </motion.div>
            </a>
          </Link>
          
          {/* Admin panel (only visible to admins) */}
          {isAdmin && (
            <Link href="/admin">
              <a className="flex flex-col items-center justify-center py-2 focus:outline-none touch-manipulation active:opacity-70">
                <motion.div 
                  className="relative flex flex-col items-center"
                  initial="inactive"
                  animate={isActive("admin") ? "active" : "inactive"}
                  variants={navItemVariants}
                >
                  {isActive("admin") && (
                    <motion.div 
                      className="absolute -top-1.5 left-1/2 w-1 h-1 bg-primary rounded-full"
                      layoutId="navIndicator"
                      transition={{ type: "spring", bounce: 0.5, duration: 0.6 }}
                    />
                  )}
                  <WrenchIcon className={`h-6 w-6 mb-1 ${isActive("admin") ? "text-primary" : "text-muted-foreground"}`} />
                  <span className={`text-[10px] ${isActive("admin") ? "text-primary font-medium" : "text-muted-foreground"}`}>
                    Admin
                  </span>
                </motion.div>
              </a>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default BottomNavigation;
