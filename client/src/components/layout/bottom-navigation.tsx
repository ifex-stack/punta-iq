import { Link, useLocation } from "wouter";
import {
  BarChart2Icon,
  CrownIcon,
  LineChartIcon,
  UserIcon,
} from "lucide-react";

interface BottomNavigationProps {
  activePage: "predictions" | "stats" | "subscription" | "profile";
}

const BottomNavigation = ({ activePage }: BottomNavigationProps) => {
  const [location] = useLocation();

  // Helper function to determine the active state
  const isActive = (page: string) => {
    return activePage === page;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
      <div className="flex justify-around items-center h-16">
        <Link href="/">
          <a className={`flex flex-col items-center justify-center w-1/4 ${
            isActive("predictions") ? "text-primary" : "text-muted-foreground"
          }`}>
            <LineChartIcon className="h-5 w-5" />
            <span className="text-xs mt-1">Predictions</span>
          </a>
        </Link>
        
        <Link href="/stats">
          <a className={`flex flex-col items-center justify-center w-1/4 ${
            isActive("stats") ? "text-primary" : "text-muted-foreground"
          }`}>
            <BarChart2Icon className="h-5 w-5" />
            <span className="text-xs mt-1">Stats</span>
          </a>
        </Link>
        
        <Link href="/subscription">
          <a className={`flex flex-col items-center justify-center w-1/4 ${
            isActive("subscription") ? "text-primary" : "text-muted-foreground"
          }`}>
            <CrownIcon className="h-5 w-5" />
            <span className="text-xs mt-1">Upgrade</span>
          </a>
        </Link>
        
        <Link href="/profile">
          <a className={`flex flex-col items-center justify-center w-1/4 ${
            isActive("profile") ? "text-primary" : "text-muted-foreground"
          }`}>
            <UserIcon className="h-5 w-5" />
            <span className="text-xs mt-1">Profile</span>
          </a>
        </Link>
      </div>
    </nav>
  );
};

export default BottomNavigation;
