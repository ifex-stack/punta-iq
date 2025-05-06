import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend, BarChart, Bar } from 'recharts';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import { CalendarDays, TrendingUp, Calendar, Trophy, ChevronRight } from 'lucide-react';
import { PredictionCard } from '@/components/mobile/prediction-card';
import { format, parseISO, subDays } from 'date-fns';

interface HistoricalData {
  metrics: {
    totalPredictions: number;
    wonCount: number;
    lostCount: number;
    pendingCount: number;
    successRate: number;
    averageOdds: number;
    roi: number;
  };
  predictions: any[];
  monthlyPerformance: {
    month: string;
    year: number;
    total: number;
    won: number;
    successRate: number;
  }[];
  sportPerformance: Record<string, {
    totalPredictions: number;
    wonCount: number;
    lostCount: number;
    successRate: number;
    averageOdds: number;
    roi: number;
  }>;
}

export default function HistoryPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [timeRange, setTimeRange] = useState<string>('30days');
  
  // Get date range based on selection
  const getDateRange = () => {
    const now = new Date();
    
    switch (timeRange) {
      case '7days':
        return { fromDate: format(subDays(now, 7), 'yyyy-MM-dd') };
      case '30days':
        return { fromDate: format(subDays(now, 30), 'yyyy-MM-dd') };
      case '90days':
        return { fromDate: format(subDays(now, 90), 'yyyy-MM-dd') };
      case 'all':
      default:
        return {};
    }
  };
  
  // Fetch historical dashboard data
  const { 
    data: historicalData, 
    isLoading 
  } = useQuery<HistoricalData>({
    queryKey: ['/api/historical-dashboard', timeRange],
    queryFn: async () => {
      const dateRange = getDateRange();
      const params = new URLSearchParams();
      
      // Add fromDate parameter if available
      if (dateRange.fromDate) {
        params.append('fromDate', dateRange.fromDate);
      }
      
      const response = await fetch(`/api/historical-dashboard?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch historical data');
      }
      
      return response.json();
    },
    enabled: !!user,
  });
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };
  
  // Prepare data for pie chart
  const getPieChartData = () => {
    if (!historicalData) return [];
    
    return [
      { name: 'Won', value: historicalData.metrics.wonCount, color: '#22c55e' },
      { name: 'Lost', value: historicalData.metrics.lostCount, color: '#ef4444' },
      { name: 'Pending', value: historicalData.metrics.pendingCount, color: '#f59e0b' }
    ];
  };
  
  // Get recent predictions
  const getRecentPredictions = () => {
    if (!historicalData || !historicalData.predictions) return [];
    
    return historicalData.predictions.slice(0, 5);
  };
  
  return (
    <div className="pb-20">
      {/* Header */}
      <section className="mb-4 mt-2">
        <div className="flex justify-between items-center mb-3">
          <h1 className="text-xl font-bold">Performance History</h1>
          
          {/* Time range selector */}
          <div className="flex items-center gap-1">
            <Button 
              size="sm" 
              variant={timeRange === '7days' ? "default" : "outline"} 
              onClick={() => setTimeRange('7days')}
              className="text-xs h-7 px-2"
            >
              7D
            </Button>
            <Button 
              size="sm" 
              variant={timeRange === '30days' ? "default" : "outline"} 
              onClick={() => setTimeRange('30days')}
              className="text-xs h-7 px-2"
            >
              30D
            </Button>
            <Button 
              size="sm" 
              variant={timeRange === '90days' ? "default" : "outline"} 
              onClick={() => setTimeRange('90days')}
              className="text-xs h-7 px-2"
            >
              90D
            </Button>
            <Button 
              size="sm" 
              variant={timeRange === 'all' ? "default" : "outline"} 
              onClick={() => setTimeRange('all')}
              className="text-xs h-7 px-2"
            >
              All
            </Button>
          </div>
        </div>
      </section>
      
      {/* Tabs */}
      <Tabs defaultValue="overview" onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sports">Sports</TabsTrigger>
          <TabsTrigger value="predictions">History</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-40 w-full rounded-lg" />
              <Skeleton className="h-60 w-full rounded-lg" />
              <Skeleton className="h-40 w-full rounded-lg" />
            </div>
          ) : historicalData ? (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="space-y-6"
            >
              {/* Key metrics */}
              <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3">
                <Card>
                  <CardHeader className="p-3">
                    <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-0">
                    <div className="text-2xl font-bold">
                      {historicalData.metrics.successRate}%
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {historicalData.metrics.wonCount} / {historicalData.metrics.totalPredictions} predictions
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="p-3">
                    <CardTitle className="text-sm font-medium">ROI</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-0">
                    <div className="text-2xl font-bold">
                      {historicalData.metrics.roi >= 0 ? '+' : ''}{historicalData.metrics.roi}%
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Avg. odds {historicalData.metrics.averageOdds}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
              
              {/* Predictions pie chart */}
              <motion.div variants={itemVariants}>
                <Card>
                  <CardHeader className="p-4 pb-0">
                    <CardTitle className="text-sm font-medium">Prediction Results</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="h-52 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={getPieChartData()}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={2}
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            labelLine={false}
                          >
                            {getPieChartData().map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
              
              {/* Monthly performance */}
              <motion.div variants={itemVariants}>
                <Card>
                  <CardHeader className="p-4 pb-0">
                    <CardTitle className="text-sm font-medium">Monthly Performance</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="h-52 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={historicalData.monthlyPerformance.slice(-6)}
                          margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="month" 
                            tick={{ fontSize: 12 }}
                            tickFormatter={(value) => value.substring(0, 3)}
                          />
                          <YAxis yAxisId="left" orientation="left" tick={{ fontSize: 12 }} />
                          <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tick={{ fontSize: 12 }} />
                          <Tooltip />
                          <Line 
                            yAxisId="left"
                            type="monotone" 
                            dataKey="total" 
                            name="Total Predictions"
                            stroke="#8884d8" 
                            strokeWidth={2}
                          />
                          <Line 
                            yAxisId="right"
                            type="monotone" 
                            dataKey="successRate" 
                            name="Success Rate (%)"
                            stroke="#22c55e" 
                            strokeWidth={2}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
              
              {/* Recent predictions */}
              <motion.div variants={itemVariants}>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium">Recent Predictions</h3>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-xs h-7 px-2"
                    onClick={() => setActiveTab('predictions')}
                  >
                    View All <ChevronRight className="h-3 w-3 ml-1" />
                  </Button>
                </div>
                
                <div className="space-y-2">
                  {getRecentPredictions().map(prediction => (
                    <PredictionCard
                      key={prediction.id}
                      homeTeam={prediction.homeTeam}
                      awayTeam={prediction.awayTeam}
                      league={prediction.league}
                      date={prediction.date}
                      odds={prediction.odds}
                      prediction={prediction.prediction}
                    />
                  ))}
                </div>
              </motion.div>
            </motion.div>
          ) : (
            <div className="text-center p-8">
              <p>No historical data available</p>
            </div>
          )}
        </TabsContent>
        
        {/* Sports Tab */}
        <TabsContent value="sports" className="space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-40 w-full rounded-lg" />
              <Skeleton className="h-40 w-full rounded-lg" />
              <Skeleton className="h-40 w-full rounded-lg" />
            </div>
          ) : historicalData && historicalData.sportPerformance ? (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="space-y-4"
            >
              {Object.entries(historicalData.sportPerformance)
                .filter(([sportId]) => sportId !== 'overall')
                .map(([sportId, data]) => (
                  <motion.div key={sportId} variants={itemVariants}>
                    <Card>
                      <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-base capitalize">
                          {sportId}
                          <Badge className="ml-2 text-xs" variant="outline">
                            {data.totalPredictions} predictions
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <div className="grid grid-cols-3 gap-2 mt-2">
                          <div>
                            <p className="text-xs text-muted-foreground">Success Rate</p>
                            <p className="text-lg font-bold">{data.successRate}%</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">ROI</p>
                            <p className="text-lg font-bold">
                              {data.roi >= 0 ? '+' : ''}{data.roi}%
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Avg. Odds</p>
                            <p className="text-lg font-bold">{data.averageOdds}</p>
                          </div>
                        </div>
                        
                        <div className="w-full h-4 bg-muted rounded-full mt-3 overflow-hidden">
                          <div 
                            className="h-full bg-green-500"
                            style={{ width: `${data.successRate}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-xs mt-1">
                          <span>Won: {data.wonCount}</span>
                          <span>Lost: {data.lostCount}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
            </motion.div>
          ) : (
            <div className="text-center p-8">
              <p>No sport performance data available</p>
            </div>
          )}
        </TabsContent>
        
        {/* Predictions History Tab */}
        <TabsContent value="predictions" className="space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
                <Skeleton key={i} className="h-24 w-full rounded-lg" />
              ))}
            </div>
          ) : historicalData && historicalData.predictions ? (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="space-y-2"
            >
              {historicalData.predictions.map(prediction => (
                <motion.div key={prediction.id} variants={itemVariants}>
                  <PredictionCard
                    homeTeam={prediction.homeTeam}
                    awayTeam={prediction.awayTeam}
                    league={prediction.league}
                    date={prediction.date}
                    odds={prediction.odds}
                    prediction={prediction.prediction}
                  />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="text-center p-8">
              <p>No prediction history available</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}