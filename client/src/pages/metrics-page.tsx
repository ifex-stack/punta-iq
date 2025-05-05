import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { BarChart, LineChart, PieChart } from "lucide-react";
import BettingSuccessMetrics from "@/components/BettingSuccessMetrics";
import { Skeleton } from "@/components/ui/skeleton";

// Define types for API responses
interface BettingMetrics {
  recentSuccessRate: number;
  monthlySuccessRate: number;
  yearlySuccessRate: number;
  totalBets: number;
  streak: number;
  tier: string;
  historical: {
    daily: Array<{
      date: string;
      successRate: number;
      betsCount: number;
    }>;
    categories: {
      [sport: string]: number;
    };
  };
}

interface SportMetrics {
  sport: string;
  overallSuccessRate: number;
  monthlyTrend: Array<{
    month: string;
    successRate: number;
  }>;
  marketPerformance: {
    [market: string]: number;
  };
}

interface HistoricalMetrics {
  period: string;
  timestamps: string[];
  successRates: number[];
  betCounts: number[];
}

const MetricsPage: React.FC = () => {
  // Fetch overall betting metrics
  const { data: metricsData, isLoading: isLoadingMetrics, error: metricsError } = 
    useQuery<BettingMetrics>({
      queryKey: ['/api/betting-metrics'],
    });

  // Fetch football-specific metrics
  const { data: footballMetrics, isLoading: isLoadingFootball } = 
    useQuery<SportMetrics>({
      queryKey: ['/api/betting-metrics/sport', 'football'],
      enabled: !isLoadingMetrics && !metricsError,
    });

  // Fetch historical metrics (30 days by default)
  const { data: historicalMetrics, isLoading: isLoadingHistorical } = 
    useQuery<HistoricalMetrics>({
      queryKey: ['/api/betting-metrics/historical'],
      enabled: !isLoadingMetrics && !metricsError,
    });

  // Basic error handling
  if (metricsError) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load betting metrics data. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Prediction Performance Metrics</h1>
      
      <div className="grid gap-6 grid-cols-1 md:grid-cols-12">
        {/* Main metrics card - spans 12 columns on medium screens and up */}
        <div className="md:col-span-12">
          {isLoadingMetrics ? (
            <Skeleton className="h-[300px] w-full" />
          ) : metricsData ? (
            <BettingSuccessMetrics 
              recentSuccessRate={metricsData.recentSuccessRate}
              monthlySuccessRate={metricsData.monthlySuccessRate}
              yearlySuccessRate={metricsData.yearlySuccessRate}
              totalBets={metricsData.totalBets}
              streak={metricsData.streak}
              tier={metricsData.tier}
            />
          ) : null}
        </div>

        {/* Tabs for detailed metrics - spans 12 columns */}
        <div className="md:col-span-12">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <BarChart className="h-4 w-4" />
                <span>Overview</span>
              </TabsTrigger>
              <TabsTrigger value="historical" className="flex items-center gap-2">
                <LineChart className="h-4 w-4" />
                <span>Historical</span>
              </TabsTrigger>
              <TabsTrigger value="sports" className="flex items-center gap-2">
                <PieChart className="h-4 w-4" />
                <span>By Sport</span>
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Success Rate by Sport</CardTitle>
                    <CardDescription>
                      Prediction success rates across different sports
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoadingMetrics ? (
                      <Skeleton className="h-[200px] w-full" />
                    ) : metricsData ? (
                      <div className="space-y-4">
                        {Object.entries(metricsData.historical.categories).map(([sport, rate]) => (
                          <div key={sport} className="space-y-1">
                            <div className="flex justify-between items-center">
                              <span className="text-sm capitalize">{sport}</span>
                              <span className="text-sm font-medium">{rate}%</span>
                            </div>
                            <div className="relative w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className={`absolute top-0 left-0 h-full ${rate >= 70 ? 'bg-green-500' : rate >= 55 ? 'bg-amber-500' : 'bg-red-500'}`}
                                style={{ width: `${rate}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Recent Performance</CardTitle>
                    <CardDescription>
                      Success rates for the past 7 days
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoadingMetrics ? (
                      <Skeleton className="h-[200px] w-full" />
                    ) : metricsData ? (
                      <div className="space-y-4">
                        {metricsData.historical.daily.map((day) => (
                          <div key={day.date} className="space-y-1">
                            <div className="flex justify-between items-center">
                              <span className="text-sm">{new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">{day.betsCount} bets</span>
                                <span className="text-sm font-medium">{day.successRate}%</span>
                              </div>
                            </div>
                            <div className="relative w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className={`absolute top-0 left-0 h-full ${day.successRate >= 70 ? 'bg-green-500' : day.successRate >= 55 ? 'bg-amber-500' : 'bg-red-500'}`}
                                style={{ width: `${day.successRate}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Historical Tab */}
            <TabsContent value="historical" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Historical Performance</CardTitle>
                  <CardDescription>
                    Long-term success rates and prediction volume
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingHistorical ? (
                    <Skeleton className="h-[400px] w-full" />
                  ) : historicalMetrics ? (
                    <div className="h-[400px] flex items-center justify-center">
                      <p className="text-muted-foreground">
                        Charts would display historical data over time here
                      </p>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Sports Tab */}
            <TabsContent value="sports" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Football Predictions</CardTitle>
                  <CardDescription>
                    Detailed performance metrics for football predictions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingFootball ? (
                    <Skeleton className="h-[300px] w-full" />
                  ) : footballMetrics ? (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-medium mb-2">Market Performance</h3>
                        <div className="space-y-3">
                          {Object.entries(footballMetrics.marketPerformance).map(([market, rate]) => (
                            <div key={market} className="space-y-1">
                              <div className="flex justify-between items-center">
                                <span className="text-sm">{market}</span>
                                <span className="text-sm font-medium">{rate}%</span>
                              </div>
                              <div className="relative w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div 
                                  className={`absolute top-0 left-0 h-full ${rate >= 70 ? 'bg-green-500' : rate >= 55 ? 'bg-amber-500' : 'bg-red-500'}`}
                                  style={{ width: `${rate}%` }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default MetricsPage;