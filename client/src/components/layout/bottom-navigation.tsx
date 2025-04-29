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
      <div className={`flex justify-between px-2 items-center h-16 ${isAdmin ? 'relative' : ''}`}>
        <Link href="/">
          <a className={`flex flex-col items-center justify-center ${isAdmin ? 'w-[16%]' : 'w-[19%]'} ${
            isActive("predictions_stats") ? "text-primary" : "text-muted-foreground"
          }`}>
            <BarChart2 className="h-5 w-5" />
            <span className="text-[10px] mt-0.5">Predictions</span>
          </a>
        </Link>
        
        <Link href="/news">
          <a className={`flex flex-col items-center justify-center ${isAdmin ? 'w-[16%]' : 'w-[19%]'} ${
            isActive("news") ? "text-primary" : "text-muted-foreground"
          }`}>
            <NewspaperIcon className="h-5 w-5" />
            <span className="text-[10px] mt-0.5">News</span>
          </a>
        </Link>
        
        <Link href="/fantasy/contests">
          <a className={`flex flex-col items-center justify-center ${isAdmin ? 'w-[16%]' : 'w-[19%]'} ${
            isActive("fantasy") ? "text-primary" : "text-muted-foreground"
          }`}>
            <TrophyIcon className="h-5 w-5" />
            <span className="text-[10px] mt-0.5">Fantasy</span>
          </a>
        </Link>
        
        <Link href="/gamification">
          <a className={`flex flex-col items-center justify-center ${isAdmin ? 'w-[16%]' : 'w-[19%]'} ${
            isActive("gamification") ? "text-primary" : "text-muted-foreground"
          }`}>
            <AwardIcon className="h-5 w-5" />
            <span className="text-[10px] mt-0.5">Rewards</span>
          </a>
        </Link>
        
        <Link href="/profile">
          <a className={`flex flex-col items-center justify-center ${isAdmin ? 'w-[16%]' : 'w-[19%]'} ${
            isActive("profile") ? "text-primary" : "text-muted-foreground"
          }`}>
            <UserIcon className="h-5 w-5" />
            <span className="text-[10px] mt-0.5">Profile</span>
          </a>
        </Link>
        
        {isAdmin && (
          <Link href="/admin">
            <a className={`flex flex-col items-center justify-center w-[16%] ${
              isActive("admin") ? "text-primary" : "text-muted-foreground"
            }`}>
              <WrenchIcon className="h-5 w-5" />
              <span className="text-[10px] mt-0.5">Admin</span>
            </a>
          </Link>
        )}
      </div>
    </nav>
  );
};

export default BottomNavigation;
