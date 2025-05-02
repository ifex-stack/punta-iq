import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  RefreshCw,
  Server
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ServiceStatus {
  status: "online" | "offline" | "degraded" | "error";
  detailed?: {
    overall: string;
    services: Record<string, {
      status: string;
      lastCheck: string;
    }>;
    timestamp: string;
  };
  message?: string;
  uptime?: string;
  lastRestartAt?: string | null;
}

export function AIServiceStatusIndicator() {
  const { toast } = useToast();
  const [isRestarting, setIsRestarting] = useState(false);
  
  const { 
    data: status, 
    isLoading, 
    error, 
    isError,
    refetch 
  } = useQuery<ServiceStatus>({
    queryKey: ["/api/ai-status"],
    queryFn: getQueryFn({ on401: "throw" }),
    refetchInterval: 30000, // Refetch every 30 seconds
  });
  
  const handleRestart = async () => {
    if (isRestarting) return;
    
    setIsRestarting(true);
    try {
      await apiRequest("POST", "/api/ai-status/start");
      toast({
        title: "Restart initiated",
        description: "The AI service restart has been initiated. This may take a moment.",
      });
      
      // Wait a moment then refetch the status
      setTimeout(() => {
        refetch();
        setIsRestarting(false);
      }, 5000);
    } catch (error) {
      toast({
        title: "Restart failed",
        description: "Failed to restart the AI service. Please try again later.",
        variant: "destructive",
      });
      setIsRestarting(false);
    }
  };
  
  const getStatusColor = () => {
    if (isLoading) return "bg-gray-300";
    if (isError) return "bg-red-500";
    
    switch (status?.status) {
      case "online": 
        return "bg-green-500";
      case "degraded": 
        return "bg-yellow-500";
      case "offline": 
        return "bg-red-500";
      default: 
        return "bg-gray-300";
    }
  };
  
  const getStatusText = () => {
    if (isLoading) return "Checking...";
    if (isError) return "Error";
    
    switch (status?.status) {
      case "online": 
        return "Online";
      case "degraded": 
        return "Degraded";
      case "offline": 
        return "Offline";
      default: 
        return "Unknown";
    }
  };
  
  const getStatusIcon = () => {
    if (isLoading) return <RefreshCw className="h-4 w-4 animate-spin" />;
    if (isError) return <XCircle className="h-4 w-4" />;
    
    switch (status?.status) {
      case "online":
        return <CheckCircle2 className="h-4 w-4" />;
      case "degraded":
        return <AlertTriangle className="h-4 w-4" />;
      case "offline":
        return <XCircle className="h-4 w-4" />;
      default:
        return <Server className="h-4 w-4" />;
    }
  };
  
  if (isLoading) {
    return <Skeleton className="h-8 w-24" />;
  }
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center space-x-2">
            <Badge 
              variant="outline" 
              className="flex items-center gap-1 px-2 py-1"
            >
              <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
              <span className="text-xs">AI: {getStatusText()}</span>
              {getStatusIcon()}
            </Badge>
            
            {status?.status === "offline" && (
              <Button 
                size="sm" 
                variant="ghost" 
                className="h-8 px-2"
                onClick={handleRestart}
                disabled={isRestarting}
              >
                <RefreshCw className={`h-4 w-4 ${isRestarting ? 'animate-spin' : ''}`} />
                <span className="sr-only">Restart</span>
              </Button>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent className="max-w-sm">
          <div className="space-y-2 p-1">
            <h4 className="font-medium">AI Service Status</h4>
            <p className="text-xs">
              {status?.message || error?.message || (
                status?.status === "online" 
                  ? "The AI prediction service is running normally." 
                  : status?.status === "degraded"
                  ? "The AI service is running with reduced capabilities."
                  : "The AI prediction service is currently offline."
              )}
            </p>
            {status?.lastRestartAt && (
              <p className="text-xs text-muted-foreground">
                Last restart: {new Date(status.lastRestartAt).toLocaleString()}
              </p>
            )}
            {status?.status === "degraded" && status.detailed && (
              <div className="text-xs">
                <h5 className="font-medium mt-2">Service Details:</h5>
                <ul className="list-disc list-inside">
                  {Object.entries(status.detailed.services).map(([name, info]) => (
                    <li key={name}>
                      {name}: <span className={info.status === "ok" ? "text-green-500" : "text-red-500"}>
                        {info.status}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="text-xs text-muted-foreground mt-2">
              {isError 
                ? "Unable to connect to status service" 
                : `Last checked: ${new Date().toLocaleTimeString()}`}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}