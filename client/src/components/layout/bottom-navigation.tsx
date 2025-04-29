import { Link, useLocation } from "wouter";
import {
  BarChart2,
  CrownIcon,
  UserIcon,
  TrophyIcon,
  WrenchIcon,
  NewspaperIcon,
  AwardIcon,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

interface BottomNavigationProps {
  activePage: "predictions_stats" | "fantasy" | "subscription" | "profile" | "admin" | "news" | "gamification";
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
      <div className={`grid ${isAdmin ? 'grid-cols-6' : 'grid-cols-5'} items-center h-16 ${isAdmin ? 'relative' : ''}`}>
        <Link href="/">
          <a className={`flex flex-col items-center justify-center ${
            isActive("predictions_stats") ? "text-primary" : "text-muted-foreground"
          }`}>
            <BarChart2 className="h-5 w-5 mb-1" />
            <span className="text-[10px]">Predictions</span>
          </a>
        </Link>
        
        <Link href="/news">
          <a className={`flex flex-col items-center justify-center ${
            isActive("news") ? "text-primary" : "text-muted-foreground"
          }`}>
            <NewspaperIcon className="h-5 w-5 mb-1" />
            <span className="text-[10px]">News</span>
          </a>
        </Link>
        
        <Link href="/fantasy/contests">
          <a className={`flex flex-col items-center justify-center ${
            isActive("fantasy") ? "text-primary" : "text-muted-foreground"
          }`}>
            <TrophyIcon className="h-5 w-5 mb-1" />
            <span className="text-[10px]">Fantasy</span>
          </a>
        </Link>
        
        <Link href="/gamification">
          <a className={`flex flex-col items-center justify-center ${
            isActive("gamification") ? "text-primary" : "text-muted-foreground"
          }`}>
            <AwardIcon className="h-5 w-5 mb-1" />
            <span className="text-[10px]">Rewards</span>
          </a>
        </Link>
        
        <Link href="/profile">
          <a className={`flex flex-col items-center justify-center ${
            isActive("profile") ? "text-primary" : "text-muted-foreground"
          }`}>
            <UserIcon className="h-5 w-5 mb-1" />
            <span className="text-[10px]">Profile</span>
          </a>
        </Link>
        
        {isAdmin && (
          <Link href="/admin">
            <a className={`flex flex-col items-center justify-center ${
              isActive("admin") ? "text-primary" : "text-muted-foreground"
            }`}>
              <WrenchIcon className="h-5 w-5 mb-1" />
              <span className="text-[10px]">Admin</span>
            </a>
          </Link>
        )}
      </div>
    </nav>
  );
};

export default BottomNavigation;
