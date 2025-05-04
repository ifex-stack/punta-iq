import React from "react";
import { useLocation } from "wouter";
import { PuntaIQLogo } from "./puntaiq-logo";
import { CheckCircle2 } from "lucide-react";
import { AIServiceStatusIndicator } from "../status/ai-service-status-indicator";

interface MobileHeaderProps {
  minimal?: boolean;
}

export function MobileHeader({ minimal = false }: MobileHeaderProps) {
  const [_, navigate] = useLocation();

  return (
    <div className="w-full bg-white dark:bg-gray-900 p-4 border-b border-gray-200 dark:border-gray-800">
      {minimal ? (
        <div className="flex items-center">
          <div 
            className="mr-4 cursor-pointer" 
            onClick={() => navigate("/")}
          >
            <PuntaIQLogo showText={false} size="sm" />
          </div>
          <h1 
            className="text-xl font-bold text-gray-800 dark:text-white cursor-pointer"
            onClick={() => navigate("/")}
          >
            PuntaIQ
          </h1>
        </div>
      ) : (
        <div className="flex flex-col space-y-2">
          <div className="flex items-center justify-between">
            <div 
              className="flex items-center cursor-pointer" 
              onClick={() => navigate("/")}
            >
              <div className="mr-2">
                <PuntaIQLogo showText={false} size="sm" />
              </div>
              <h1 className="text-xl font-bold text-gray-800 dark:text-white">
                PuntaIQ
              </h1>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="bg-white dark:bg-gray-800 rounded-lg py-1 px-3 border border-gray-200 dark:border-gray-700 flex items-center space-x-4">
                <div className="flex items-center">
                  <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                    <span className="mr-2">System Status:</span>
                    <span className="flex items-center">
                      <span className="h-2.5 w-2.5 bg-green-500 rounded-full mr-1 animate-pulse"></span>
                      <span className="text-xs whitespace-nowrap">Operational</span>
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                  <span className="flex items-center">
                    <span className="h-2.5 w-2.5 bg-green-500 rounded-full mr-1"></span>
                    <span>TheSportsDB</span>
                  </span>
                </div>
                
                <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                  <span className="flex items-center">
                    <span className="h-2.5 w-2.5 bg-green-500 rounded-full mr-1"></span>
                    <span>OddsAPI</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}