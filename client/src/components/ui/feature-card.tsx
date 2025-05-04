import React from "react";
import { LucideIcon } from "lucide-react";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  iconBackgroundColor: string;
  onClick?: () => void;
}

export function FeatureCard({
  icon: Icon,
  title,
  description,
  iconBackgroundColor,
  onClick
}: FeatureCardProps) {
  return (
    <div 
      className="w-full bg-white dark:bg-gray-900 rounded-lg p-6 shadow-sm mb-4 transition-all hover:shadow-md"
      onClick={onClick}
      style={{ cursor: onClick ? "pointer" : "default" }}
    >
      <div className="flex flex-col">
        <div className="flex items-start mb-3">
          <div 
            className={`${iconBackgroundColor} rounded-lg p-3 mr-4 flex items-center justify-center`}
            style={{ minWidth: "48px", minHeight: "48px" }}
          >
            <Icon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400">{title}</h3>
          </div>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          {description}
        </p>
      </div>
    </div>
  );
}