import React from "react";
import { useLocation } from "wouter";
import { Home, Target, BarChart3, User } from "lucide-react";

export function MobileNavbar() {
  const [location, navigate] = useLocation();
  
  const navItems = [
    {
      icon: Home,
      label: "Home",
      path: "/",
    },
    {
      icon: Target,
      label: "Predictions",
      path: "/predictions",
    },
    {
      icon: BarChart3,
      label: "Live Scores",
      path: "/livescore",
    },
    {
      icon: User,
      label: "Account",
      path: "/profile",
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 py-2 px-4 z-50">
      <div className="flex justify-around items-center">
        {navItems.map((item) => {
          const isActive = location === item.path;
          const Icon = item.icon;
          
          return (
            <button
              key={item.path}
              className={`flex flex-col items-center justify-center px-3 py-1 ${
                isActive 
                  ? "text-blue-600 dark:text-blue-400" 
                  : "text-gray-500 dark:text-gray-400"
              }`}
              onClick={() => navigate(item.path)}
            >
              <Icon className={`h-5 w-5 ${isActive ? "text-blue-600 dark:text-blue-400" : ""}`} />
              <span className="text-xs mt-1">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}