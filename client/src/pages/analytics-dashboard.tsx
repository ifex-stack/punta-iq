import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getQueryFn } from '@/lib/queryClient';
import { Link, useLocation } from 'wouter';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { useAnalytics } from '@/hooks/use-analytics';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { Loader2, LineChart, BarChart as BarChartIcon, PieChart as PieChartIcon, Activity, AlertTriangle, Shield } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { AccessDenied } from '@/components/ui/access-denied';

// Define interfaces for analytics data
interface AnalyticsPerformanceData {
  apiPerformance: PerformanceMetric[];
  errorCount: ErrorCount[];
  userActivity: UserActivity[];
  featureUsage: FeatureUsage[];
}

interface PerformanceMetric {
  endpoint: string;
  avgResponseTime: number;
  count: number;
  successRate: number;
}

interface ErrorCount {
  errorType: string;
  count: number;
  percentage: number;
}

interface UserActivity {
  date: string;
  activeUsers: number;
  newUsers: number;
}

interface FeatureUsage {
  feature: string;
  count: number;
  percentage: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function AnalyticsDashboard() {
  const { trackPageView } = useAnalytics();
  const { toast } = useToast();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [timeRange, setTimeRange] = useState('7d');
  
  // Check if user has access to this page (admin or analyst role)
  const hasAccess = user && (user.role === 'admin' || user.role === 'analyst');
  
  // Track the page view
  useState(() => {
    // Track the page view on initial load
    setTimeout(() => {
      trackPageView('/analytics-dashboard');
    }, 0);
    return undefined;
  });
  
  // Redirect if user doesn't have required role
  useEffect(() => {
    if (user && !hasAccess) {
      toast({
        title: "Access Denied",
        description: "You do not have permission to view the analytics dashboard",
        variant: "destructive"
      });
      setLocation('/');
    }
  }, [user, hasAccess, toast, setLocation]);

  // Fetch analytics data only if the user has access
  const { 
    data: analyticsData,
    isLoading,
    error
  } = useQuery<AnalyticsPerformanceData>({
    queryKey: ['/api/analytics/dashboard', timeRange],
    queryFn: () => fetch(`/api/analytics/dashboard?timeRange=${timeRange}`).then(res => {
      if (res.status === 403) {
        throw new Error('Permission denied');
      }
      if (!res.ok) throw new Error('Failed to fetch analytics data');
      return res.json();
    }),
    refetchOnWindowFocus: false,
    enabled: !!hasAccess, // Only fetch if user has access
  });

  // Handle error state
  if (error) {
    toast({
      title: "Error loading analytics",
      description: "There was a problem loading the analytics data. Please try again later.",
      variant: "destructive"
    });
  }

  // Create sample data if needed (this will be replaced with real data from the API)
  const sampleData = {
    apiPerformance: [
      { endpoint: '/api/predictions', avgResponseTime: 120, count: 450, successRate: 99.2 },
      { endpoint: '/api/user', avgResponseTime: 85, count: 2300, successRate: 99.8 },
      { endpoint: '/api/accumulators', avgResponseTime: 180, count: 380, successRate: 98.5 },
      { endpoint: '/api/tiered-predictions', avgResponseTime: 210, count: 280, successRate: 97.9 },
      { endpoint: '/api/ai-status', avgResponseTime: 90, count: 120, successRate: 100 }
    ],
    errorCount: [
      { errorType: 'API Connection', count: 24, percentage: 38 },
      { errorType: 'Client Error', count: 18, percentage: 28 },
      { errorType: 'Authentication', count: 12, percentage: 19 },
      { errorType: 'Network', count: 8, percentage: 13 },
      { errorType: 'Other', count: 2, percentage: 2 }
    ],
    userActivity: [
      { date: '2025-04-26', activeUsers: 1250, newUsers: 120 },
      { date: '2025-04-27', activeUsers: 1380, newUsers: 145 },
      { date: '2025-04-28', activeUsers: 1520, newUsers: 165 },
      { date: '2025-04-29', activeUsers: 1640, newUsers: 152 },
      { date: '2025-04-30', activeUsers: 1590, newUsers: 138 },
      { date: '2025-05-01', activeUsers: 1720, newUsers: 190 },
      { date: '2025-05-02', activeUsers: 1850, newUsers: 210 }
    ],
    featureUsage: [
      { feature: 'Tiered Predictions', count: 980, percentage: 32 },
      { feature: 'Accumulators', count: 650, percentage: 21 },
      { feature: 'Fantasy Teams', count: 480, percentage: 16 },
      { feature: 'News', count: 420, percentage: 14 },
      { feature: 'Statistics', count: 340, percentage: 11 },
      { feature: 'Other', count: 180, percentage: 6 }
    ]
  };

  // Use real data if available, otherwise sample data
  const data = analyticsData || sampleData;
  
  // Show access denied component if user doesn't have required role
  if (user && !hasAccess) {
    return (
      <AccessDenied 
        title="Analytics Access Denied"
        description="You do not have permission to view the analytics dashboard"
      />
    );
  }
  
  // Show loading state when we don't know yet if user has access
  if (!user) {
    return (
      <div className="container py-6 mx-auto flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Checking permissions...</span>
      </div>
    );
  }

  return (
    <div className="container py-6 mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <div className="flex mt-2 space-x-4">
            <Link href="/analytics-dashboard" className="text-primary hover:underline font-medium">
              Performance Analytics
            </Link>
            <Link href="/user-demographics" className="text-muted-foreground hover:text-primary hover:underline">
              User Demographics
            </Link>
          </div>
        </div>
        
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="24h">Last 24 hours</SelectItem>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading analytics data...</span>
        </div>
      ) : (
        <Tabs defaultValue="overview">
          <TabsList className="mb-6">
            <TabsTrigger value="overview" className="flex items-center">
              <Activity className="mr-2 h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="api" className="flex items-center">
              <LineChart className="mr-2 h-4 w-4" />
              API Performance
            </TabsTrigger>
            <TabsTrigger value="errors" className="flex items-center">
              <PieChartIcon className="mr-2 h-4 w-4" />
              Errors
            </TabsTrigger>
            <TabsTrigger value="features" className="flex items-center">
              <BarChartIcon className="mr-2 h-4 w-4" />
              Feature Usage
            </TabsTrigger>
          </TabsList>
          
          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>User Activity</CardTitle>
                  <CardDescription>Daily active and new users over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={data.userActivity}
                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Area
                          type="monotone"
                          dataKey="activeUsers"
                          stackId="1"
                          stroke="#8884d8"
                          fill="#8884d8"
                          name="Active Users"
                        />
                        <Area
                          type="monotone"
                          dataKey="newUsers"
                          stackId="2"
                          stroke="#82ca9d"
                          fill="#82ca9d"
                          name="New Users"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Feature Usage</CardTitle>
                  <CardDescription>Most used features in the platform</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={data.featureUsage}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="count"
                          nameKey="feature"
                        >
                          {data.featureUsage.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value, name, props) => [`${value} uses`, props.payload.feature]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* API Performance Tab */}
          <TabsContent value="api">
            <Card>
              <CardHeader>
                <CardTitle>API Response Times</CardTitle>
                <CardDescription>Average response time for key API endpoints</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={data.apiPerformance}
                      margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="endpoint" angle={-45} textAnchor="end" height={70} />
                      <YAxis label={{ value: 'Response Time (ms)', angle: -90, position: 'insideLeft' }} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="avgResponseTime" name="Avg Response Time (ms)" fill="#8884d8" />
                      <Bar dataKey="count" name="Request Count" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Errors Tab */}
          <TabsContent value="errors">
            <Card>
              <CardHeader>
                <CardTitle>Error Distribution</CardTitle>
                <CardDescription>Breakdown of error types in the application</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.errorCount}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={130}
                        fill="#8884d8"
                        dataKey="count"
                        nameKey="errorType"
                      >
                        {data.errorCount.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} occurrences`, 'Count']} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Feature Usage Tab */}
          <TabsContent value="features">
            <Card>
              <CardHeader>
                <CardTitle>Feature Usage Analysis</CardTitle>
                <CardDescription>Detailed breakdown of feature usage</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={data.featureUsage}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="feature" />
                      <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                      <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                      <Tooltip />
                      <Legend />
                      <Bar yAxisId="left" dataKey="count" name="Usage Count" fill="#8884d8" />
                      <Bar yAxisId="right" dataKey="percentage" name="Usage %" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}