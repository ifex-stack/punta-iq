import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { Helmet } from "react-helmet";
import { MobileAppLayout } from '@/components/layout/mobile-app-layout';
import { useHistoricalDashboard } from '@/hooks/use-historical-dashboard';
import { 
  Calendar, 
  Filter, 
  TrendingUp, 
  TrendingDown,
  RefreshCw,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Download,
  BarChart,
  PieChart,
  LineChart
} from 'lucide-react';
import { format } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Drawer } from 'vaul';
import PredictionCard from '@/components/predictions/prediction-card';
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function HistoryPage() {
  const [_, navigate] = useLocation();
  const [selectedSport, setSelectedSport] = useState<string>('all');
  const [resultType, setResultType] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [market, setMarket] = useState<string | undefined>(undefined);
  const [filterOpen, setFilterOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('metrics');
  
  const { 
    data: dashboardData, 
    isLoading, 
    isError, 
    error, 
    refetch 
  } = useHistoricalDashboard({
    sport: selectedSport,
    resultType,
    date: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : undefined,
    market
  });
  
  const downloadCSV = () => {
    const queryParams = new URLSearchParams();
    if (selectedSport !== 'all') queryParams.append('sport', selectedSport);
    if (resultType !== 'all') queryParams.append('resultType', resultType);
    if (selectedDate) queryParams.append('date', format(selectedDate, 'yyyy-MM-dd'));
    if (market) queryParams.append('market', market);
    
    const url = `/api/historical-dashboard/export?${queryParams.toString()}`;
    window.location.href = url;
  };
  
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.05
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { type: "spring", stiffness: 300, damping: 24 }
    }
  };
  
  return (
    <MobileAppLayout activeTab="history">
      <Helmet>
        <title>Historical Performance - PuntaIQ</title>
      </Helmet>
      
      <div className="mb-16 pt-2">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold">Historical Performance</h1>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              onClick={() => refetch()}
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </Button>
            
            <Drawer.Root open={filterOpen} onOpenChange={setFilterOpen}>
              <Drawer.Trigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full"
                >
                  <Filter className="h-4 w-4" />
                </Button>
              </Drawer.Trigger>
              <Drawer.Portal>
                <Drawer.Overlay className="fixed inset-0 bg-black/40" />
                <Drawer.Content className="bg-background flex flex-col rounded-t-[10px] h-[85%] mt-24 fixed bottom-0 left-0 right-0 z-50">
                  <div className="p-4 rounded-t-[10px] flex-1 overflow-auto">
                    <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-muted-foreground/20 mb-4" />
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold mb-4">Filters</h3>
                      
                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm mb-2 block">Sport</Label>
                          <Select
                            value={selectedSport}
                            onValueChange={setSelectedSport}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="All Sports" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Sports</SelectItem>
                              <SelectItem value="football">Football</SelectItem>
                              <SelectItem value="basketball">Basketball</SelectItem>
                              <SelectItem value="tennis">Tennis</SelectItem>
                              <SelectItem value="hockey">Hockey</SelectItem>
                              <SelectItem value="baseball">Baseball</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label className="text-sm mb-2 block">Result Type</Label>
                          <Select
                            value={resultType}
                            onValueChange={setResultType}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="All Results" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Results</SelectItem>
                              <SelectItem value="won">Won</SelectItem>
                              <SelectItem value="lost">Lost</SelectItem>
                              <SelectItem value="pending">Pending</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label className="text-sm mb-2 block">Market</Label>
                          <Select
                            value={market || ""}
                            onValueChange={setMarket}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="All Markets" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">All Markets</SelectItem>
                              <SelectItem value="Match Result">Match Result</SelectItem>
                              <SelectItem value="Over/Under">Over/Under</SelectItem>
                              <SelectItem value="Both Teams to Score">Both Teams to Score</SelectItem>
                              <SelectItem value="Handicap">Handicap</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label className="text-sm mb-2 block">Date</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full justify-start text-left font-normal",
                                  !selectedDate && "text-muted-foreground"
                                )}
                              >
                                <Calendar className="mr-2 h-4 w-4" />
                                {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <CalendarComponent
                                mode="single"
                                selected={selectedDate}
                                onSelect={setSelectedDate}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 mt-4">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          setSelectedSport('all');
                          setResultType('all');
                          setSelectedDate(undefined);
                          setMarket(undefined);
                        }}
                      >
                        Reset Filters
                      </Button>
                      <Button
                        className="flex-1"
                        onClick={() => setFilterOpen(false)}
                      >
                        Apply
                      </Button>
                    </div>
                  </div>
                </Drawer.Content>
              </Drawer.Portal>
            </Drawer.Root>
          </div>
        </div>
        
        {/* Dashboard Content */}
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-28 w-full rounded-xl" />
            <Skeleton className="h-40 w-full rounded-xl" />
            <Skeleton className="h-20 w-full rounded-xl" />
          </div>
        ) : isError ? (
          <div className="p-4 border border-red-300 bg-red-50 rounded-md text-red-600">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              <p className="font-medium">Failed to load dashboard data</p>
            </div>
            <p className="mt-2 text-sm">Please try again later or contact support if the issue persists.</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => refetch()}
            >
              Retry
            </Button>
          </div>
        ) : (
          <motion.div 
            className="space-y-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Key Metrics */}
            <motion.div
              variants={itemVariants}
              className="grid grid-cols-2 gap-2"
            >
              <Card className="bg-primary/5 border-primary/10">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm flex items-center">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    Success Rate
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="text-3xl font-bold">
                    {dashboardData?.metrics.successRate}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    From {dashboardData?.metrics.totalPredictions} predictions
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-primary/5 border-primary/10">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm flex items-center">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    Return on Investment
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="text-3xl font-bold">
                    {dashboardData?.metrics.roi}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Avg odds: {dashboardData?.metrics.averageOdds}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
            
            {/* Tabs Navigation */}
            <motion.div variants={itemVariants}>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-3 mb-4">
                  <TabsTrigger value="metrics" className="text-xs">
                    <BarChart className="h-3 w-3 mr-1" />
                    Metrics
                  </TabsTrigger>
                  <TabsTrigger value="monthly" className="text-xs">
                    <LineChart className="h-3 w-3 mr-1" />
                    Monthly
                  </TabsTrigger>
                  <TabsTrigger value="sport" className="text-xs">
                    <PieChart className="h-3 w-3 mr-1" />
                    By Sport
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="metrics" className="mt-0">
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <p className="text-sm font-medium">Prediction Results</p>
                      <p className="text-xs text-muted-foreground">Total: {dashboardData?.metrics.totalPredictions}</p>
                    </div>
                    <div className="flex gap-1">
                      <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                        Won: {dashboardData?.metrics.wonCount}
                      </Badge>
                      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                        Lost: {dashboardData?.metrics.lostCount}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="h-10 w-full bg-muted rounded-lg overflow-hidden">
                    <div className="flex h-full">
                      <div 
                        className="bg-emerald-500 h-full"
                        style={{ width: `${dashboardData?.metrics.successRate}%` }}
                      />
                      <div 
                        className="bg-red-500 h-full"
                        style={{ width: `${100 - (dashboardData?.metrics.successRate || 0)}%` }}
                      />
                    </div>
                  </div>
                  
                  {/* Recent Predictions List */}
                  <div className="mt-6">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-sm font-medium">Recent Predictions</h3>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={downloadCSV}
                        className="h-7 text-xs"
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Export
                      </Button>
                    </div>
                    
                    <div className="space-y-3">
                      {dashboardData?.predictions.map((prediction) => (
                        <PredictionCard
                          key={prediction.id}
                          id={prediction.id}
                          homeTeam={prediction.homeTeam}
                          awayTeam={prediction.awayTeam}
                          league={prediction.league}
                          sport={prediction.sport}
                          prediction={prediction.prediction}
                          market={prediction.market}
                          odds={prediction.odds}
                          confidence={prediction.confidence}
                          startTime={new Date(prediction.date).toISOString()}
                          isCorrect={prediction.isCorrect}
                          compact={true}
                          showLeague={true}
                          isPremium={false}
                          isSaved={false}
                          onToggleSave={() => {}}
                          onSelect={() => {}}
                        />
                      ))}
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="monthly" className="mt-0">
                  <p className="text-sm font-medium mb-4">Monthly Performance</p>
                  
                  <div className="space-y-2">
                    {dashboardData?.monthlyPerformance.map((month) => (
                      <div key={`${month.month}-${month.year}`} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div>
                          <p className="text-sm font-medium">{month.month} {month.year}</p>
                          <div className="flex items-center gap-1">
                            <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
                              {month.won} won
                            </Badge>
                            <span className="text-xs text-muted-foreground">of {month.total}</span>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <div className="text-lg font-bold">{month.successRate}%</div>
                          {month.successRate >= 65 ? (
                            <TrendingUp className="h-4 w-4 text-emerald-500 ml-1" />
                          ) : month.successRate < 50 ? (
                            <TrendingDown className="h-4 w-4 text-red-500 ml-1" />
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
                
                <TabsContent value="sport" className="mt-0">
                  <p className="text-sm font-medium mb-4">Performance by Sport</p>
                  
                  <div className="space-y-2">
                    {Object.entries(dashboardData?.sportPerformance || {}).map(([sport, data]) => (
                      <div key={sport} className="p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium capitalize">{sport}</p>
                          <Badge variant="outline" className="text-xs">
                            {data.totalPredictions} predictions
                          </Badge>
                        </div>
                        
                        <div className="mt-2 grid grid-cols-2 gap-2">
                          <div>
                            <p className="text-xs text-muted-foreground">Success Rate</p>
                            <p className="text-sm font-medium">{data.successRate}%</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">ROI</p>
                            <p className="text-sm font-medium">{data.roi}%</p>
                          </div>
                        </div>
                        
                        <div className="mt-2 h-2 w-full bg-muted rounded-full overflow-hidden">
                          <div 
                            className="bg-primary h-full"
                            style={{ width: `${data.successRate}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </motion.div>
          </motion.div>
        )}
      </div>
    </MobileAppLayout>
  );
}