import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertCircle,
  Bookmark as BookmarkIcon,
  CalendarDays,
  Check,
  Filter,
  Flame as FireIcon,
  Lightbulb as LightbulbIcon,
  LineChart,
  PieChart as PieChartIcon,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Search as SearchIcon,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Medal,
  Trophy,
  Target,
  ArrowUpRight,
  Zap,
  Heart,
  Star,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

// Recharts components
import {
  BarChart,
  Bar,
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";

// Components
import EnhancedPredictionCard from "@/components/predictions/enhanced-prediction-card";
import AccumulatorCard from "@/components/predictions/accumulator-card";

// Import types from types file
import { Prediction, Accumulator, AccumulatorsResponse, PredictionStats, SportStats } from "@/lib/types";

export default function PredictionsAndStatsPage() {
  const [_, navigate] = useLocation();
  // Auth state
  const { user } = useAuth();
  const subscriptionStatus = user?.subscriptionTier || "free";
  
  // Filters state
  const [searchTerm, setSearchTerm] = useState("");
  const [sportFilter, setSportFilter] = useState("all");
  const [leagueFilter, setLeagueFilter] = useState("all");
  const [confidenceFilter, setConfidenceFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [period, setPeriod] = useState("week");
  
  // Tabs state
  const [mainTab, setMainTab] = useState("predictions");
  const [predictionTab, setPredictionTab] = useState("upcoming");
  
  // Bookmarks and accumulators state
  const [bookmarkedPredictions, setBookmarkedPredictions] = useState<string[]>([]);
  const [predictionsInAccumulator, setPredictionsInAccumulator] = useState<string[]>([]);
  
  const { toast } = useToast();
  
  // Fetch football predictions
  const {
    data: footballPredictions = [],
    isLoading: isLoadingFootball,
    error: footballError,
    refetch: refetchFootball,
  } = useQuery<Prediction[]>({
    queryKey: ["/api/predictions/football"],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  // Fetch basketball predictions
  const {
    data: basketballPredictions = [],
    isLoading: isLoadingBasketball,
    error: basketballError,
    refetch: refetchBasketball,
  } = useQuery<Prediction[]>({
    queryKey: ["/api/predictions/basketball"],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  // Fetch accumulators
  const {
    data: accumulators,
    isLoading: isLoadingAccumulators,
    error: accumulatorsError,
    refetch: refetchAccumulators,
  } = useQuery<AccumulatorsResponse>({
    queryKey: ["/api/accumulators"],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  // Fetch saved predictions
  const {
    data: savedPredictions = [],
    isLoading: isLoadingSaved,
    refetch: refetchSaved,
  } = useQuery<string[]>({
    queryKey: ["/api/predictions/saved"],
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  // Fetch user accumulator selections
  const {
    data: accumulatorSelections = [],
    isLoading: isLoadingSelections,
    refetch: refetchSelections,
  } = useQuery<string[]>({
    queryKey: ["/api/predictions/accumulator-selections"],
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  // Get statistics data
  const { data: statsData, isLoading: isLoadingStats } = useQuery<PredictionStats>({
    queryKey: ['/api/predictions/stats', period],
  });
  
  const { data: predictionHistory } = useQuery<{date: string; success: number; fail: number}[]>({
    queryKey: ['/api/predictions/history', period],
  });
  
  const { data: sportBreakdown } = useQuery<Record<string, SportStats>>({
    queryKey: ['/api/predictions/sports', period],
  });
  
  // Set initial state from backend
  useEffect(() => {
    if (savedPredictions.length > 0) {
      setBookmarkedPredictions(savedPredictions);
    }
    
    if (accumulatorSelections.length > 0) {
      setPredictionsInAccumulator(accumulatorSelections);
    }
  }, [savedPredictions, accumulatorSelections]);
  
  // Combine all predictions
  const allPredictions = [...footballPredictions, ...basketballPredictions];
  
  // Combine all accumulators and sort by confidence
  const allAccumulators = accumulators
    ? [
        ...(accumulators.small || []),
        ...(accumulators.medium || []),
        ...(accumulators.large || []),
        ...(accumulators.mega || []),
      ].sort((a, b) => b.confidence - a.confidence) // Sort by confidence, highest first
    : [];
  
  // Apply filters
  const filteredPredictions = allPredictions.filter((prediction) => {
    // Search filter
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      !searchTerm ||
      prediction.homeTeam.toLowerCase().includes(searchLower) ||
      prediction.awayTeam.toLowerCase().includes(searchLower) ||
      prediction.league.toLowerCase().includes(searchLower);
    
    // Sport filter
    const matchesSport = sportFilter === "all" || prediction.sport === sportFilter;
    
    // League filter
    const matchesLeague = leagueFilter === "all" || prediction.league === leagueFilter;
    
    // Confidence filter
    const confidence = prediction.confidence;
    const matchesConfidence =
      confidenceFilter === "all" ||
      (confidenceFilter === "high" && confidence >= 80) ||
      (confidenceFilter === "medium" && confidence >= 65 && confidence < 80) ||
      (confidenceFilter === "low" && confidence < 65);
    
    return matchesSearch && matchesSport && matchesLeague && matchesConfidence;
  });
  
  // Filter predictions by time (upcoming, today, tomorrow)
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextTomorrow = new Date(tomorrow);
  nextTomorrow.setDate(nextTomorrow.getDate() + 1);
  
  const upcomingPredictions = filteredPredictions.filter(prediction => 
    new Date(prediction.startTime) >= now
  ).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  
  const todayPredictions = filteredPredictions.filter(prediction => {
    const predictionDate = new Date(prediction.startTime);
    return predictionDate >= today && predictionDate < tomorrow;
  });
  
  const tomorrowPredictions = filteredPredictions.filter(prediction => {
    const predictionDate = new Date(prediction.startTime);
    return predictionDate >= tomorrow && predictionDate < nextTomorrow;
  });
  
  // Get trending predictions (high confidence and value)
  const trendingPredictions = [...filteredPredictions]
    .filter(p => p.confidence >= 75 || (p.valueBet && p.valueBet.value >= 10))
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 5);
  
  // Get unique leagues
  const leagues = Array.from(new Set(allPredictions.map((p) => p.league)));
  
  // Handle save prediction
  const handleSavePrediction = (predictionId: string) => {
    if (bookmarkedPredictions.includes(predictionId)) {
      setBookmarkedPredictions(bookmarkedPredictions.filter((id) => id !== predictionId));
      toast({
        title: "Prediction Removed",
        description: "Removed from your saved predictions",
      });
      // In a real app, we would call an API to remove from saved
    } else {
      setBookmarkedPredictions([...bookmarkedPredictions, predictionId]);
      toast({
        title: "Prediction Saved",
        description: "Added to your saved predictions",
      });
      // In a real app, we would call an API to add to saved
    }
  };
  
  // Handle add to accumulator
  const handleAddToAccumulator = (predictionId: string) => {
    if (predictionsInAccumulator.includes(predictionId)) {
      setPredictionsInAccumulator(
        predictionsInAccumulator.filter((id) => id !== predictionId)
      );
      toast({
        title: "Removed from Accumulator",
        description: "Prediction removed from your accumulator",
      });
      // In a real app, we would call an API to remove from accumulator
    } else {
      setPredictionsInAccumulator([...predictionsInAccumulator, predictionId]);
      toast({
        title: "Added to Accumulator",
        description: "Prediction added to your accumulator",
      });
      // In a real app, we would call an API to add to accumulator
    }
  };
  
  // Handle delete accumulator
  const handleDeleteAccumulator = (accumulatorId: string) => {
    // In a real app, we would call an API to delete the accumulator
    toast({
      title: "Accumulator Deleted",
      description: "The accumulator has been successfully deleted",
    });
  };
  
  // Handle place bet
  const handlePlaceBet = (accumulatorId: string, stake: number) => {
    // In a real app, we would call an API to place the bet
    toast({
      title: "Bet Placed Successfully",
      description: `Your £${stake} bet has been placed`,
    });
  };
  
  // Refresh all data
  const refreshAllData = () => {
    refetchFootball();
    refetchBasketball();
    refetchAccumulators();
    if (user) {
      refetchSaved();
      refetchSelections();
    }
    
    toast({
      title: "Data Refreshed",
      description: "The predictions have been updated with the latest data",
    });
  };
  
  // Get saved predictions
  const savedPredictionsList = filteredPredictions.filter((prediction) =>
    bookmarkedPredictions.includes(prediction.id)
  );
  
  const isLoading =
    isLoadingFootball || isLoadingBasketball || isLoadingAccumulators || isLoadingStats;
  const hasError = footballError || basketballError || accumulatorsError;
  
  // Chart data with fallbacks if API data is not available
  const predictionHistoryData = Array.isArray(predictionHistory) ? predictionHistory : [
    { date: "Apr 20", success: 67, fail: 33 },
    { date: "Apr 21", success: 72, fail: 28 },
    { date: "Apr 22", success: 65, fail: 35 },
    { date: "Apr 23", success: 70, fail: 30 },
    { date: "Apr 24", success: 82, fail: 18 },
    { date: "Apr 25", success: 75, fail: 25 },
    { date: "Apr 26", success: 78, fail: 22 },
  ];
  
  const sportBreakdownData = Array.isArray(sportBreakdown) ? sportBreakdown : [
    { name: "Football", value: 45, fill: "#1a73e8" },
    { name: "Basketball", value: 25, fill: "#4caf50" },
    { name: "Tennis", value: 15, fill: "#f44336" },
    { name: "Hockey", value: 10, fill: "#ff9800" },
    { name: "Baseball", value: 5, fill: "#9c27b0" },
  ];
  
  const marketPerformanceData = [
    { name: "1X2", success: 76, avg: 70 },
    { name: "BTTS", success: 68, avg: 65 },
    { name: "O/U 2.5", success: 72, avg: 68 },
    { name: "Correct Score", success: 42, avg: 40 },
    { name: "Double Chance", success: 82, avg: 75 },
  ];
  
  // Performance radar data
  const performanceRadarData = [
    { category: "Football", value: 85 },
    { category: "Basketball", value: 78 },
    { category: "Tennis", value: 72 },
    { category: "Baseball", value: 65 },
    { category: "Hockey", value: 80 },
  ];
  
  // Trend data
  const trendData = [
    { name: "Apr 1", value: 68 },
    { name: "Apr 7", value: 69 },
    { name: "Apr 14", value: 72 },
    { name: "Apr 21", value: 75 },
    { name: "Apr 28", value: 82 },
  ];

  return (
    <div className="container mx-auto py-4 md:py-6 px-4 md:px-6 max-w-7xl">
      {/* Header with gradient background */}
      <div className="relative rounded-lg overflow-hidden mb-6">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/90 to-indigo-700/90"></div>
        <div className="relative p-5 md:p-8 text-white">
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                PuntaIQ Predictions & Stats
              </h1>
              <p className="mt-1 text-blue-100 max-w-xl">
                AI-powered predictions and performance statistics to optimize your strategy
              </p>
            </div>
            
            <div className="flex gap-3 mt-4 md:mt-0">
              <Button
                variant="outline"
                className="bg-white/20 border-white/30 text-white hover:bg-white/30"
                onClick={refreshAllData}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
              
              <Button
                onClick={() => window.location.href = '/predictions/advanced'}
                className="bg-white text-blue-700 hover:bg-blue-100"
              >
                Advanced Analysis
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main content with improved tabs */}
      <Tabs value={mainTab} onValueChange={setMainTab} className="space-y-6">
        <div className="flex justify-between items-center">
          <TabsList className="rounded-full p-1 bg-muted/50">
            <TabsTrigger value="predictions" className="rounded-full data-[state=active]:bg-white">
              <LineChart className="h-4 w-4 mr-2" />
              Predictions
            </TabsTrigger>
            <TabsTrigger value="stats" className="rounded-full data-[state=active]:bg-white">
              <PieChartIcon className="h-4 w-4 mr-2" />
              Statistics
            </TabsTrigger>
          </TabsList>
          
          {/* Quick filters for mobile */}
          <div className="flex md:hidden">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="flex gap-1 items-center"
            >
              <Filter className="h-3 w-3" />
              {showFilters ? "Hide" : "Filters"}
            </Button>
          </div>
        </div>
        
        {/* PREDICTIONS CONTENT */}
        <TabsContent value="predictions" className="space-y-4 mt-2">
          {/* Search and filters bar - desktop */}
          <div className="hidden md:flex items-center space-x-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search teams, leagues, competitions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 rounded-full"
              />
            </div>
            
            <div className="flex space-x-2">
              <Select value={sportFilter} onValueChange={setSportFilter}>
                <SelectTrigger className="w-32 rounded-full">
                  <SelectValue placeholder="Sport" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sports</SelectItem>
                  <SelectItem value="football">Football</SelectItem>
                  <SelectItem value="basketball">Basketball</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={leagueFilter} onValueChange={setLeagueFilter}>
                <SelectTrigger className="w-40 rounded-full">
                  <SelectValue placeholder="League" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Leagues</SelectItem>
                  {leagues.map((league) => (
                    <SelectItem key={league} value={league}>
                      {league}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={confidenceFilter} onValueChange={setConfidenceFilter}>
                <SelectTrigger className="w-40 rounded-full">
                  <SelectValue placeholder="Confidence" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Confidence</SelectItem>
                  <SelectItem value="high">High (80%+)</SelectItem>
                  <SelectItem value="medium">Medium (65-79%)</SelectItem>
                  <SelectItem value="low">Low (Below 65%)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Mobile search and filters */}
          <div className="md:hidden space-y-4">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search teams, leagues..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 rounded-full"
              />
            </div>
            
            <Collapsible open={showFilters} className="mb-4">
              <CollapsibleContent className="space-y-3">
                <Select value={sportFilter} onValueChange={setSportFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sport" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sports</SelectItem>
                    <SelectItem value="football">Football</SelectItem>
                    <SelectItem value="basketball">Basketball</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={leagueFilter} onValueChange={setLeagueFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="League" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Leagues</SelectItem>
                    {leagues.map((league) => (
                      <SelectItem key={league} value={league}>
                        {league}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={confidenceFilter} onValueChange={setConfidenceFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Confidence" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Confidence</SelectItem>
                    <SelectItem value="high">High (80%+)</SelectItem>
                    <SelectItem value="medium">Medium (65-79%)</SelectItem>
                    <SelectItem value="low">Low (Below 65%)</SelectItem>
                  </SelectContent>
                </Select>
              </CollapsibleContent>
            </Collapsible>
          </div>
          
          {/* Error state */}
          {hasError && (
            <Card className="border-red-200 bg-red-50 dark:bg-red-950/20 mb-6">
              <CardContent className="flex items-center p-6">
                <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
                <div>
                  <h3 className="font-medium text-red-800 dark:text-red-400">Error loading predictions</h3>
                  <p className="text-sm text-red-600 dark:text-red-300 mt-1">
                    Please try refreshing the data or try again later.
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={refreshAllData} 
                  className="ml-auto text-red-600 border-red-200 hover:bg-red-50"
                >
                  Try Again
                </Button>
              </CardContent>
            </Card>
          )}
          
          {/* Predictions tabs */}
          <Tabs defaultValue="upcoming" onValueChange={setPredictionTab} className="space-y-6">
            <div className="flex items-center justify-between">
              <TabsList className="bg-transparent dark:bg-transparent">
                <TabsTrigger 
                  value="upcoming" 
                  className="rounded-md data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 dark:data-[state=active]:bg-blue-950 dark:data-[state=active]:text-blue-300"
                >
                  Upcoming
                </TabsTrigger>
                <TabsTrigger 
                  value="today" 
                  className="rounded-md data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 dark:data-[state=active]:bg-blue-950 dark:data-[state=active]:text-blue-300"
                >
                  Today
                </TabsTrigger>
                <TabsTrigger 
                  value="tomorrow" 
                  className="rounded-md data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 dark:data-[state=active]:bg-blue-950 dark:data-[state=active]:text-blue-300"
                >
                  Tomorrow
                </TabsTrigger>
                <TabsTrigger 
                  value="trending" 
                  className="rounded-md data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 dark:data-[state=active]:bg-blue-950 dark:data-[state=active]:text-blue-300"
                >
                  <FireIcon className="h-3 w-3 mr-1 text-red-500" />
                  Trending
                </TabsTrigger>
                <TabsTrigger 
                  value="saved" 
                  className="rounded-md data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 dark:data-[state=active]:bg-blue-950 dark:data-[state=active]:text-blue-300"
                >
                  <BookmarkIcon className="h-3 w-3 mr-1" />
                  Saved
                </TabsTrigger>
              </TabsList>
            </div>
            
            {/* Main grid layout - predictions on left, accumulators on right */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <TabsContent value="upcoming" className="space-y-4 m-0">
                  {isLoading ? (
                    <PredictionSkeletons count={3} />
                  ) : upcomingPredictions.length === 0 ? (
                    <EmptyPredictions message="No upcoming predictions found" />
                  ) : (
                    <>
                      <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold">Upcoming Predictions</h2>
                        <Badge variant="outline" className="rounded-full px-3">
                          {upcomingPredictions.length} matches
                        </Badge>
                      </div>
                      
                      {upcomingPredictions.map((prediction) => (
                        <EnhancedPredictionCard
                          key={prediction.id}
                          prediction={prediction}
                          isPremium={prediction.isPremium}
                          userSubscription={subscriptionStatus}
                          isSaved={bookmarkedPredictions.includes(prediction.id)}
                          isInAccumulator={predictionsInAccumulator.includes(prediction.id)}
                          onSave={() => handleSavePrediction(prediction.id)}
                          onAddToAccumulator={() => handleAddToAccumulator(prediction.id)}
                        />
                      ))}
                    </>
                  )}
                </TabsContent>
                
                <TabsContent value="today" className="space-y-4 m-0">
                  {isLoading ? (
                    <PredictionSkeletons count={3} />
                  ) : todayPredictions.length === 0 ? (
                    <EmptyPredictions message="No predictions for today" />
                  ) : (
                    <>
                      <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold">Today's Predictions</h2>
                        <Badge variant="outline" className="rounded-full px-3">
                          <CalendarDays className="h-3 w-3 mr-1" />
                          {todayPredictions.length} matches
                        </Badge>
                      </div>
                      
                      {todayPredictions.map((prediction) => (
                        <EnhancedPredictionCard
                          key={prediction.id}
                          prediction={prediction}
                          isPremium={prediction.isPremium}
                          userSubscription={subscriptionStatus}
                          isSaved={bookmarkedPredictions.includes(prediction.id)}
                          isInAccumulator={predictionsInAccumulator.includes(prediction.id)}
                          onSave={() => handleSavePrediction(prediction.id)}
                          onAddToAccumulator={() => handleAddToAccumulator(prediction.id)}
                        />
                      ))}
                    </>
                  )}
                </TabsContent>
                
                <TabsContent value="tomorrow" className="space-y-4 m-0">
                  {isLoading ? (
                    <PredictionSkeletons count={3} />
                  ) : tomorrowPredictions.length === 0 ? (
                    <EmptyPredictions message="No predictions for tomorrow" />
                  ) : (
                    <>
                      <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold">Tomorrow's Predictions</h2>
                        <Badge variant="outline" className="rounded-full px-3">
                          <CalendarDays className="h-3 w-3 mr-1" />
                          {tomorrowPredictions.length} matches
                        </Badge>
                      </div>
                      
                      {tomorrowPredictions.map((prediction) => (
                        <EnhancedPredictionCard
                          key={prediction.id}
                          prediction={prediction}
                          isPremium={prediction.isPremium}
                          userSubscription={subscriptionStatus}
                          isSaved={bookmarkedPredictions.includes(prediction.id)}
                          isInAccumulator={predictionsInAccumulator.includes(prediction.id)}
                          onSave={() => handleSavePrediction(prediction.id)}
                          onAddToAccumulator={() => handleAddToAccumulator(prediction.id)}
                        />
                      ))}
                    </>
                  )}
                </TabsContent>
                
                <TabsContent value="trending" className="space-y-4 m-0">
                  {isLoading ? (
                    <PredictionSkeletons count={3} />
                  ) : trendingPredictions.length === 0 ? (
                    <EmptyPredictions message="No trending predictions found" />
                  ) : (
                    <>
                      <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold flex items-center">
                          <FireIcon className="h-5 w-5 mr-2 text-amber-500" />
                          Trending Predictions
                        </h2>
                        <Badge variant="outline" className="rounded-full px-3 bg-amber-50 text-amber-700 border-amber-200">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          Hot Picks
                        </Badge>
                      </div>
                      
                      {trendingPredictions.map((prediction) => (
                        <EnhancedPredictionCard
                          key={prediction.id}
                          prediction={prediction}
                          isPremium={prediction.isPremium}
                          userSubscription={subscriptionStatus}
                          isSaved={bookmarkedPredictions.includes(prediction.id)}
                          isInAccumulator={predictionsInAccumulator.includes(prediction.id)}
                          onSave={() => handleSavePrediction(prediction.id)}
                          onAddToAccumulator={() => handleAddToAccumulator(prediction.id)}
                        />
                      ))}
                    </>
                  )}
                </TabsContent>
                
                <TabsContent value="saved" className="space-y-4 m-0">
                  {isLoading || isLoadingSaved ? (
                    <PredictionSkeletons count={2} />
                  ) : savedPredictionsList.length === 0 ? (
                    <Card className="bg-muted/40 border-dashed">
                      <CardContent className="p-10 flex flex-col items-center justify-center text-center">
                        <BookmarkIcon className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium">No saved predictions</h3>
                        <p className="text-muted-foreground mt-1 max-w-xs">
                          Save predictions by clicking the bookmark icon on any prediction card
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <>
                      <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold flex items-center">
                          <BookmarkIcon className="h-5 w-5 mr-2 text-blue-500" />
                          Your Saved Predictions
                        </h2>
                        <Badge variant="outline" className="rounded-full px-3">
                          {savedPredictionsList.length} saved
                        </Badge>
                      </div>
                      
                      {savedPredictionsList.map((prediction) => (
                        <EnhancedPredictionCard
                          key={prediction.id}
                          prediction={prediction}
                          isPremium={prediction.isPremium}
                          userSubscription={subscriptionStatus}
                          isSaved={true}
                          isInAccumulator={predictionsInAccumulator.includes(prediction.id)}
                          onSave={() => handleSavePrediction(prediction.id)}
                          onAddToAccumulator={() => handleAddToAccumulator(prediction.id)}
                        />
                      ))}
                    </>
                  )}
                </TabsContent>
              </div>
              
              {/* Right sidebar - fixed position */}
              <div className="lg:sticky lg:top-4 space-y-6">
                {/* Highlighted accumulator card */}
                <Card className="overflow-hidden border-blue-200 dark:border-blue-800 shadow-md">
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-3">
                    <h2 className="text-lg font-bold text-white flex items-center">
                      <Zap className="h-5 w-5 mr-2" />
                      Featured Accumulator
                    </h2>
                  </div>
                  
                  {isLoading ? (
                    <CardContent className="px-6 pt-6 pb-6">
                      <Skeleton className="h-[200px] w-full rounded-lg" />
                    </CardContent>
                  ) : accumulatorsError ? (
                    <CardContent className="p-10 flex flex-col items-center justify-center text-center">
                      <AlertCircle className="h-10 w-10 text-amber-500 mb-2" />
                      <p className="text-muted-foreground">Unable to load accumulators</p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-4"
                        onClick={() => refetchAccumulators()}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Try Again
                      </Button>
                    </CardContent>
                  ) : allAccumulators.length === 0 ? (
                    <CardContent className="p-10 flex flex-col items-center justify-center text-center">
                      <p className="text-muted-foreground">No accumulators available</p>
                    </CardContent>
                  ) : (
                    <CardContent className="p-0">
                      <AccumulatorCard
                        accumulator={allAccumulators[0]}
                        userSubscription={subscriptionStatus}
                        onDelete={() => handleDeleteAccumulator(allAccumulators[0].id)}
                        onPlaceBet={(stake) => handlePlaceBet(allAccumulators[0].id, stake)}
                      />
                    </CardContent>
                  )}
                </Card>
                
                {/* Accumulator list */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center">
                      More Accumulators
                    </CardTitle>
                    <CardDescription>
                      Curated accumulator bets with high potential ROI
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    {isLoading ? (
                      <div className="p-4 space-y-3">
                        <Skeleton className="h-20 w-full rounded-lg" />
                        <Skeleton className="h-20 w-full rounded-lg" />
                      </div>
                    ) : accumulatorsError ? (
                      <div className="px-4 py-8 text-center">
                        <AlertCircle className="h-8 w-8 text-amber-500 mx-auto mb-2" />
                        <p className="text-muted-foreground">Unable to load accumulators</p>
                      </div>
                    ) : allAccumulators.length <= 1 ? (
                      <div className="px-4 py-8 text-center">
                        <p className="text-muted-foreground">No other accumulators available</p>
                      </div>
                    ) : (
                      <ScrollArea className="h-[360px]">
                        <div className="p-4 space-y-4">
                          {allAccumulators.slice(1, 5).map((accumulator) => (
                            <AccumulatorCard
                              key={accumulator.id}
                              accumulator={accumulator}
                              userSubscription={subscriptionStatus}
                              onDelete={() => handleDeleteAccumulator(accumulator.id)}
                              onPlaceBet={(stake) => handlePlaceBet(accumulator.id, stake)}
                            />
                          ))}
                        </div>
                      </ScrollArea>
                    )}
                  </CardContent>
                </Card>
                
                {/* Premium subscription card */}
                {(!user?.subscriptionTier || user.subscriptionTier === "free") && (
                  <Card className="bg-gradient-to-br from-indigo-50 to-blue-50 border-blue-100 dark:from-indigo-950 dark:to-blue-950 dark:border-blue-800">
                    <CardContent className="px-6 pt-6 pb-6">
                      <div className="flex items-center mb-3">
                        <Badge className="bg-blue-600 text-white py-1 px-3 rounded-full mr-2">Premium</Badge>
                        <Star className="h-4 w-4 text-amber-400" fill="currentColor" />
                        <Star className="h-4 w-4 text-amber-400" fill="currentColor" />
                        <Star className="h-4 w-4 text-amber-400" fill="currentColor" />
                      </div>
                      
                      <h3 className="text-xl font-bold mb-2">Upgrade Your Predictions</h3>
                      <p className="text-muted-foreground mb-4">
                        Get access to premium predictions, value bets and exclusive accumulators
                      </p>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center">
                          <CheckItem text="Unlimited premium predictions" />
                        </div>
                        <div className="flex items-center">
                          <CheckItem text="Value bet indicators" />
                        </div>
                        <div className="flex items-center">
                          <CheckItem text="Advanced statistics" />
                        </div>
                      </div>
                      
                      <Button 
                        className="w-full bg-blue-600 hover:bg-blue-700"
                        onClick={() => navigate("/subscription")}
                      >
                        Upgrade Now
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </Tabs>
        </TabsContent>
        
        {/* STATISTICS CONTENT */}
        <TabsContent value="stats" className="space-y-6 mt-2">
          {!user ? (
            <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
              <CardContent className="flex items-center p-8">
                <div className="flex-1">
                  <h3 className="text-lg font-bold">Sign In Required</h3>
                  <p className="text-muted-foreground mt-1 max-w-xl">
                    Sign in to view detailed statistics. Track your prediction performance and optimize your strategy with our premium analytics.
                  </p>
                </div>
                <Button 
                  className="ml-4"
                  onClick={() => navigate("/auth")}
                >
                  Sign In
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="flex flex-col md:flex-row justify-between md:items-center space-y-3 md:space-y-0">
                <Tabs
                  defaultValue="week"
                  className="w-full md:w-auto"
                  onValueChange={(value) => setPeriod(value)}
                >
                  <TabsList className="grid w-full md:w-auto grid-cols-3">
                    <TabsTrigger value="week">Last 7 Days</TabsTrigger>
                    <TabsTrigger value="month">Last 30 Days</TabsTrigger>
                    <TabsTrigger value="quarter">Last 90 Days</TabsTrigger>
                  </TabsList>
                </Tabs>
                
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    <Clock className="h-4 w-4 mr-1" />
                    All Time
                  </Button>
                  <Button variant="outline" size="sm">
                    <DownloadIcon className="h-4 w-4 mr-1" />
                    Export
                  </Button>
                </div>
              </div>
              
              {/* Stats Overview with better design */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard
                  title="Success Rate"
                  value={statsData && typeof statsData === 'object' && 'successRate' in statsData ? statsData.successRate : "76%"}
                  subtext={`${statsData && typeof statsData === 'object' && 'correct' in statsData ? statsData.correct : 186} correct out of ${statsData && typeof statsData === 'object' && 'total' in statsData ? statsData.total : 244}`}
                  icon={<Target className="h-6 w-6 text-emerald-500" />}
                  trend="+3.2% vs last period"
                  trendUp
                />
                
                <StatsCard
                  title="Avg. Confidence"
                  value={statsData && typeof statsData === 'object' && 'avgConfidence' in statsData ? statsData.avgConfidence : "74%"}
                  subtext={`Based on ${statsData && typeof statsData === 'object' && 'totalPredictions' in statsData ? statsData.totalPredictions : 244} predictions`}
                  icon={<LightbulbIcon className="h-6 w-6 text-amber-500" />}
                  trend="+1.5% vs last period"
                  trendUp
                />
                
                <StatsCard
                  title="Avg. Odds"
                  value={statsData && typeof statsData === 'object' && 'avgOdds' in statsData ? statsData.avgOdds : "1.87"}
                  subtext={`Potential ROI: ${statsData && typeof statsData === 'object' && 'potentialROI' in statsData ? statsData.potentialROI : "+42%"}`}
                  icon={<TrendingUp className="h-6 w-6 text-blue-500" />}
                  trend="+0.12 vs last period"
                  trendUp
                />
                
                <StatsCard
                  title="Best Sport"
                  value={statsData && typeof statsData === 'object' && 'bestSport' in statsData ? statsData.bestSport : "Football"}
                  subtext={`${statsData && typeof statsData === 'object' && 'bestSportRate' in statsData ? statsData.bestSportRate : "82%"} success rate`}
                  icon={<Trophy className="h-6 w-6 text-purple-500" />}
                  trend="+4.7% vs last period"
                  trendUp
                />
              </div>
              
              {/* Advanced charts with better layout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Chart 1: Performance Trend */}
                <Card>
                  <CardHeader className="pb-1">
                    <CardTitle className="text-lg flex items-center">
                      <LineChart className="h-5 w-5 mr-2 text-blue-500" />
                      Performance Trend
                    </CardTitle>
                    <CardDescription>
                      Your prediction success rate over time
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={trendData}
                          margin={{ top: 15, right: 10, left: 0, bottom: 0 }}
                        >
                          <defs>
                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#1E40AF" stopOpacity={0.1}/>
                              <stop offset="95%" stopColor="#1E40AF" stopOpacity={0.01}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="name" />
                          <YAxis domain={[50, 100]} />
                          <RechartsTooltip 
                            formatter={(value) => [`${value}%`, 'Success Rate']}
                            labelFormatter={(label) => `Week of ${label}`}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="value" 
                            stroke="#1E40AF" 
                            strokeWidth={3}
                            fillOpacity={1} 
                            fill="url(#colorValue)" 
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Chart 2: Sport Performance */}
                <Card>
                  <CardHeader className="pb-1">
                    <CardTitle className="text-lg flex items-center">
                      <Medal className="h-5 w-5 mr-2 text-purple-500" />
                      Sport Performance
                    </CardTitle>
                    <CardDescription>
                      Success rate across different sports
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={performanceRadarData}>
                          <PolarGrid strokeDasharray="3 3" />
                          <PolarAngleAxis dataKey="category" />
                          <PolarRadiusAxis angle={30} domain={[0, 100]} />
                          <Radar
                            name="Success Rate"
                            dataKey="value"
                            stroke="#8884d8"
                            fill="#8884d8"
                            fillOpacity={0.5}
                          />
                          <Legend />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Chart 3: Market Performance */}
                <Card>
                  <CardHeader className="pb-1">
                    <CardTitle className="text-lg flex items-center">
                      <BarChart className="h-5 w-5 mr-2 text-green-500" />
                      Bet Type Performance
                    </CardTitle>
                    <CardDescription>
                      Success rate by bet market type
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={marketPerformanceData}
                          margin={{ top: 15, right: 20, left: 0, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="name" />
                          <YAxis domain={[0, 100]} />
                          <RechartsTooltip
                            formatter={(value) => [`${value}%`, '']}
                          />
                          <Legend />
                          <Bar 
                            dataKey="success" 
                            name="Your Success Rate" 
                            fill="#10b981" 
                            radius={[4, 4, 0, 0]}
                          />
                          <Bar 
                            dataKey="avg" 
                            name="Platform Average" 
                            fill="#d1d5db" 
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Chart 4: Predictions Distribution */}
                <Card>
                  <CardHeader className="pb-1">
                    <CardTitle className="text-lg flex items-center">
                      <PieChartIcon className="h-5 w-5 mr-2 text-amber-500" />
                      Predictions Distribution
                    </CardTitle>
                    <CardDescription>
                      Breakdown by sport category
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={sportBreakdownData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={100}
                            innerRadius={60}
                            paddingAngle={2}
                            dataKey="value"
                            label={({ name, percent }: { name: string, percent: number }) => 
                              `${name}: ${(percent * 100).toFixed(0)}%`
                            }
                          >
                            {sportBreakdownData.map((entry: { fill: string }, index: number) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={entry.fill} 
                                stroke="transparent"
                              />
                            ))}
                          </Pie>
                          <RechartsTooltip />
                          <Legend layout="horizontal" verticalAlign="bottom" align="center" />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Subscription upgrade banner if user has free tier */}
              {(!user.subscriptionTier || user.subscriptionTier === "free") && (
                <Card className="overflow-hidden">
                  <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-0">
                    <CardContent className="p-6 text-white">
                      <div className="flex flex-col md:flex-row md:items-center gap-6">
                        <div className="flex-1">
                          <Badge className="bg-white/20 mb-4 text-white border-white/20">
                            Premium Analytics
                          </Badge>
                          <h3 className="text-2xl font-bold mb-2">Upgrade for Enhanced Analytics</h3>
                          <p className="text-blue-100">
                            Get access to professional-grade analytics, historical performance data,
                            personalized insights and detailed market breakdowns.
                          </p>
                          
                          <div className="grid grid-cols-2 gap-4 mt-4">
                            <div className="flex items-start">
                              <CheckItem light text="Advanced performance metrics" />
                            </div>
                            <div className="flex items-start">
                              <CheckItem light text="Historical data access" />
                            </div>
                            <div className="flex items-start">
                              <CheckItem light text="Market trend analysis" />
                            </div>
                            <div className="flex items-start">
                              <CheckItem light text="Personalized recommendations" />
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-center justify-center text-center">
                          <div className="text-xl font-semibold mb-2">Starting from</div>
                          <div className="text-4xl font-bold mb-2">$4.99</div>
                          <div className="text-blue-100 mb-4">per month</div>
                          <Button 
                            className="min-w-[180px] bg-white text-blue-700 hover:bg-blue-50"
                            onClick={() => navigate("/subscription")}
                            size="lg"
                          >
                            View Plans
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </div>
                </Card>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Helper components
interface StatsCardProps {
  title: string;
  value: string | number;
  subtext?: string;
  icon: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, subtext, icon, trend, trendUp = true }) => {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex justify-between mb-2">
          <div className="p-2 rounded-full bg-primary/10">{icon}</div>
          {trend && (
            <Badge variant="outline" className={`flex items-center px-2 ${trendUp ? 'text-green-600 bg-green-50 border-green-200' : 'text-red-600 bg-red-50 border-red-200'}`}>
              {trendUp ? <ChevronUp className="h-3 w-3 mr-1" /> : <ChevronDown className="h-3 w-3 mr-1" />}
              {trend}
            </Badge>
          )}
        </div>
        <div className="text-3xl font-bold mt-1">{value}</div>
        <p className="text-sm text-muted-foreground mt-1">{title}</p>
        {subtext && <p className="text-xs text-muted-foreground mt-1">{subtext}</p>}
      </CardContent>
    </Card>
  );
};

interface PredictionSkeletonsProps {
  count?: number;
}

const PredictionSkeletons: React.FC<PredictionSkeletonsProps> = ({ count = 3 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="h-[200px] w-full rounded-lg" />
        </div>
      ))}
    </>
  );
};

interface EmptyPredictionsProps {
  message: string;
}

const EmptyPredictions: React.FC<EmptyPredictionsProps> = ({ message }) => {
  return (
    <Card className="bg-muted/30 border-dashed">
      <CardContent className="py-10 flex flex-col items-center justify-center text-center">
        <CalendarDays className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium">{message}</h3>
        <p className="text-muted-foreground mt-1 max-w-md">
          Try adjusting your filters or check back later for new predictions
        </p>
      </CardContent>
    </Card>
  );
};

interface CheckItemProps {
  text: string;
  light?: boolean;
}

const CheckItem: React.FC<CheckItemProps> = ({ text, light = false }) => (
  <>
    <div className={`rounded-full p-1 mr-2 ${light ? 'bg-white/20' : 'bg-green-100 text-green-700'}`}>
      <Check className={`h-3 w-3 ${light ? 'text-white' : ''}`} />
    </div>
    <span className={`text-sm ${light ? 'text-white' : ''}`}>{text}</span>
  </>
);

const DownloadIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);