import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { LineChart, Line } from "recharts";
import { PieChart, Pie, Cell } from "recharts";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { BarChart2, PieChart as PieChartIcon, LineChart as LineChartIcon, Activity } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface NotificationMetricsProps {
  className?: string;
}

interface MetricsData {
  clickThroughRate: number;
  notificationCount: number;
  clickCount: number;
  viewCount: number;
  dismissCount: number;
  bySport: Record<string, {
    sent: number;
    clicked: number;
    ctr: number;
  }>;
}

export function NotificationMetricsPanel({ className }: NotificationMetricsProps) {
  const { user } = useAuth();
  
  // Only admin users should be able to view this
  if (!user || user.id !== 1) {
    return null;
  }
  
  const { data: metrics, isLoading, error } = useQuery<MetricsData>({
    queryKey: ['/api/admin/notification-metrics'],
    staleTime: 60000, // 1 minute
  });
  
  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Notification Metrics</CardTitle>
          <CardDescription>Error loading metrics data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-destructive">
            Failed to load notification metrics: {(error as Error).message}
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (isLoading || !metrics) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Notification Metrics</CardTitle>
          <CardDescription>Loading metrics data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-[300px] w-full rounded-md" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-12 w-full rounded-md" />
              <Skeleton className="h-12 w-full rounded-md" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Prepare data for charts
  const sportBarData = Object.entries(metrics.bySport).map(([sport, data]) => ({
    sport: sport.charAt(0).toUpperCase() + sport.slice(1),
    sent: data.sent,
    clicked: data.clicked,
    ctr: Math.round(data.ctr * 100),
  })).filter(item => item.sent > 0);
  
  const overviewData = [
    { name: 'Sent', value: metrics.notificationCount },
    { name: 'Viewed', value: metrics.viewCount },
    { name: 'Clicked', value: metrics.clickCount },
    { name: 'Dismissed', value: metrics.dismissCount },
  ];
  
  // Calculate engagement score (a synthesis of metrics)
  const engagementScore = Math.round(
    ((metrics.viewCount / Math.max(1, metrics.notificationCount)) * 0.3 +
    (metrics.clickCount / Math.max(1, metrics.notificationCount)) * 0.7) * 100
  );
  
  // Colors for pie chart
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];
  
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" /> Notification Metrics
        </CardTitle>
        <CardDescription>
          Track notification engagement across sports and types
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="bySport">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="bySport" className="flex items-center gap-1">
              <BarChart2 className="h-4 w-4" /> By Sport
            </TabsTrigger>
            <TabsTrigger value="overview" className="flex items-center gap-1">
              <PieChartIcon className="h-4 w-4" /> Overview
            </TabsTrigger>
            <TabsTrigger value="engagement" className="flex items-center gap-1">
              <LineChartIcon className="h-4 w-4" /> Engagement
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="bySport" className="space-y-4">
            <h3 className="text-lg font-medium">Notification Metrics by Sport</h3>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={sportBarData}
                  margin={{ top: 20, right: 30, left: 0, bottom: 70 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="sport" angle={-45} textAnchor="end" height={70} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="sent" name="Notifications Sent" fill="#8884d8" />
                  <Bar dataKey="clicked" name="Clicks" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="bg-muted p-4 rounded-md">
                <h4 className="text-sm font-medium mb-1">Total Notifications</h4>
                <p className="text-2xl font-bold">{metrics.notificationCount}</p>
              </div>
              <div className="bg-muted p-4 rounded-md">
                <h4 className="text-sm font-medium mb-1">Click-Through Rate</h4>
                <p className="text-2xl font-bold">{(metrics.clickThroughRate * 100).toFixed(1)}%</p>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="overview">
            <h3 className="text-lg font-medium mb-4">Notification Overview</h3>
            <div className="flex justify-center items-center h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={overviewData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {overviewData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="grid grid-cols-4 gap-4 mt-2">
              {overviewData.map((item, index) => (
                <div key={item.name} className="bg-muted p-3 rounded-md text-center">
                  <h4 className="text-xs font-medium mb-1">{item.name}</h4>
                  <p className="text-xl font-bold" style={{ color: COLORS[index % COLORS.length] }}>
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="engagement">
            <h3 className="text-lg font-medium mb-4">Engagement Score</h3>
            <div className="flex flex-col items-center justify-center h-[300px]">
              <div className="relative w-48 h-48 flex items-center justify-center">
                <svg className="w-full h-full" viewBox="0 0 100 100">
                  <circle
                    className="text-muted-foreground stroke-current"
                    strokeWidth="10"
                    fill="transparent"
                    r="40"
                    cx="50"
                    cy="50"
                  />
                  <circle
                    className="text-primary stroke-current"
                    strokeWidth="10"
                    strokeLinecap="round"
                    fill="transparent"
                    r="40"
                    cx="50"
                    cy="50"
                    strokeDasharray={`${engagementScore * 2.51} 251`}
                    strokeDashoffset="0"
                    transform="rotate(-90 50 50)"
                  />
                </svg>
                <span className="absolute text-4xl font-bold">{engagementScore}%</span>
              </div>
              <p className="text-center mt-6 max-w-md text-muted-foreground">
                The engagement score measures how effectively your notifications are engaging users,
                with higher weight given to clicks over views.
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="bg-muted p-4 rounded-md">
                <h4 className="text-sm font-medium mb-1">View Rate</h4>
                <p className="text-2xl font-bold">
                  {(metrics.viewCount / Math.max(1, metrics.notificationCount) * 100).toFixed(1)}%
                </p>
              </div>
              <div className="bg-muted p-4 rounded-md">
                <h4 className="text-sm font-medium mb-1">Click-Through Rate</h4>
                <p className="text-2xl font-bold">
                  {(metrics.clickCount / Math.max(1, metrics.notificationCount) * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}