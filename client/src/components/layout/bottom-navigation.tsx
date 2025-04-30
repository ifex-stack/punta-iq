import { Link, useLocation } from "wouter";
import {
  BarChart2,
  CrownIcon,
  UserIcon,
  TrophyIcon,
  WrenchIcon,
  NewspaperIcon,
  AwardIcon,
  LineChart,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

interface BottomNavigationProps {
  activePage: "predictions_stats" | "fantasy" | "subscription" | "profile" | "admin" | "news" | "gamification" | "history";
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
        <div className={`grid ${isAdmin ? 'grid-cols-7' : 'grid-cols-6'} h-16`}>
          {/* Individual nav items with consistent spacing and sizing */}
          <Link href="/">
            <a className={`flex flex-col items-center justify-center py-2 ${
              isActive("predictions_stats") ? "text-primary font-medium" : "text-muted-foreground"
            }`}>
              <BarChart2 className="h-5 w-5 mb-1" />
              <span className="text-[10px]">Predictions</span>
            </a>
          </Link>
          
          <Link href="/history">
            <a className={`flex flex-col items-center justify-center py-2 ${
              isActive("history") ? "text-primary font-medium" : "text-muted-foreground"
            }`}>
              <LineChart className="h-5 w-5 mb-1" />
              <span className="text-[10px]">History</span>
            </a>
          </Link>
          
          <Link href="/news">
            <a className={`flex flex-col items-center justify-center py-2 ${
              isActive("news") ? "text-primary font-medium" : "text-muted-foreground"
            }`}>
              <NewspaperIcon className="h-5 w-5 mb-1" />
              <span className="text-[10px]">News</span>
            </a>
          </Link>
          
          <Link href="/fantasy/contests">
            <a className={`flex flex-col items-center justify-center py-2 ${
              isActive("fantasy") ? "text-primary font-medium" : "text-muted-foreground"
            }`}>
              <TrophyIcon className="h-5 w-5 mb-1" />
              <span className="text-[10px]">Fantasy</span>
            </a>
          </Link>
          
          <Link href="/gamification">
            <a className={`flex flex-col items-center justify-center py-2 ${
              isActive("gamification") ? "text-primary font-medium" : "text-muted-foreground"
            }`}>
              <AwardIcon className="h-5 w-5 mb-1" />
              <span className="text-[10px]">Rewards</span>
            </a>
          </Link>
          
          <Link href="/profile">
            <a className={`flex flex-col items-center justify-center py-2 ${
              isActive("profile") ? "text-primary font-medium" : "text-muted-foreground"
            }`}>
              <UserIcon className="h-5 w-5 mb-1" />
              <span className="text-[10px]">Profile</span>
            </a>
          </Link>
          
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
