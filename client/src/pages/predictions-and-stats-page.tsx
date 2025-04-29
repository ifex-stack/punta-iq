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
  Filter,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  SearchIcon,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
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

// Recharts components
import {
  BarChart,
  Bar,
  LineChart,
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
} from "recharts";

// Components
import EnhancedPredictionCard from "@/components/predictions/enhanced-prediction-card";
import AccumulatorCard from "@/components/predictions/accumulator-card";

// Types for the API responses
interface Prediction {
  id: string;
  matchId: string;
  sport: string;
  createdAt: string;
  homeTeam: string;
  awayTeam: string;
  startTime: string;
  league: string;
  predictedOutcome: string;
  confidence: number;
  isPremium: boolean;
  valueBet?: {
    outcome: string;
    odds: number;
    value: number;
    isRecommended: boolean;
  } | null;
  predictions: {
    "1X2"?: {
      outcome: string;
      homeWin: { probability: number; odds: number };
      draw: { probability: number; odds: number };
      awayWin: { probability: number; odds: number };
    };
    "BTTS"?: {
      outcome: string;
      probability: number;
    };
    "Over_Under"?: {
      line: number;
      outcome: string;
      probability: number;
    };
    "CorrectScore"?: {
      outcome: string;
      probability: number;
    };
    "Winner"?: {
      outcome: string;
      homeWin: { probability: number; odds: number };
      awayWin: { probability: number; odds: number };
    };
    "TotalPoints"?: {
      line: number;
      outcome: string;
      probability: number;
      predictedTotal: number;
    };
    "Spread"?: {
      line: number;
      favored: string;
      probability: number;
    };
    "PredictedScore"?: {
      home: number;
      away: number;
    };
  };
}

interface Accumulator {
  id: string;
  createdAt: string;
  size: number;
  totalOdds: number;
  confidence: number;
  isPremium: boolean;
  selections: Array<{
    matchId: string;
    homeTeam: string;
    awayTeam: string;
    league: string;
    startTime: string;
    sport: string;
    market: string;
    outcome: string;
    odds: number;
    confidence: number;
  }>;
  type?: string;
}

interface AccumulatorsResponse {
  small: Accumulator[];
  medium: Accumulator[];
  large: Accumulator[];
  mega: Accumulator[];
}

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
  const { data: statsData, isLoading: isLoadingStats } = useQuery({
    queryKey: ['/api/predictions/stats', period],
  });
  
  const { data: predictionHistory } = useQuery({
    queryKey: ['/api/predictions/history', period],
  });
  
  const { data: sportBreakdown } = useQuery({
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
  
  // Combine all accumulators
  const allAccumulators = accumulators
    ? [
        ...(accumulators.small || []),
        ...(accumulators.medium || []),
        ...(accumulators.large || []),
        ...(accumulators.mega || []),
      ]
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
  
  // Get unique leagues
  const leagues = Array.from(new Set(allPredictions.map((p) => p.league)));
  
  // Handle save prediction
  const handleSavePrediction = (predictionId: string) => {
    if (bookmarkedPredictions.includes(predictionId)) {
      setBookmarkedPredictions(bookmarkedPredictions.filter((id) => id !== predictionId));
      // In a real app, we would call an API to remove from saved
    } else {
      setBookmarkedPredictions([...bookmarkedPredictions, predictionId]);
      // In a real app, we would call an API to add to saved
    }
  };
  
  // Handle add to accumulator
  const handleAddToAccumulator = (predictionId: string) => {
    if (predictionsInAccumulator.includes(predictionId)) {
      setPredictionsInAccumulator(
        predictionsInAccumulator.filter((id) => id !== predictionId)
      );
      // In a real app, we would call an API to remove from accumulator
    } else {
      setPredictionsInAccumulator([...predictionsInAccumulator, predictionId]);
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
  
  // Dummy data for charts (in case real data isn't loaded yet)
  const predictionHistoryData = predictionHistory || [
    { date: "Apr 20", success: 67, fail: 33 },
    { date: "Apr 21", success: 72, fail: 28 },
    { date: "Apr 22", success: 65, fail: 35 },
    { date: "Apr 23", success: 70, fail: 30 },
    { date: "Apr 24", success: 82, fail: 18 },
    { date: "Apr 25", success: 75, fail: 25 },
    { date: "Apr 26", success: 78, fail: 22 },
  ];
  
  const sportBreakdownData = sportBreakdown || [
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

  return (
    <div className="container mx-auto py-6 max-w-6xl">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Predictions & Stats</h1>
          <p className="text-muted-foreground mt-1">
            AI-powered predictions and performance statistics
          </p>
          {mainTab === "predictions" && (
            <div className="mt-2">
              <Button 
                variant="link" 
                className="pl-0 text-blue-600 dark:text-blue-400 flex items-center gap-2"
                onClick={() => window.location.href = '/predictions/advanced'}
              >
                <span>Advanced Predictions</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
        
        <Button
          variant="outline"
          className="mt-4 md:mt-0"
          onClick={refreshAllData}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>
      
      {/* Main section tabs */}
      <Tabs value={mainTab} onValueChange={setMainTab} className="mb-6">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="predictions">Predictions</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
        </TabsList>
        
        {/* PREDICTIONS CONTENT */}
        <TabsContent value="predictions" className="space-y-4">
          <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4 mb-6">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search teams, leagues..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex gap-2 items-center"
            >
              <Filter className="h-4 w-4" />
              Filters
              {showFilters ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
          
          <Collapsible open={showFilters} className="mb-6">
            <CollapsibleContent>
              <Card>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <div className="font-medium text-sm">Sport</div>
                      <Select
                        value={sportFilter}
                        onValueChange={setSportFilter}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="All Sports" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Sports</SelectItem>
                          <SelectItem value="football">Football</SelectItem>
                          <SelectItem value="basketball">Basketball</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="font-medium text-sm">League</div>
                      <Select
                        value={leagueFilter}
                        onValueChange={setLeagueFilter}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="All Leagues" />
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
                    </div>
                    
                    <div className="space-y-2">
                      <div className="font-medium text-sm">Confidence</div>
                      <Select
                        value={confidenceFilter}
                        onValueChange={setConfidenceFilter}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="All Confidence Levels" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Confidence Levels</SelectItem>
                          <SelectItem value="high">High (80%+)</SelectItem>
                          <SelectItem value="medium">Medium (65-79%)</SelectItem>
                          <SelectItem value="low">Low (Below 65%)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CollapsibleContent>
          </Collapsible>
          
          {hasError ? (
            <div className="text-center py-12">
              <p className="text-red-500 mb-2">Error loading predictions</p>
              <Button onClick={refreshAllData}>Try Again</Button>
            </div>
          ) : (
            <Tabs defaultValue="all" className="space-y-4">
              <TabsList className="grid grid-cols-4 md:w-[400px]">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="football">Football</TabsTrigger>
                <TabsTrigger value="basketball">Basketball</TabsTrigger>
                <TabsTrigger value="saved">Saved</TabsTrigger>
              </TabsList>
              
              <TabsContent value="all">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                      Recent Predictions
                    </h2>
                    
                    {isLoading ? (
                      Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="space-y-3">
                          <Skeleton className="h-[200px] w-full rounded-lg" />
                        </div>
                      ))
                    ) : filteredPredictions.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">No predictions found</p>
                        {(searchTerm || sportFilter !== "all" || leagueFilter !== "all" || confidenceFilter !== "all") && (
                          <p className="mt-2">Try adjusting your filters</p>
                        )}
                      </div>
                    ) : (
                      filteredPredictions
                        .slice(0, 5)
                        .map((prediction) => (
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
                        ))
                    )}
                  </div>
                  
                  <div className="space-y-4">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                      Accumulators
                    </h2>
                    
                    {isLoading ? (
                      Array.from({ length: 2 }).map((_, i) => (
                        <div key={i} className="space-y-3">
                          <Skeleton className="h-[150px] w-full rounded-lg" />
                        </div>
                      ))
                    ) : allAccumulators.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">No accumulators available</p>
                      </div>
                    ) : (
                      allAccumulators
                        .slice(0, 3)
                        .map((accumulator) => (
                          <AccumulatorCard
                            key={accumulator.id}
                            accumulator={accumulator}
                            userSubscription={subscriptionStatus}
                            onDelete={() => handleDeleteAccumulator(accumulator.id)}
                            onPlaceBet={(stake) => handlePlaceBet(accumulator.id, stake)}
                          />
                        ))
                    )}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="football">
                <div className="space-y-4">
                  <h2 className="text-xl font-bold">Football Predictions</h2>
                  
                  {isLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="space-y-3">
                        <Skeleton className="h-[200px] w-full rounded-lg" />
                      </div>
                    ))
                  ) : filteredPredictions.filter(p => p.sport === 'football').length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No football predictions found</p>
                    </div>
                  ) : (
                    filteredPredictions
                      .filter(p => p.sport === 'football')
                      .map((prediction) => (
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
                      ))
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="basketball">
                <div className="space-y-4">
                  <h2 className="text-xl font-bold">Basketball Predictions</h2>
                  
                  {isLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="space-y-3">
                        <Skeleton className="h-[200px] w-full rounded-lg" />
                      </div>
                    ))
                  ) : filteredPredictions.filter(p => p.sport === 'basketball').length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No basketball predictions found</p>
                    </div>
                  ) : (
                    filteredPredictions
                      .filter(p => p.sport === 'basketball')
                      .map((prediction) => (
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
                      ))
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="saved">
                <div className="space-y-4">
                  <h2 className="text-xl font-bold">Saved Predictions</h2>
                  
                  {isLoading || isLoadingSaved ? (
                    Array.from({ length: 2 }).map((_, i) => (
                      <div key={i} className="space-y-3">
                        <Skeleton className="h-[200px] w-full rounded-lg" />
                      </div>
                    ))
                  ) : savedPredictionsList.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No saved predictions</p>
                      <p className="mt-2">Save predictions by clicking the bookmark icon</p>
                    </div>
                  ) : (
                    savedPredictionsList.map((prediction) => (
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
                    ))
                  )}
                </div>
              </TabsContent>
            </Tabs>
          )}
        </TabsContent>
        
        {/* STATISTICS CONTENT */}
        <TabsContent value="stats" className="space-y-4">
          {!user ? (
            <Card className="mb-8">
              <CardHeader className="pb-2">
                <CardTitle>Please Sign In</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  You need to sign in to view detailed statistics. Statistics help you track 
                  prediction performance and optimize your strategy.
                </p>
                <Button onClick={() => navigate("/auth")}>
                  Sign In
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <Tabs
                defaultValue="week"
                className="mb-6"
                onValueChange={(value) => setPeriod(value)}
              >
                <TabsList>
                  <TabsTrigger value="week">Last 7 Days</TabsTrigger>
                  <TabsTrigger value="month">Last 30 Days</TabsTrigger>
                  <TabsTrigger value="quarter">Last 90 Days</TabsTrigger>
                </TabsList>
              </Tabs>
              
              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Success Rate
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-primary">
                      {statsData?.successRate || "76%"}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {statsData?.correct || 186} correct out of {statsData?.total || 244}
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Avg. Confidence
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">
                      {statsData?.avgConfidence || "74%"}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      On {statsData?.totalPredictions || 244} predictions
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Avg. Odds
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">
                      {statsData?.avgOdds || "1.87"}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Potential ROI: {statsData?.potentialROI || "+42%"}
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Best Performing Sport
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-primary">
                      {statsData?.bestSport || "Football"}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {statsData?.bestSportRate || "82%"} success rate
                    </p>
                  </CardContent>
                </Card>
              </div>
              
              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Success Rate Over Time */}
                <Card>
                  <CardHeader>
                    <CardTitle>Success Rate Over Time</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={predictionHistoryData}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <RechartsTooltip />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="success"
                            stroke="#1a73e8"
                            activeDot={{ r: 8 }}
                            strokeWidth={2}
                            name="Success Rate (%)"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Predictions by Sport */}
                <Card>
                  <CardHeader>
                    <CardTitle>Predictions by Sport</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={sportBreakdownData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => 
                              `${name}: ${(percent * 100).toFixed(0)}%`
                            }
                          >
                            {sportBreakdownData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Pie>
                          <RechartsTooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Market Performance */}
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>Performance by Market Type</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={marketPerformanceData}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <RechartsTooltip />
                        <Legend />
                        <Bar 
                          dataKey="success" 
                          name="Your Success Rate" 
                          fill="#1a73e8" 
                        />
                        <Bar 
                          dataKey="avg" 
                          name="Platform Average" 
                          fill="#e0e0e0" 
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              {/* Call to Action */}
              {(!user.subscriptionTier || user.subscriptionTier === "free") && (
                <Card className="bg-primary/5 border-primary/10">
                  <CardContent className="py-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <h3 className="text-xl font-bold mb-2">Upgrade for Enhanced Analytics</h3>
                        <p className="text-muted-foreground">
                          Subscribe to access advanced statistics, personalized insights, and historical performance data.
                        </p>
                      </div>
                      <Button 
                        className="md:self-start"
                        onClick={() => navigate("/subscription")}
                      >
                        View Subscription Plans
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}