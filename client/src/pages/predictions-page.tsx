import { useState, useEffect } from "react";
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
} from "lucide-react";

import EnhancedPredictionCard from "@/components/predictions/enhanced-prediction-card";
import AccumulatorCard from "@/components/predictions/accumulator-card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";
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
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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

export default function PredictionsPage() {
  // Auth state
  const { user } = useAuth();
  const subscriptionStatus = user?.subscriptionTier || "free";
  
  // Filters state
  const [searchTerm, setSearchTerm] = useState("");
  const [sportFilter, setSportFilter] = useState("all");
  const [leagueFilter, setLeagueFilter] = useState("all");
  const [confidenceFilter, setConfidenceFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  
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
    isLoadingFootball || isLoadingBasketball || isLoadingAccumulators;
  const hasError = footballError || basketballError || accumulatorsError;
  
  return (
    <div className="container mx-auto py-6 max-w-5xl">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Predictions</h1>
          <p className="text-muted-foreground mt-1">
            AI-powered predictions and accumulators for sports betting
          </p>
          <div className="mt-2 flex flex-wrap gap-x-6">
            <Button 
              variant="link" 
              className="pl-0 text-blue-600 dark:text-blue-400 flex items-center gap-2"
              onClick={() => window.location.href = '/predictions/advanced'}
            >
              <span>Advanced Predictions</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Button>
            
            <Button 
              variant="link" 
              className="pl-0 text-indigo-600 dark:text-indigo-400 flex items-center gap-2"
              onClick={() => window.location.href = '/historical-dashboard'}
            >
              <span>Historical Dashboard</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 3v18h18"></path>
                <path d="m19 9-5 5-4-4-3 3"></path>
              </svg>
            </Button>
          </div>
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
                        onSave={handleSavePrediction}
                        onAddToAccumulator={handleAddToAccumulator}
                        isSaved={bookmarkedPredictions.includes(prediction.id)}
                        isInAccumulator={predictionsInAccumulator.includes(prediction.id)}
                        subscriptionStatus={subscriptionStatus}
                      />
                    ))
                )}
              </div>
              
              <div className="space-y-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  AI-Generated Accumulators
                </h2>
                
                {isLoadingAccumulators ? (
                  Array.from({ length: 2 }).map((_, i) => (
                    <div key={i} className="space-y-3">
                      <Skeleton className="h-[200px] w-full rounded-lg" />
                    </div>
                  ))
                ) : !accumulators || allAccumulators.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No accumulators found</p>
                  </div>
                ) : (
                  allAccumulators
                    .slice(0, 4)
                    .map((accumulator) => (
                      <AccumulatorCard
                        key={accumulator.id}
                        accumulator={accumulator}
                        onDelete={handleDeleteAccumulator}
                        onPlace={handlePlaceBet}
                        subscriptionStatus={subscriptionStatus}
                      />
                    ))
                )}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="football">
            <div className="grid grid-cols-1 gap-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                Football Predictions
              </h2>
              
              {isLoadingFootball ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="space-y-3">
                    <Skeleton className="h-[200px] w-full rounded-lg" />
                  </div>
                ))
              ) : filteredPredictions.filter(p => p.sport === "football").length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No football predictions found</p>
                  {(searchTerm || leagueFilter !== "all" || confidenceFilter !== "all") && (
                    <p className="mt-2">Try adjusting your filters</p>
                  )}
                </div>
              ) : (
                filteredPredictions
                  .filter(p => p.sport === "football")
                  .map((prediction) => (
                    <EnhancedPredictionCard
                      key={prediction.id}
                      prediction={prediction}
                      onSave={handleSavePrediction}
                      onAddToAccumulator={handleAddToAccumulator}
                      isSaved={bookmarkedPredictions.includes(prediction.id)}
                      isInAccumulator={predictionsInAccumulator.includes(prediction.id)}
                      subscriptionStatus={subscriptionStatus}
                    />
                  ))
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="basketball">
            <div className="grid grid-cols-1 gap-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                Basketball Predictions
              </h2>
              
              {isLoadingBasketball ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="space-y-3">
                    <Skeleton className="h-[200px] w-full rounded-lg" />
                  </div>
                ))
              ) : filteredPredictions.filter(p => p.sport === "basketball").length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No basketball predictions found</p>
                  {(searchTerm || leagueFilter !== "all" || confidenceFilter !== "all") && (
                    <p className="mt-2">Try adjusting your filters</p>
                  )}
                </div>
              ) : (
                filteredPredictions
                  .filter(p => p.sport === "basketball")
                  .map((prediction) => (
                    <EnhancedPredictionCard
                      key={prediction.id}
                      prediction={prediction}
                      onSave={handleSavePrediction}
                      onAddToAccumulator={handleAddToAccumulator}
                      isSaved={bookmarkedPredictions.includes(prediction.id)}
                      isInAccumulator={predictionsInAccumulator.includes(prediction.id)}
                      subscriptionStatus={subscriptionStatus}
                    />
                  ))
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="saved">
            <div className="grid grid-cols-1 gap-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                Saved Predictions
              </h2>
              
              {!user ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">
                    You need to be logged in to save predictions
                  </p>
                  <Button>Login to Save Predictions</Button>
                </div>
              ) : isLoadingSaved ? (
                Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="space-y-3">
                    <Skeleton className="h-[200px] w-full rounded-lg" />
                  </div>
                ))
              ) : savedPredictionsList.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    You haven't saved any predictions yet
                  </p>
                  <p className="mt-2">
                    Click the bookmark icon on predictions to save them here
                  </p>
                </div>
              ) : (
                savedPredictionsList.map((prediction) => (
                  <EnhancedPredictionCard
                    key={prediction.id}
                    prediction={prediction}
                    onSave={handleSavePrediction}
                    onAddToAccumulator={handleAddToAccumulator}
                    isSaved={true}
                    isInAccumulator={predictionsInAccumulator.includes(prediction.id)}
                    subscriptionStatus={subscriptionStatus}
                  />
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}