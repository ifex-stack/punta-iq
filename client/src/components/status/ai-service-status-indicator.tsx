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

interface AIServiceStatusIndicatorProps {
  size?: 'small' | 'default' | 'large';
  className?: string;
}

export function AIServiceStatusIndicator({ 
  size = 'default',
  className = ''
}: AIServiceStatusIndicatorProps) {
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
  
  // Get component size based on the size prop
  const getDotSize = () => {
    switch (size) {
      case 'small': return 'w-2 h-2';
      case 'large': return 'w-4 h-4';
      default: return 'w-3 h-3';
    }
  };
  
  const getTextSize = () => {
    switch (size) {
      case 'small': return 'text-[10px]';
      case 'large': return 'text-sm';
      default: return 'text-xs';
    }
  };
  
  const getIconSize = () => {
    switch (size) {
      case 'small': return 'h-3 w-3';
      case 'large': return 'h-5 w-5';
      default: return 'h-4 w-4';
    }
  };
  
  // Get status icon with correct size
  const getStatusIconSized = () => {
    const iconSize = getIconSize();
    if (isLoading) return <RefreshCw className={`${iconSize} animate-spin`} />;
    if (isError) return <XCircle className={iconSize} />;
    
    switch (status?.status) {
      case "online":
        return <CheckCircle2 className={iconSize} />;
      case "degraded":
        return <AlertTriangle className={iconSize} />;
      case "offline":
        return <XCircle className={iconSize} />;
      default:
        return <Server className={iconSize} />;
    }
  };
  
  // Custom rendering for small size - just a dot
  if (size === 'small') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <div className={`${getDotSize()} rounded-full ${getStatusColor()} animate-pulse`} />
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs">
            <p className="text-xs">AI Service: {getStatusText()}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  
  // Custom rendering for large size
  if (size === 'large') {
    return (
      <div className={`rounded-lg bg-card border border-border p-3 ${className}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className={`${getDotSize()} rounded-full ${getStatusColor()}`} />
            <h3 className="font-medium">AI Service</h3>
          </div>
          {getStatusIconSized()}
        </div>
        
        <div className={`${getTextSize()} font-medium`}>
          Status: {getStatusText()}
        </div>
        
        <p className="text-xs text-muted-foreground mt-1">
          {status?.message || error?.message || (
            status?.status === "online" 
              ? "The AI prediction service is running normally." 
              : status?.status === "degraded"
              ? "The AI service is running with reduced capabilities."
              : "The AI prediction service is currently offline."
          )}
        </p>
        
        {status?.status === "offline" && (
          <Button 
            className="w-full mt-3 h-9"
            onClick={handleRestart}
            disabled={isRestarting}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRestarting ? 'animate-spin' : ''}`} />
            {isRestarting ? "Restarting..." : "Restart Service"}
          </Button>
        )}
      </div>
    );
  }
  
  // Default size rendering
  if (isLoading) {
    return <Skeleton className="h-8 w-24" />;
  }
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`flex items-center space-x-2 ${className}`}>
            <Badge 
              variant="outline" 
              className="flex items-center gap-1.5 px-2 py-1"
            >
              <div className={`${getDotSize()} rounded-full ${getStatusColor()}`} />
              <span className={getTextSize()}>AI: {getStatusText()}</span>
              {getStatusIconSized()}
            </Badge>
            
            {status?.status === "offline" && (
              <Button 
                size="sm" 
                variant="ghost" 
                className="h-8 px-2 touch-manipulation active:scale-95 transition-transform"
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