import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Loader2, AlertCircle, CheckCircle2, Server, RefreshCw } from 'lucide-react';
import { apiRequest, getQueryFn } from '@/lib/queryClient';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface ServiceStatus {
  status: 'ok' | 'error' | 'degraded';
  message: string;
  requests_remaining?: string | null;
}

interface StatusResponse {
  overall: 'ok' | 'error' | 'degraded';
  services: {
    odds_api?: ServiceStatus;
    sportsdb_api?: ServiceStatus;
  };
  timestamp: string;
}

export default function AIServiceStatusPage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Query for fetching the AI service status
  const { 
    data: statusData, 
    isLoading: statusLoading, 
    error: statusError,
    refetch: refetchStatus
  } = useQuery<StatusResponse>({
    queryKey: ['/api/sports/status', refreshTrigger],
    queryFn: getQueryFn(),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Mutation for starting the service
  const startServiceMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/sports/microservice/start');
      return response.json();
    },
    onSuccess: () => {
      // Trigger a refetch of the status after starting the service
      setTimeout(() => {
        setRefreshTrigger(prev => prev + 1);
      }, 2000);
    }
  });

  // Function to handle manual refresh of status
  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
    refetchStatus();
  };

  // Function to get status badge color
  const getStatusColor = (status: 'ok' | 'error' | 'degraded' | 'unknown') => {
    switch (status) {
      case 'ok':
        return 'bg-green-500 hover:bg-green-600';
      case 'error':
        return 'bg-red-500 hover:bg-red-600';
      case 'degraded':
        return 'bg-yellow-500 hover:bg-yellow-600';
      default:
        return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  // Function to get status icon
  const getStatusIcon = (status: 'ok' | 'error' | 'degraded' | 'unknown') => {
    switch (status) {
      case 'ok':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'degraded':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col gap-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">AI Service Status</h1>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={statusLoading}
            >
              {statusLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Refresh
            </Button>
            <Button
              onClick={() => startServiceMutation.mutate()}
              disabled={startServiceMutation.isPending || (statusData?.overall === 'ok')}
            >
              {startServiceMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Server className="h-4 w-4 mr-2" />
              )}
              Start Service
            </Button>
          </div>
        </div>

        {startServiceMutation.isError && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Failed to start the AI service. Please try again.
            </AlertDescription>
          </Alert>
        )}

        {statusError ? (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Failed to fetch service status. The microservice may be down.
            </AlertDescription>
          </Alert>
        ) : statusLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : statusData ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Overall Status Card */}
            <Card className="col-span-full">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Overall Status</CardTitle>
                  <Badge className={getStatusColor(statusData.overall)}>
                    {statusData.overall.toUpperCase()}
                  </Badge>
                </div>
                <CardDescription>
                  Last updated: {new Date(statusData.timestamp).toLocaleString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  {getStatusIcon(statusData.overall)}
                  <span>
                    {statusData.overall === 'ok'
                      ? 'All systems operational'
                      : statusData.overall === 'degraded'
                      ? 'Some services are experiencing issues'
                      : 'Service is experiencing problems'}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Individual API Services */}
            {Object.entries(statusData.services).map(([serviceName, serviceStatus]) => (
              <Card key={serviceName}>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>
                      {serviceName === 'odds_api' ? 'The Odds API' : 'TheSportsDB API'}
                    </CardTitle>
                    <Badge className={getStatusColor(serviceStatus.status)}>
                      {serviceStatus.status.toUpperCase()}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(serviceStatus.status)}
                      <span>{serviceStatus.message}</span>
                    </div>
                    
                    {serviceName === 'odds_api' && serviceStatus.requests_remaining && (
                      <div className="text-sm text-muted-foreground">
                        Requests remaining: {serviceStatus.requests_remaining}
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <div className="text-sm text-muted-foreground">
                    {serviceName === 'odds_api' 
                      ? 'Used for odds data and predictions' 
                      : 'Used for live scores and match data'}
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : null}

        <Separator className="my-4" />

        <div className="mt-8">
          <h2 className="text-2xl font-semibold mb-4">Microservice Documentation</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Odds API</CardTitle>
                <CardDescription>
                  Provides real-time odds data for sports predictions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  The Odds API provides access to real-time odds from multiple bookmakers,
                  supporting various markets including moneyline, spread, and totals.
                </p>
                <div className="mt-4">
                  <h3 className="font-semibold">Available Endpoints:</h3>
                  <ul className="list-disc list-inside mt-2">
                    <li className="text-sm">GET /api/sports/odds/:sport - Get odds for a specific sport</li>
                    <li className="text-sm">GET /api/sports - Get list of available sports</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sports DB API</CardTitle>
                <CardDescription>
                  Provides sports data including leagues, teams, and live scores
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  TheSportsDB API provides comprehensive sports data including leagues,
                  teams, fixtures, and live scores for multiple sports.
                </p>
                <div className="mt-4">
                  <h3 className="font-semibold">Available Endpoints:</h3>
                  <ul className="list-disc list-inside mt-2">
                    <li className="text-sm">GET /api/sports/livescores - Get live scores</li>
                    <li className="text-sm">GET /api/fixtures/league/:id - Get fixtures for a league</li>
                    <li className="text-sm">GET /api/teams/league/:id - Get teams in a league</li>
                    <li className="text-sm">GET /api/leagues - Get all leagues</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}