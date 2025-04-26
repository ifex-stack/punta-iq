import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { 
  getNotificationMetrics, 
  getNotificationPerformanceSummary, 
  clearNotificationMetrics 
} from '@/lib/notification-metrics';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trash2, RefreshCw } from 'lucide-react';

export function NotificationMetricsPanel() {
  const [metrics, setMetrics] = useState(getNotificationMetrics());
  const [summary, setSummary] = useState(getNotificationPerformanceSummary());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();

  // Update metrics whenever component mounts or refreshes
  useEffect(() => {
    refreshMetrics();
    
    // Setup polling for real-time updates
    const intervalId = setInterval(refreshMetrics, 30000);
    
    return () => clearInterval(intervalId);
  }, []);

  const refreshMetrics = () => {
    setMetrics(getNotificationMetrics());
    setSummary(getNotificationPerformanceSummary());
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    refreshMetrics();
    
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  const handleClearMetrics = () => {
    if (window.confirm('Are you sure you want to clear all notification metrics data?')) {
      clearNotificationMetrics();
      refreshMetrics();
      
      toast({
        title: 'Metrics Cleared',
        description: 'All notification metrics data has been cleared.',
      });
    }
  };

  // Generate chart data for events by type
  const prepareEventTypeData = () => {
    const eventCounts: Record<string, number> = {};
    
    metrics.events.forEach(event => {
      if (!eventCounts[event.type]) {
        eventCounts[event.type] = 0;
      }
      eventCounts[event.type]++;
    });
    
    return Object.entries(eventCounts).map(([type, count]) => ({
      type,
      count
    }));
  };

  // Generate timeline data for events
  const prepareTimelineData = () => {
    // Group events by hour
    const timePoints: Record<string, number> = {};
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - (24 * 60 * 60 * 1000));
    
    // Initialize timePoints with zero counts for all hours
    for (let i = 0; i < 24; i++) {
      const hourAgo = new Date(now.getTime() - (i * 60 * 60 * 1000));
      const hourKey = hourAgo.toLocaleTimeString([], { hour: '2-digit' });
      timePoints[hourKey] = 0;
    }
    
    // Count events by hour
    metrics.events.forEach(event => {
      const eventDate = new Date(event.timestamp);
      
      // Only include events from the last 24 hours
      if (eventDate >= twentyFourHoursAgo) {
        const hourKey = eventDate.toLocaleTimeString([], { hour: '2-digit' });
        if (timePoints[hourKey] !== undefined) {
          timePoints[hourKey]++;
        }
      }
    });
    
    // Convert to array for chart
    return Object.entries(timePoints)
      .map(([hour, count]) => ({ hour, count }))
      .reverse(); // Most recent hours first
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Notification Metrics</CardTitle>
          <div className="flex space-x-2">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="h-8 gap-1"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={handleClearMetrics}
              className="h-8 gap-1 border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear
            </Button>
          </div>
        </div>
        <CardDescription>
          Performance metrics for the push notification system
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Summary stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-muted rounded-md p-4">
            <p className="text-sm text-muted-foreground">Delivery Rate</p>
            <p className="text-2xl font-bold">
              {summary.deliveryRate.toFixed(1)}%
            </p>
          </div>
          
          <div className="bg-muted rounded-md p-4">
            <p className="text-sm text-muted-foreground">Avg. Delivery Time</p>
            <p className="text-2xl font-bold">
              {summary.avgDeliveryTime ? `${summary.avgDeliveryTime.toFixed(0)}ms` : 'N/A'}
            </p>
          </div>
          
          <div className="bg-muted rounded-md p-4">
            <p className="text-sm text-muted-foreground">Total Notifications</p>
            <p className="text-2xl font-bold">
              {metrics.totalReceived}
            </p>
          </div>
          
          <div className="bg-muted rounded-md p-4">
            <p className="text-sm text-muted-foreground">Events (24h)</p>
            <p className="text-2xl font-bold">
              {summary.eventsLast24h}
            </p>
          </div>
        </div>
        
        {/* Charts */}
        <Tabs defaultValue="timeline" className="w-full">
          <TabsList className="w-full max-w-md grid grid-cols-2">
            <TabsTrigger value="timeline">Timeline (24h)</TabsTrigger>
            <TabsTrigger value="types">Event Types</TabsTrigger>
          </TabsList>
          
          <TabsContent value="timeline" className="pt-4">
            {prepareTimelineData().length > 0 ? (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={prepareTimelineData()}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="count" 
                      name="Events"
                      stroke="#8884d8" 
                      activeDot={{ r: 8 }} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                No timeline data available
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="types" className="pt-4">
            {prepareEventTypeData().length > 0 ? (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={prepareEventTypeData()}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="type" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar 
                      dataKey="count" 
                      name="Count" 
                      fill="#82ca9d" 
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                No event type data available
              </div>
            )}
          </TabsContent>
        </Tabs>
        
        {/* Recent events log */}
        <div>
          <h3 className="text-sm font-medium mb-3">Recent Events</h3>
          {metrics.events.length > 0 ? (
            <div className="max-h-56 overflow-y-auto text-xs border rounded-md">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Time</th>
                    <th className="px-3 py-2 text-left font-medium">Type</th>
                    <th className="px-3 py-2 text-left font-medium">Data</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {metrics.events.slice().reverse().map((event, index) => (
                    <tr key={index} className="hover:bg-muted/50">
                      <td className="px-3 py-2">
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="px-3 py-2">
                        {event.type}
                      </td>
                      <td className="px-3 py-2 font-mono">
                        {event.data ? JSON.stringify(event.data).substring(0, 30) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-4 border rounded-md text-muted-foreground">
              No events recorded yet
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="text-xs text-muted-foreground">
        <p>
          Metrics are stored locally and are only used for development and debugging purposes.
        </p>
      </CardFooter>
    </Card>
  );
}