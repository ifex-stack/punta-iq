import { FC, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, BarChart4, ChartBar, PieChart, Share, ArrowUpFromLine, TrendingUp, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ReferralAnalyticsProps {
  className?: string;
  userId: number;
}

export const ReferralAnalytics: FC<ReferralAnalyticsProps> = ({ className, userId }) => {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('month');
  const [chartView, setChartView] = useState<'channels' | 'conversion' | 'trend'>('channels');
  
  // Fetch analytics data
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['/api/referrals/analytics', userId, timeRange],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/referrals/analytics?timeRange=${timeRange}`);
      return res.json();
    },
  });
  
  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ChartBar className="h-5 w-5 text-primary" />
          Referral Analytics
        </CardTitle>
        <CardDescription>
          Track your referral performance and conversions
        </CardDescription>
        <div className="flex items-center justify-between mt-3">
          <Tabs defaultValue={timeRange} onValueChange={(value) => setTimeRange(value as 'week' | 'month' | 'all')}>
            <TabsList className="grid grid-cols-3 w-[240px]">
              <TabsTrigger value="week">Week</TabsTrigger>
              <TabsTrigger value="month">Month</TabsTrigger>
              <TabsTrigger value="all">All Time</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="flex space-x-1">
            <button
              onClick={() => setChartView('channels')}
              className={cn(
                "p-1 rounded-md transition-colors",
                chartView === 'channels' ? "bg-primary/10 text-primary" : "hover:bg-muted"
              )}
            >
              <PieChart className="h-4 w-4" />
            </button>
            <button
              onClick={() => setChartView('conversion')}
              className={cn(
                "p-1 rounded-md transition-colors",
                chartView === 'conversion' ? "bg-primary/10 text-primary" : "hover:bg-muted"
              )}
            >
              <BarChart3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setChartView('trend')}
              className={cn(
                "p-1 rounded-md transition-colors",
                chartView === 'trend' ? "bg-primary/10 text-primary" : "hover:bg-muted"
              )}
            >
              <TrendingUp className="h-4 w-4" />
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <Skeleton className="h-[220px] w-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key={chartView}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {chartView === 'channels' && (
                <ChannelsAnalytics data={analytics?.channelData || []} />
              )}
              
              {chartView === 'conversion' && (
                <ConversionAnalytics 
                  data={{
                    total: analytics?.totalReferrals || 0,
                    completed: analytics?.completedReferrals || 0,
                    avgTime: analytics?.avgConversionTime || 0
                  }} 
                />
              )}
              
              {chartView === 'trend' && (
                <TrendAnalytics data={analytics?.trendData || []} />
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Key metrics at bottom */}
        <div className="grid grid-cols-2 gap-4 mt-6">
          <MetricCard 
            title="Conversion Rate" 
            value={isLoading ? null : `${analytics?.conversionRate || 0}%`}
            icon={<ArrowUpFromLine className="h-4 w-4 text-green-500" />}
            change={analytics?.conversionRateChange}
            trend={analytics?.conversionRateTrend}
          />
          <MetricCard 
            title="Avg Time to Convert" 
            value={isLoading ? null : `${analytics?.avgConversionTime || 0} hrs`}
            icon={<Clock className="h-4 w-4 text-blue-500" />}
            change={analytics?.conversionTimeChange}
            trend={analytics?.conversionTimeTrend === 'up' ? 'down' : 'up'} // Reversed because less time is better
          />
        </div>
      </CardContent>
    </Card>
  );
};

// Channel analytics component
const ChannelsAnalytics: FC<{ data: any[] }> = ({ data }) => {
  // Sample data format if API doesn't return data yet
  const sampleData = data.length ? data : [
    { channel: 'WhatsApp', percentage: 42, count: 14 },
    { channel: 'Twitter', percentage: 27, count: 9 },
    { channel: 'Email', percentage: 18, count: 6 },
    { channel: 'Facebook', percentage: 9, count: 3 },
    { channel: 'Direct', percentage: 3, count: 1 },
  ];
  
  return (
    <div className="space-y-4">
      <div className="h-[220px] flex items-center justify-center">
        <div className="relative w-[200px] h-[200px] rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
          <div className="absolute inset-0">
            {/* This would be replaced with a proper SVG/Canvas pie chart in a real implementation */}
            {sampleData.map((item, i) => (
              <div 
                key={item.channel}
                className="absolute w-full h-full"
                style={{
                  clipPath: `conic-gradient(from ${i * 36}deg, transparent ${360 - item.percentage * 3.6}deg, currentColor 0deg)`,
                  color: getChannelColor(item.channel),
                  opacity: 0.7
                }}
              />
            ))}
          </div>
          <div className="z-10 text-center">
            <p className="text-2xl font-bold">{data.reduce((sum, item) => sum + item.count, 0)}</p>
            <p className="text-xs text-muted-foreground">Total Referrals</p>
          </div>
        </div>
      </div>
      
      <div className="space-y-3 mt-2">
        {sampleData.map((item) => (
          <div key={item.channel} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: getChannelColor(item.channel) }}
              />
              <span className="text-sm">{item.channel}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">{item.count}</span>
              <span className="text-xs text-muted-foreground w-8 text-right">{item.percentage}%</span>
            </div>
          </div>
        ))}
      </div>
      
      <div className="pt-2 text-xs text-muted-foreground">
        <p className="flex items-center gap-1">
          <TrendingUp className="h-3 w-3" /> 
          <span>Top performing channel: <span className="font-medium">{sampleData[0].channel}</span></span>
        </p>
      </div>
    </div>
  );
};

// Conversion analytics component
const ConversionAnalytics: FC<{ data: { total: number; completed: number; avgTime: number } }> = ({ data }) => {
  const conversionRate = data.total ? Math.round((data.completed / data.total) * 100) : 0;
  
  return (
    <div className="space-y-4">
      <div className="h-[220px] flex flex-col items-center justify-center">
        <div className="relative w-full max-w-[300px] h-[300px] flex flex-col items-center justify-center">
          <div className="relative w-[200px] h-[200px]">
            <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
              <circle
                cx="60"
                cy="60"
                r="54"
                fill="none"
                stroke="currentColor"
                strokeWidth="12"
                className="text-primary/10"
              />
              <circle
                cx="60"
                cy="60"
                r="54"
                fill="none"
                stroke="currentColor"
                strokeWidth="12"
                strokeDasharray={2 * Math.PI * 54}
                strokeDashoffset={2 * Math.PI * 54 * (1 - conversionRate / 100)}
                className="text-primary"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-bold">{conversionRate}%</span>
              <span className="text-xs text-muted-foreground">Conversion</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm">Total Referrals</span>
          <span className="text-sm font-medium">{data.total}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm">Completed</span>
          <span className="text-sm font-medium">{data.completed}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm">Pending</span>
          <span className="text-sm font-medium">{data.total - data.completed}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm">Avg. Conversion Time</span>
          <span className="text-sm font-medium">{data.avgTime} hours</span>
        </div>
      </div>
    </div>
  );
};

// Trend analytics component
const TrendAnalytics: FC<{ data: any[] }> = ({ data }) => {
  // Sample data if API doesn't return data yet
  const sampleData = data.length ? data : [
    { date: '2025-04-01', count: 2 },
    { date: '2025-04-08', count: 4 },
    { date: '2025-04-15', count: 3 },
    { date: '2025-04-22', count: 7 },
    { date: '2025-04-29', count: 9 },
  ];
  
  // Calculate max value for scaling
  const maxValue = Math.max(...sampleData.map(item => item.count));
  
  return (
    <div className="space-y-4">
      <div className="h-[220px] flex items-end justify-between gap-2">
        {sampleData.map((item, index) => (
          <div key={index} className="relative flex flex-col items-center justify-end h-full">
            <div 
              className="w-10 bg-primary/80 rounded-t-md"
              style={{ height: `${(item.count / maxValue) * 180}px` }}
            >
              <div className="absolute -top-6 text-xs w-full text-center truncate">
                {item.count}
              </div>
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              {new Date(item.date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
            </div>
          </div>
        ))}
      </div>
      
      <div className="pt-2 text-xs text-muted-foreground">
        <p>
          Trend shows a 
          <span className="text-green-500 font-medium"> {calculateTrend(sampleData)}% increase </span> 
          in referrals over this period.
        </p>
      </div>
    </div>
  );
};

const MetricCard: FC<{ 
  title: string; 
  value: string | null; 
  icon: React.ReactNode;
  change?: number;
  trend?: 'up' | 'down' | 'flat';
}> = ({ title, value, icon, change, trend }) => {
  return (
    <div className="border rounded-lg p-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium flex items-center gap-1.5">
          {icon}
          {title}
        </h4>
        {trend && change !== undefined && (
          <Badge variant={trend === 'up' ? 'success' : trend === 'down' ? 'destructive' : 'outline'}>
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}{' '}
            {Math.abs(change)}%
          </Badge>
        )}
      </div>
      <p className="text-2xl font-bold mt-2">
        {value === null ? (
          <Skeleton className="h-8 w-20" />
        ) : (
          value
        )}
      </p>
    </div>
  );
};

// Helper function to get color based on channel name
function getChannelColor(channel: string): string {
  const colors: Record<string, string> = {
    'WhatsApp': '#25D366',
    'Twitter': '#1DA1F2',
    'Email': '#D44638',
    'Facebook': '#4267B2',
    'Direct': '#6E56CF',
    'Telegram': '#0088cc',
    'Instagram': '#C13584',
    'LinkedIn': '#0077B5',
  };
  
  return colors[channel] || '#6E56CF';
}

// Helper function to calculate trend percentage
function calculateTrend(data: any[]): number {
  if (data.length < 2) return 0;
  
  const firstValue = data[0].count;
  const lastValue = data[data.length - 1].count;
  
  if (firstValue === 0) return lastValue > 0 ? 100 : 0;
  
  return Math.round(((lastValue - firstValue) / firstValue) * 100);
}