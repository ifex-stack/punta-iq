import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, WifiIcon, WifiOffIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';

export function NotificationConnectionStatus() {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [reconnectAttempts, setReconnectAttempts] = useState<number>(0);
  const [lastActivity, setLastActivity] = useState<Date | null>(null);
  const [isCheckingConnection, setIsCheckingConnection] = useState<boolean>(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    // Check the WebSocket connection status when component mounts
    checkConnectionStatus();

    // Listen for WebSocket events from the notification system
    const handleSocketOpen = () => {
      setIsConnected(true);
      setLastActivity(new Date());
      setReconnectAttempts(0);
    };

    const handleSocketClose = () => {
      setIsConnected(false);
      setLastActivity(new Date());
    };

    const handleReconnectAttempt = (event: CustomEvent) => {
      setReconnectAttempts(event.detail.attempt || 0);
      setLastActivity(new Date());
    };

    const handleSocketError = () => {
      setIsConnected(false);
      setLastActivity(new Date());
    };

    // Add event listeners for WebSocket events
    window.addEventListener('websocket:open', handleSocketOpen);
    window.addEventListener('websocket:close', handleSocketClose);
    window.addEventListener('websocket:reconnect', handleReconnectAttempt as EventListener);
    window.addEventListener('websocket:error', handleSocketError);

    // Setup periodic check
    const intervalId = setInterval(checkConnectionStatus, 10000);

    // Cleanup when component unmounts
    return () => {
      window.removeEventListener('websocket:open', handleSocketOpen);
      window.removeEventListener('websocket:close', handleSocketClose);
      window.removeEventListener('websocket:reconnect', handleReconnectAttempt as EventListener);
      window.removeEventListener('websocket:error', handleSocketError);
      clearInterval(intervalId);
    };
  }, []);

  // Function to check the current WebSocket connection status
  const checkConnectionStatus = () => {
    // This is a simple check that doesn't actually verify the WebSocket's internal state
    // In a real-world scenario, you would have a reliable way to check the actual WS connection
    
    // For PuntaIQ, we'll look for the _ws_connected flag in localStorage 
    // which should be set by the WebSocket connection handler
    const connected = localStorage.getItem('_ws_connected') === 'true';
    setIsConnected(connected);
    
    // If the connection is supposedly active, we can check if it's really
    // responding by sending a ping message through a custom event
    if (connected) {
      try {
        // Dispatch a custom event that the WebSocket handler should listen for
        const pingEvent = new CustomEvent('websocket:ping', {
          detail: { timestamp: new Date().toISOString() }
        });
        window.dispatchEvent(pingEvent);
      } catch (error) {
        console.error('Error sending WebSocket ping:', error);
      }
    }
  };

  // Function to manually attempt reconnection
  const attemptReconnection = () => {
    setIsCheckingConnection(true);
    
    try {
      // Dispatch a custom event that the WebSocket handler should listen for
      const reconnectEvent = new CustomEvent('websocket:manual_reconnect', {
        detail: { userId: user?.id, timestamp: new Date().toISOString() }
      });
      window.dispatchEvent(reconnectEvent);
      
      toast({
        title: 'Reconnection Initiated',
        description: 'Attempting to reconnect to the notification system...',
      });
      
      // We'll check the connection status after a short delay
      setTimeout(() => {
        checkConnectionStatus();
        setIsCheckingConnection(false);
      }, 3000);
    } catch (error) {
      console.error('Error initiating reconnection:', error);
      setIsCheckingConnection(false);
      
      toast({
        title: 'Reconnection Failed',
        description: 'Unable to initiate WebSocket reconnection.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Notification Connection Status</CardTitle>
        <CardDescription>
          Status of the WebSocket connection for real-time notifications
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between p-2 bg-muted rounded-md">
            <div className="flex items-center space-x-2">
              {isConnected ? (
                <WifiIcon className="h-5 w-5 text-green-500" />
              ) : (
                <WifiOffIcon className="h-5 w-5 text-red-500" />
              )}
              <span className="font-medium">Connection Status:</span>
            </div>
            <Badge
              variant={isConnected ? 'default' : 'destructive'}
              className={isConnected ? 'bg-green-500' : ''}
            >
              {isConnected ? 'Connected' : 'Disconnected'}
            </Badge>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex flex-col p-2 bg-muted/50 rounded-md">
              <span className="text-muted-foreground">Last Activity</span>
              <span className="font-medium">
                {lastActivity ? lastActivity.toLocaleTimeString() : 'No activity recorded'}
              </span>
            </div>
            
            <div className="flex flex-col p-2 bg-muted/50 rounded-md">
              <span className="text-muted-foreground">Reconnection Attempts</span>
              <span className="font-medium">{reconnectAttempts}</span>
            </div>
          </div>
          
          <Button 
            onClick={attemptReconnection} 
            disabled={isCheckingConnection}
            variant="outline"
            className="w-full mt-2 flex items-center justify-center gap-2"
          >
            {isCheckingConnection ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Checking...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                {isConnected ? 'Test Connection' : 'Reconnect'}
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}