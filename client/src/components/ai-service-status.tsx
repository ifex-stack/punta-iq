import { 
  AlertCircle, 
  Check, 
  Gauge, 
  HelpCircle, 
  RefreshCw,
  Server,
  ServerOff
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, getQueryFn, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ServiceStatusDetail {
  status: string;
  message?: string;
  lastCheck?: string;
}

interface AIServiceDetailedStatus {
  overall: string;
  services: {
    [key: string]: ServiceStatusDetail;
  };
  timestamp: string;
}

interface AIServiceStatus {
  status: 'online' | 'offline' | 'degraded' | 'error';
  message: string;
  detailed?: AIServiceDetailedStatus;
}

export function AIServiceStatus() {
  const { toast } = useToast();

  // Query AI service status
  const { 
    data: statusData, 
    isLoading: isStatusLoading, 
    error: statusError,
    refetch: refetchStatus
  } = useQuery<AIServiceStatus>({
    queryKey: ['/api/ai-status'],
    queryFn: getQueryFn({ on401: "returnNull" }),
    refetchInterval: 60000, // Refetch every minute
    refetchOnWindowFocus: true
  });

  // Mutation for restarting the service
  const restartMutation = useMutation({
    mutationFn: async () => {
      const result = await apiRequest('POST', '/api/ai-status/start');
      return await result.json();
    },
    onSuccess: () => {
      toast({
        title: "Service restart initiated",
        description: "The AI service restart has been initiated. This may take a moment.",
      });
      
      // Invalidate the status query after a delay to allow for restart
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['/api/ai-status'] });
      }, 5000);
    },
    onError: (error: Error) => {
      toast({
        title: "Restart failed",
        description: `Failed to restart AI service: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Status badge based on service status
  const renderStatusBadge = (status: string) => {
    switch(status) {
      case 'online':
        return <Badge className="bg-green-500 hover:bg-green-600">Online</Badge>;
      case 'offline':
        return <Badge variant="destructive">Offline</Badge>;
      case 'degraded':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-300">
          Degraded
        </Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  // Status icon based on service status
  const renderStatusIcon = (status: string) => {
    switch(status) {
      case 'online':
        return <Check className="h-5 w-5 text-green-500" />;
      case 'offline':
        return <ServerOff className="h-5 w-5 text-red-500" />;
      case 'degraded':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      default:
        return <HelpCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  // Function to format date strings nicely
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Render loading state
  if (isStatusLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            <Skeleton className="h-6 w-48" />
          </CardTitle>
          <CardDescription>
            <Skeleton className="h-4 w-full" />
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-16 w-full" />
          </div>
        </CardContent>
        <CardFooter>
          <Skeleton className="h-9 w-24" />
        </CardFooter>
      </Card>
    );
  }

  // Render error state
  if (statusError) {
    return (
      <Card className="w-full border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-700">
            <AlertCircle className="h-5 w-5" />
            AI Service Status Error
          </CardTitle>
          <CardDescription className="text-red-600">
            Unable to connect to the AI service status endpoint
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-600">
            {(statusError as Error).message}
          </p>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={() => refetchStatus()} 
            variant="outline" 
            className="border-red-300 text-red-700 hover:bg-red-100"
            disabled={restartMutation.isPending}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Render normal state
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Server className="h-5 w-5" />
          AI Prediction Service Status
          {statusData && renderStatusBadge(statusData.status)}
        </CardTitle>
        <CardDescription>
          {statusData?.message || 'AI service status information'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {statusData?.detailed && (
          <div className="space-y-4">
            <div className="text-xs text-muted-foreground">
              Last updated: {formatDate(statusData.detailed.timestamp)}
            </div>

            <div className="space-y-2">
              {statusData.detailed.services && Object.entries(statusData.detailed.services).map(([name, service]) => (
                <div key={name} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-2">
                    {renderStatusIcon(service.status)}
                    <div>
                      <div className="font-medium capitalize">{name.replace('_', ' ')}</div>
                      <div className="text-xs text-muted-foreground">{service.message || 'No details available'}</div>
                    </div>
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center">
                          <Gauge className="h-4 w-4 text-muted-foreground" />
                          <span className="ml-1 text-xs">{service.status}</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Last check: {service.lastCheck ? formatDate(service.lastCheck) : 'N/A'}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button 
          onClick={() => refetchStatus()} 
          variant="outline"
          disabled={restartMutation.isPending}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
        
        <Button 
          onClick={() => restartMutation.mutate()} 
          variant={statusData?.status === 'offline' ? 'default' : 'secondary'}
          disabled={restartMutation.isPending || statusData?.status === 'online'}
        >
          {restartMutation.isPending ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Restarting...
            </>
          ) : (
            <>
              <Server className="mr-2 h-4 w-4" />
              {statusData?.status === 'offline' ? 'Start Service' : 'Restart Service'}
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}