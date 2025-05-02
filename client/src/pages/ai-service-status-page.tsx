import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { toast } from '@/hooks/use-toast';

/**
 * Status page for the AI microservice
 * This page displays the status of the AI service and allows
 * users to manually start it if needed
 */
export default function AIServiceStatusPage() {
  const [apiKeysError, setApiKeysError] = useState<string | null>(null);

  // Query to get the service status
  const { 
    data: statusData, 
    isLoading: statusLoading, 
    error: statusError,
    refetch: refetchStatus
  } = useQuery({
    queryKey: ['/api/sports/status'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/sports/status');
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Service status check failed');
        }
        return response.json();
      } catch (error: any) {
        if (error.message?.includes('API key')) {
          setApiKeysError(error.message);
        }
        throw error;
      }
    },
    retry: 1,
    refetchInterval: 30000 // Auto-refresh every 30 seconds
  });

  // Mutation to start the microservice
  const startServiceMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/sports/microservice/start');
      return res.json();
    },
    onSuccess: () => {
      toast({ 
        title: "Service Started",
        description: "AI microservice started successfully",
      });
      refetchStatus(); // Refresh status after starting
    },
    onError: (error: any) => {
      toast({ 
        title: "Service Start Failed",
        description: error.message || "Failed to start AI service",
        variant: "destructive"
      });
      
      if (error.message?.includes('API key')) {
        setApiKeysError(error.message);
      }
    }
  });

  // Function to render the status indicator
  const renderStatusIndicator = (service: string, status: any) => {
    const statusValue = status?.status || 'unknown';
    const statusMessage = status?.message || 'Status information not available';
    
    return (
      <div className="flex items-center space-x-2 mb-1">
        {statusValue === 'ok' ? (
          <CheckCircle className="h-5 w-5 text-green-500" />
        ) : statusValue === 'error' ? (
          <XCircle className="h-5 w-5 text-red-500" />
        ) : (
          <AlertTriangle className="h-5 w-5 text-yellow-500" />
        )}
        <span className="font-semibold">{service}:</span>
        <span className={`text-sm ${statusValue === 'ok' ? 'text-green-500' : statusValue === 'error' ? 'text-red-500' : 'text-yellow-500'}`}>
          {statusMessage}
        </span>
      </div>
    );
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">AI Microservice Status</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="p-6">
          <h2 className="text-2xl font-semibold mb-4">Service Status</h2>
          
          {statusLoading && (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Checking service status...</span>
            </div>
          )}
          
          {statusError && !apiKeysError && (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                {statusError instanceof Error 
                  ? statusError.message 
                  : 'Failed to check service status'}
              </AlertDescription>
            </Alert>
          )}
          
          {apiKeysError && (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>API Key Error</AlertTitle>
              <AlertDescription>
                {apiKeysError}
                <div className="mt-2">
                  Please make sure your API keys are configured correctly in the .env file.
                </div>
              </AlertDescription>
            </Alert>
          )}
          
          {statusData && !statusLoading && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-lg font-semibold">
                  Overall Status: 
                  <span className={`ml-2 ${
                    statusData.overall === 'ok' 
                      ? 'text-green-500' 
                      : statusData.overall === 'degraded' 
                        ? 'text-yellow-500' 
                        : 'text-red-500'
                  }`}>
                    {statusData.overall === 'ok' 
                      ? 'Operational' 
                      : statusData.overall === 'degraded' 
                        ? 'Partially Operational' 
                        : 'Not Operational'}
                  </span>
                </span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => refetchStatus()}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
              
              <div className="border rounded-md p-4 mb-4">
                <h3 className="font-semibold mb-2">Service Details</h3>
                {statusData.services && Object.entries(statusData.services).map(([key, value]) => (
                  <div key={key}>
                    {renderStatusIndicator(key === 'odds_api' ? 'Odds API' : key === 'sportsdb_api' ? 'Sports DB API' : key, value)}
                  </div>
                ))}
                
                <div className="text-sm text-gray-500 mt-2">
                  Last checked: {new Date(statusData.timestamp).toLocaleString()}
                </div>
              </div>
              
              <div className="flex justify-center">
                <Button
                  onClick={() => startServiceMutation.mutate()}
                  disabled={startServiceMutation.isPending || statusData.overall === 'ok'}
                >
                  {startServiceMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {statusData.overall === 'ok' ? 'Service Running' : 'Start Service'}
                </Button>
              </div>
            </div>
          )}
        </Card>
        
        <Card className="p-6">
          <h2 className="text-2xl font-semibold mb-4">Service Information</h2>
          
          <div className="mb-4">
            <h3 className="font-semibold mb-2">What is the AI Microservice?</h3>
            <p className="text-gray-700 mb-2">
              The AI Microservice is a separate Python Flask application that provides advanced 
              sports data, odds, and prediction functionality to PuntaIQ. It interfaces with 
              external sports APIs and handles data processing.
            </p>
            <p className="text-gray-700">
              This service works in conjunction with the main application to deliver real-time 
              sports data, odds information, and prediction intelligence.
            </p>
          </div>
          
          <div className="mb-4">
            <h3 className="font-semibold mb-2">API Integration</h3>
            <p className="text-gray-700">
              The microservice integrates with the following APIs:
            </p>
            <ul className="list-disc list-inside text-gray-700 mt-2">
              <li>The Odds API - For betting odds and market data</li>
              <li>TheSportsDB - For live scores and fixtures</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-2">Troubleshooting</h3>
            <p className="text-gray-700 mb-2">
              If the service is not running, you can:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-4">
              <li>Click the "Start Service" button above</li>
              <li>Run <code>node scripts/start-ai-service.js</code> in your terminal</li>
              <li>Check that your API keys are correctly set in the .env file</li>
            </ul>
            
            <Button asChild variant="outline">
              <Link href="/settings">
                Configure API Keys
              </Link>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}