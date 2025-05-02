import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Users, Globe, Smartphone, MonitorIcon } from 'lucide-react';
import { BarChart, Bar, ResponsiveContainer, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { AnalyticsService } from '@/lib/analytics-service';
import { useAnalytics } from '@/hooks/use-analytics';
import { Button } from '@/components/ui/button';

// Color palette for charts
const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#a4de6c', '#d0ed57'];

// Demographics data interface
interface DemographicData {
  locations: Array<{
    country: string;
    count: number;
    percentage: number;
  }>;
  devices: Array<{
    type: string;
    count: number;
    percentage: number;
  }>;
  operatingSystems: Array<{
    name: string;
    count: number;
    percentage: number;
  }>;
  browsers: Array<{
    name: string;
    count: number;
    percentage: number;
  }>;
  subscriptionTiers: Array<{
    tier: string;
    count: number;
    percentage: number;
  }>;
  engagementSegments: Array<{
    segment: string;
    count: number;
    percentage: number;
  }>;
}

/**
 * User Demographics Dashboard Page
 * Shows detailed demographics breakdowns for app users
 */
export default function UserDemographicsPage() {
  const { trackPageView } = useAnalytics();
  const { toast } = useToast();
  
  // Track the page view
  useState(() => {
    // Track the page view on initial load
    setTimeout(() => {
      trackPageView('/user-demographics');
    }, 0);
    return undefined;
  });

  // Fetch demographics data
  const { 
    data: demographicsData,
    isLoading,
    error,
    refetch
  } = useQuery<DemographicData>({
    queryKey: ['/api/analytics/demographics'],
    queryFn: async () => {
      try {
        return await AnalyticsService.getUserDemographics();
      } catch (error) {
        console.error('Failed to fetch demographics data:', error);
        throw new Error('Failed to fetch demographics data');
      }
    },
    refetchOnWindowFocus: false,
  });

  // Handle error state
  if (error) {
    toast({
      title: "Error loading demographics data",
      description: "There was a problem loading the demographics data. Please try again later.",
      variant: "destructive"
    });
  }

  // Function to export demographics data
  const handleExport = async (format: 'csv' | 'json') => {
    try {
      // Export the data
      const blob = await AnalyticsService.exportAnalyticsData('demographicsExport', format);
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `demographics-export.${format}`;
      a.click();
      URL.revokeObjectURL(url);
      
      toast({
        title: "Export successful",
        description: `Demographics data exported as ${format.toUpperCase()} successfully.`,
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "There was a problem exporting the demographics data.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="container py-6 mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">User Demographics</h1>
        
        <div className="flex space-x-2">
          <Button onClick={() => refetch()} variant="outline" size="sm">
            Refresh Data
          </Button>
          <Button onClick={() => handleExport('csv')} variant="outline" size="sm">
            Export CSV
          </Button>
          <Button onClick={() => handleExport('json')} variant="outline" size="sm">
            Export JSON
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading demographics data...</span>
        </div>
      ) : (
        <Tabs defaultValue="locations">
          <TabsList className="mb-6">
            <TabsTrigger value="locations" className="flex items-center">
              <Globe className="mr-2 h-4 w-4" />
              Locations
            </TabsTrigger>
            <TabsTrigger value="devices" className="flex items-center">
              <Smartphone className="mr-2 h-4 w-4" />
              Devices
            </TabsTrigger>
            <TabsTrigger value="platforms" className="flex items-center">
              <MonitorIcon className="mr-2 h-4 w-4" />
              Platforms
            </TabsTrigger>
            <TabsTrigger value="engagement" className="flex items-center">
              <Users className="mr-2 h-4 w-4" />
              Engagement
            </TabsTrigger>
          </TabsList>
          
          {/* Locations Tab */}
          <TabsContent value="locations">
            <Card>
              <CardHeader>
                <CardTitle>User Locations</CardTitle>
                <CardDescription>Geographical distribution of our user base</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={demographicsData?.locations}
                      margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="country" angle={-45} textAnchor="end" height={70} />
                      <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                      <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                      <Tooltip />
                      <Legend />
                      <Bar yAxisId="left" dataKey="count" name="User Count" fill="#8884d8" />
                      <Bar yAxisId="right" dataKey="percentage" name="Percentage (%)" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Devices Tab */}
          <TabsContent value="devices">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Device Types</CardTitle>
                  <CardDescription>Distribution of user device types</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={demographicsData?.devices}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="count"
                          nameKey="type"
                        >
                          {demographicsData?.devices.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value, name, props) => [`${value} users (${props.payload.percentage}%)`, props.payload.type]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Device Performance</CardTitle>
                  <CardDescription>Performance metrics by device type</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={demographicsData?.devices}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="type" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="count" name="User Count" fill="#8884d8" />
                        <Bar dataKey="percentage" name="Percentage" fill="#82ca9d" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Platforms Tab */}
          <TabsContent value="platforms">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Operating Systems</CardTitle>
                  <CardDescription>Distribution of user operating systems</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={demographicsData?.operatingSystems}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="count"
                          nameKey="name"
                        >
                          {demographicsData?.operatingSystems.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Browsers</CardTitle>
                  <CardDescription>Most popular web browsers among users</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={demographicsData?.browsers}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="count"
                          nameKey="name"
                        >
                          {demographicsData?.browsers.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Engagement Tab */}
          <TabsContent value="engagement">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Subscription Tiers</CardTitle>
                  <CardDescription>User distribution across subscription tiers</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={demographicsData?.subscriptionTiers}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="count"
                          nameKey="tier"
                        >
                          {demographicsData?.subscriptionTiers.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value, name, props) => [`${value} users (${props.payload.percentage}%)`, props.payload.tier]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>User Engagement</CardTitle>
                  <CardDescription>User engagement levels</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={demographicsData?.engagementSegments}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="count"
                          nameKey="segment"
                        >
                          {demographicsData?.engagementSegments.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value, name, props) => [`${value} users (${props.payload.percentage}%)`, props.payload.segment]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}