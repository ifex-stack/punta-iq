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
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

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

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
      {/* Use max-width to center the navigation on larger screens and add consistent padding */}
      <div className="max-w-screen-lg mx-auto px-1">
        <div className={`grid ${isAdmin ? 'grid-cols-5' : 'grid-cols-4'} h-16`}>
          {/* Home/Dashboard */}
          <Link href="/">
            <a className={`flex flex-col items-center justify-center py-2 ${
              isActive("home") ? "text-primary font-medium" : "text-muted-foreground"
            }`}>
              <Home className="h-5 w-5 mb-1" />
              <span className="text-[10px]">Home</span>
            </a>
          </Link>
          
          {/* Predictions */}
          <Link href="/predictions">
            <a className={`flex flex-col items-center justify-center py-2 ${
              isActive("predictions_stats") ? "text-primary font-medium" : "text-muted-foreground"
            }`}>
              <BarChart2 className="h-5 w-5 mb-1" />
              <span className="text-[10px]">Predictions</span>
            </a>
          </Link>
          
          {/* LiveScore */}
          <Link href="/livescore">
            <a className={`flex flex-col items-center justify-center py-2 ${
              isActive("livescore") ? "text-primary font-medium" : "text-muted-foreground"
            }`}>
              <Activity className="h-5 w-5 mb-1" />
              <span className="text-[10px]">LiveScore</span>
            </a>
          </Link>
          
          {/* Profile/Account */}
          <Link href="/profile">
            <a className={`flex flex-col items-center justify-center py-2 ${
              isActive("profile") ? "text-primary font-medium" : "text-muted-foreground"
            }`}>
              <UserIcon className="h-5 w-5 mb-1" />
              <span className="text-[10px]">Profile</span>
            </a>
          </Link>
          
          {/* Admin panel (only visible to admins) */}
          {isAdmin && (
            <Link href="/admin">
              <a className={`flex flex-col items-center justify-center py-2 ${
                isActive("admin") ? "text-primary font-medium" : "text-muted-foreground"
              }`}>
                <WrenchIcon className="h-5 w-5 mb-1" />
                <span className="text-[10px]">Admin</span>
              </a>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default BottomNavigation;
