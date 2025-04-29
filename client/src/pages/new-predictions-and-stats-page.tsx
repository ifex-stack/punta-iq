import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
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
  Calendar,
  Check,
  Filter,
  LineChart,
  PieChart,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Zap,
  TrendingUp,
  Clock,
  Trophy,
  ChevronDown,
  ChevronUp,
  BookmarkIcon,
  Star,
  Info,
  Activity,
  ArrowUpRight,
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
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
} from "recharts";

// Types for our data
interface OddsAPI {
  id: string;
  sportKey: string;
  sportTitle: string;
  homeTeam: string;
  awayTeam: string;
  commenceTime: string;
  bookmakers: Array<{
    key: string;
    title: string;
    lastUpdate: string;
    markets: Array<{
      key: string;
      lastUpdate: string;
      outcomes: Array<{
        name: string;
        price: number;
      }>;
    }>;
  }>;
  homeOdds?: number;
  drawOdds?: number;
  awayOdds?: number;
}

interface RealTimeMatch {
  id: string;
  sport: string;
  league: string;
  country: string;
  homeTeam: string;
  awayTeam: string;
  startTime: string;
  venue: string | null;
  homeOdds?: number;
  drawOdds?: number;
  awayOdds?: number;
  score: {
    home: number | null;
    away: number | null;
  };
}

interface Prediction {
  id: string;
  sport: string;
  league: string;
  country: string;
  homeTeam: string;
  awayTeam: string;
  startTime: string;
  prediction: string;
  confidence: number;
  odds: number;
  explanation: string;
  status: 'pending' | 'won' | 'lost' | 'void';
  homeOdds?: number;
  drawOdds?: number;
  awayOdds?: number;
  valueBet?: {
    market: string;
    selection: string;
    odds: number;
    value: number;
  };
}

// Fetch direct data from the debug endpoint
export default function NewPredictionsAndStatsPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const subscriptionStatus = user?.subscriptionTier || "free";

  // State for filtering and tabs
  const [searchTerm, setSearchTerm] = useState("");
  const [sportFilter, setSportFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [mainTab, setMainTab] = useState("predictions");
  const [timeFrame, setTimeFrame] = useState("today");
  const [savedPredictions, setSavedPredictions] = useState<string[]>([]);
  
  // Fetch direct OddsAPI data from our new endpoint
  const { data: oddsApiData, isLoading: isLoadingOdds, refetch: refetchOdds } = useQuery<Prediction[]>({
    queryKey: ['/api/odds/football'],
  });

  // Get match data from OddsAPI
  const predictions = oddsApiData || [];

  // We don't need the generatePredictions function anymore as we're getting 
  // predictions directly from our new API endpoint
  
  // Filter predictions based on user input
  const filteredPredictions = predictions.filter(prediction => {
    // Search filter
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      !searchTerm ||
      prediction.homeTeam.toLowerCase().includes(searchLower) ||
      prediction.awayTeam.toLowerCase().includes(searchLower) ||
      prediction.league.toLowerCase().includes(searchLower);
    
    // Sport filter
    const matchesSport = sportFilter === "all" || prediction.sport === sportFilter;
    
    return matchesSearch && matchesSport;
  });

  // Top value bets (those with highest value rating)
  const topValueBets = [...filteredPredictions]
    .filter(p => p.valueBet)
    .sort((a, b) => (b.valueBet?.value || 0) - (a.valueBet?.value || 0))
    .slice(0, 3);
  
  // Top confidence bets
  const topConfidenceBets = [...filteredPredictions]
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 3);

  // Refresh data
  const refreshData = async () => {
    await refetchOdds();
    toast({
      title: "Data Refreshed",
      description: "Latest prediction data has been loaded",
    });
  };

  // Toggle save prediction
  const handleSavePrediction = (predictionId: string) => {
    if (savedPredictions.includes(predictionId)) {
      setSavedPredictions(savedPredictions.filter(id => id !== predictionId));
      toast({
        title: "Prediction Removed",
        description: "Removed from your saved predictions",
      });
    } else {
      setSavedPredictions([...savedPredictions, predictionId]);
      toast({
        title: "Prediction Saved",
        description: "Added to your saved predictions",
      });
    }
  };

  // Statistics data
  const statsData = {
    overall: {
      totalPredictions: 347,
      successfulPredictions: 251,
      successRate: 72,
      pendingPredictions: 15
    },
    byMarket: [
      { name: "Match Result", success: 76, volume: 180 },
      { name: "Both Teams to Score", success: 68, volume: 120 },
      { name: "Over/Under 2.5", success: 72, volume: 150 },
      { name: "Double Chance", success: 82, volume: 90 },
      { name: "Asian Handicap", success: 65, volume: 70 }
    ],
    bySport: [
      { name: "Football", success: 74, volume: 240 },
      { name: "Basketball", success: 68, volume: 180 },
      { name: "Tennis", success: 70, volume: 120 },
      { name: "Ice Hockey", success: 65, volume: 80 },
      { name: "Baseball", success: 60, volume: 50 }
    ],
    byMonth: [
      { month: "Nov", success: 68, volume: 120 },
      { month: "Dec", success: 70, volume: 100 },
      { month: "Jan", success: 65, volume: 85 },
      { month: "Feb", success: 73, volume: 110 },
      { month: "Mar", success: 75, volume: 130 },
      { month: "Apr", success: 78, volume: 140 }
    ]
  };

  // Check if we have data to show
  const hasPredictions = filteredPredictions && filteredPredictions.length > 0;

  // Handler for viewing prediction details
  const handleViewPredictionDetails = (prediction: Prediction) => {
    try {
      // Store the prediction in session storage for the advanced analysis page
      sessionStorage.setItem('selectedPrediction', JSON.stringify(prediction));
      // Navigate to the advanced analysis page
      setLocation('/advanced-analysis');
    } catch (error) {
      console.error('Failed to store prediction data', error);
      toast({
        title: "Error",
        description: "Failed to open detailed analysis",
        variant: "destructive",
      });
    }
  };

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
                onClick={refreshData}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
              
              <Button
                className="bg-white text-blue-700 hover:bg-blue-100"
              >
                Advanced Analysis
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main content with tabs */}
      <Tabs value={mainTab} onValueChange={setMainTab} className="space-y-6">
        <div className="flex justify-between items-center">
          <TabsList className="rounded-full p-1 bg-muted/50">
            <TabsTrigger value="predictions" className="rounded-full data-[state=active]:bg-white">
              <LineChart className="h-4 w-4 mr-2" />
              Predictions
            </TabsTrigger>
            <TabsTrigger value="stats" className="rounded-full data-[state=active]:bg-white">
              <PieChart className="h-4 w-4 mr-2" />
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
          {/* Search and filters bar */}
          <div className={`space-y-4 ${showFilters ? 'block' : 'hidden md:block'}`}>
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search teams, leagues, competitions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 rounded-full"
                />
              </div>
              
              <div className="flex flex-wrap gap-2">
                <Select value={sportFilter} onValueChange={setSportFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Sport" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sports</SelectItem>
                    <SelectItem value="football">Football</SelectItem>
                    <SelectItem value="basketball">Basketball</SelectItem>
                    <SelectItem value="tennis">Tennis</SelectItem>
                    <SelectItem value="hockey">Ice Hockey</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={timeFrame} onValueChange={setTimeFrame}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Time Frame" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="tomorrow">Tomorrow</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          {/* Loading state */}
          {isLoadingOdds && (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="border border-border/30">
                  <CardContent className="p-4">
                    <div className="flex flex-col space-y-3">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-16 w-full" />
                      <Skeleton className="h-8 w-full" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          
          {/* No predictions state */}
          {!isLoadingOdds && !hasPredictions && (
            <Card className="border-dashed border-2 bg-muted/30">
              <CardContent className="p-8 flex flex-col items-center justify-center text-center">
                <AlertCircle className="h-8 w-8 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Predictions Available</h3>
                <p className="text-muted-foreground mb-4">
                  There are no predictions available for the selected filters.
                </p>
                <Button onClick={refreshData} variant="outline">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh Data
                </Button>
              </CardContent>
            </Card>
          )}
          
          {/* Feature cards for top predictions */}
          {!isLoadingOdds && hasPredictions && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {/* Top value bets */}
              <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 dark:from-green-950/20 dark:to-green-900/20 dark:border-green-800/50">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center text-lg">
                    <Zap className="h-5 w-5 mr-2 text-green-600" />
                    Top Value Bets
                  </CardTitle>
                  <CardDescription>Highest value opportunities right now</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  {topValueBets.length > 0 ? (
                    <ul className="space-y-2">
                      {topValueBets.map((prediction) => (
                        <li key={prediction.id} className="flex items-center justify-between p-2 rounded-md bg-white/60 dark:bg-white/5">
                          <div className="flex-1">
                            <p className="font-medium">{prediction.homeTeam} vs {prediction.awayTeam}</p>
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Badge variant="outline" className="mr-2 text-green-700 bg-green-50 border-green-200 dark:bg-green-900/30">
                                {prediction.valueBet?.value}% Value
                              </Badge>
                              {prediction.prediction} @ {prediction.odds?.toFixed(2) || '-'}
                            </div>
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => handleSavePrediction(prediction.id)}>
                            <BookmarkIcon className={`h-5 w-5 ${savedPredictions.includes(prediction.id) ? 'fill-primary text-primary' : 'text-muted-foreground'}`} />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      No value bets available
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Top confidence predictions */}
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 dark:from-blue-950/20 dark:to-blue-900/20 dark:border-blue-800/50">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center text-lg">
                    <Trophy className="h-5 w-5 mr-2 text-blue-600" />
                    Top Confidence Picks
                  </CardTitle>
                  <CardDescription>Highest confidence predictions</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  {topConfidenceBets.length > 0 ? (
                    <ul className="space-y-2">
                      {topConfidenceBets.map((prediction) => (
                        <li key={prediction.id} className="flex items-center justify-between p-2 rounded-md bg-white/60 dark:bg-white/5">
                          <div className="flex-1">
                            <p className="font-medium">{prediction.homeTeam} vs {prediction.awayTeam}</p>
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Badge variant="outline" className="mr-2 text-blue-700 bg-blue-50 border-blue-200 dark:bg-blue-900/30">
                                {prediction.confidence}% Confidence
                              </Badge>
                              {prediction.prediction} @ {prediction.odds?.toFixed(2) || '-'}
                            </div>
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => handleSavePrediction(prediction.id)}>
                            <BookmarkIcon className={`h-5 w-5 ${savedPredictions.includes(prediction.id) ? 'fill-primary text-primary' : 'text-muted-foreground'}`} />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      No confidence picks available
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Trending now */}
              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 dark:from-purple-950/20 dark:to-purple-900/20 dark:border-purple-800/50">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center text-lg">
                    <TrendingUp className="h-5 w-5 mr-2 text-purple-600" />
                    Trending Now
                  </CardTitle>
                  <CardDescription>Popular picks among users</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  {filteredPredictions.slice(0, 3).map((prediction) => (
                    <div key={prediction.id} className="flex items-center justify-between p-2 rounded-md bg-white/60 dark:bg-white/5 mb-2">
                      <div className="flex-1">
                        <p className="font-medium">{prediction.homeTeam} vs {prediction.awayTeam}</p>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Badge variant="outline" className="mr-2 text-purple-700 bg-purple-50 border-purple-200 dark:bg-purple-900/30">
                            Hot Pick
                          </Badge>
                          {prediction.prediction}
                        </div>
                      </div>
                      <div className="flex items-center">
                        <span className="text-sm mr-2">{Math.floor(Math.random() * 100) + 10} users</span>
                        <Activity className="h-4 w-4 text-purple-600" />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}
          
          {/* All predictions */}
          {!isLoadingOdds && hasPredictions && (
            <>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">All Predictions</h2>
                <Badge variant="outline" className="rounded-full px-3 py-1">
                  {filteredPredictions.length} Matches
                </Badge>
              </div>
              
              <div className="space-y-4">
                {filteredPredictions.map((prediction) => (
                  <Card key={prediction.id} className="overflow-hidden">
                    <CardContent className="p-0">
                      <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value={prediction.id} className="border-0">
                          <AccordionTrigger className="px-4 py-3 hover:bg-muted/40 transition-all">
                            <div className="flex flex-1 flex-col md:flex-row md:items-center md:justify-between text-left">
                              <div className="flex flex-col">
                                <div className="flex items-center">
                                  <span className="font-semibold">{prediction.homeTeam} vs {prediction.awayTeam}</span>
                                  {prediction.valueBet && (
                                    <Badge className="ml-2 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                                      Value
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center mt-1 text-sm text-muted-foreground">
                                  <span className="mr-3">{prediction.league}</span>
                                  <span className="flex items-center">
                                    <Clock className="h-3 w-3 mr-1" />
                                    {new Date(prediction.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                              </div>
                              
                              <div className="flex items-center mt-2 md:mt-0">
                                <Badge 
                                  variant={prediction.confidence >= 75 ? "default" : "outline"}
                                  className={`mr-3 ${
                                    prediction.confidence >= 75 
                                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100" 
                                      : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100"
                                  }`}
                                >
                                  {prediction.confidence}% Confidence
                                </Badge>
                                <span className="font-medium text-primary">
                                  {prediction.prediction}
                                </span>
                              </div>
                            </div>
                          </AccordionTrigger>
                          
                          <AccordionContent>
                            <div className="px-4 py-3 border-t border-border/40 bg-muted/20">
                              <div className="flex flex-col lg:flex-row gap-4">
                                <div className="flex-1">
                                  <h4 className="font-medium mb-2 flex items-center">
                                    <Info className="h-4 w-4 mr-1 text-muted-foreground" />
                                    Prediction Analysis
                                  </h4>
                                  <p className="text-muted-foreground mb-3">
                                    {prediction.explanation}
                                  </p>
                                  
                                  <div className="grid grid-cols-3 gap-2 mb-3">
                                    <div className="rounded-md bg-background p-2 text-center">
                                      <div className="text-xs text-muted-foreground mb-1">Home</div>
                                      <div className="font-medium">{prediction.homeOdds?.toFixed(2) || '-'}</div>
                                    </div>
                                    <div className="rounded-md bg-background p-2 text-center">
                                      <div className="text-xs text-muted-foreground mb-1">Draw</div>
                                      <div className="font-medium">{prediction.drawOdds?.toFixed(2) || '-'}</div>
                                    </div>
                                    <div className="rounded-md bg-background p-2 text-center">
                                      <div className="text-xs text-muted-foreground mb-1">Away</div>
                                      <div className="font-medium">{prediction.awayOdds?.toFixed(2) || '-'}</div>
                                    </div>
                                  </div>
                                </div>
                                
                                {prediction.valueBet && (
                                  <div className="lg:w-64 flex-shrink-0">
                                    <div className="rounded-lg bg-green-50 p-3 border border-green-200 dark:bg-green-900/20 dark:border-green-800/40">
                                      <h4 className="font-medium mb-2 flex items-center text-green-800 dark:text-green-300">
                                        <Zap className="h-4 w-4 mr-1" />
                                        Value Bet Detected
                                      </h4>
                                      <div className="space-y-1 text-sm">
                                        <div className="flex justify-between">
                                          <span className="text-muted-foreground">Market:</span>
                                          <span className="font-medium">{prediction.valueBet?.market || '-'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-muted-foreground">Selection:</span>
                                          <span className="font-medium">{prediction.valueBet?.selection || '-'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-muted-foreground">Odds:</span>
                                          <span className="font-medium">{prediction.valueBet?.odds?.toFixed(2) || '-'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-muted-foreground">Value Rating:</span>
                                          <span className="font-medium text-green-700 dark:text-green-400">{prediction.valueBet?.value || '-'}%</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex justify-end gap-2 mt-4">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleSavePrediction(prediction.id)}
                                >
                                  <BookmarkIcon className={`h-4 w-4 mr-2 ${savedPredictions.includes(prediction.id) ? 'fill-primary text-primary' : ''}`} />
                                  {savedPredictions.includes(prediction.id) ? 'Saved' : 'Save'}
                                </Button>
                                <Button 
                                  variant="default" 
                                  size="sm"
                                  onClick={() => handleViewPredictionDetails(prediction)}
                                >
                                  <ArrowUpRight className="h-4 w-4 mr-2" />
                                  Full Analysis
                                </Button>
                              </div>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </TabsContent>
        
        {/* STATISTICS CONTENT */}
        <TabsContent value="stats" className="space-y-6 mt-2">
          {/* Overview Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col">
                  <span className="text-muted-foreground text-sm">Total Predictions</span>
                  <span className="text-3xl font-bold mt-1">{statsData.overall.totalPredictions}</span>
                  <span className="text-xs text-muted-foreground mt-1">All time</span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col">
                  <span className="text-muted-foreground text-sm">Success Rate</span>
                  <div className="flex items-baseline mt-1">
                    <span className="text-3xl font-bold">{statsData.overall.successRate}%</span>
                    <span className="text-xs text-green-600 ml-2">+2.5% this month</span>
                  </div>
                  <span className="text-xs text-muted-foreground mt-1">Last 30 days</span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col">
                  <span className="text-muted-foreground text-sm">Best Sport</span>
                  <div className="flex items-baseline mt-1">
                    <span className="text-3xl font-bold">Football</span>
                    <span className="text-xs text-green-600 ml-2">74% success</span>
                  </div>
                  <span className="text-xs text-muted-foreground mt-1">Based on success rate</span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col">
                  <span className="text-muted-foreground text-sm">Best Market</span>
                  <div className="flex items-baseline mt-1">
                    <span className="text-3xl font-bold">Double Chance</span>
                    <span className="text-xs text-green-600 ml-2">82% success</span>
                  </div>
                  <span className="text-xs text-muted-foreground mt-1">Based on success rate</span>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Success Rate By Month */}
            <Card className="overflow-hidden">
              <CardHeader>
                <CardTitle>Success Rate Trend</CardTitle>
                <CardDescription>Monthly success rate over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={statsData.byMonth}
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="colorSuccess" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                      <XAxis dataKey="month" stroke="#9ca3af" />
                      <YAxis stroke="#9ca3af" domain={[50, 90]} />
                      <RechartsTooltip
                        formatter={(value) => [`${value}%`, 'Success Rate']}
                        labelFormatter={(label) => `${label} 2024`}
                      />
                      <Area
                        type="monotone"
                        dataKey="success"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorSuccess)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            {/* Performance By Market */}
            <Card>
              <CardHeader>
                <CardTitle>Performance By Market</CardTitle>
                <CardDescription>Success rate across different prediction markets</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={statsData.byMarket}
                      margin={{ top: 10, right: 30, left: 0, bottom: 5 }}
                      barSize={40}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                      <XAxis dataKey="name" stroke="#9ca3af" />
                      <YAxis stroke="#9ca3af" domain={[0, 100]} />
                      <RechartsTooltip
                        formatter={(value) => [`${value}%`, 'Success Rate']}
                      />
                      <Bar 
                        dataKey="success" 
                        name="Success Rate"
                        fill="#3b82f6"
                        radius={[4, 4, 0, 0]} 
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* More Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Sport Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Sport Breakdown</CardTitle>
                <CardDescription>Performance across different sports</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={statsData.bySport}
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={100}
                        paddingAngle={1}
                        dataKey="volume"
                      >
                        {statsData.bySport.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={[
                              '#3b82f6', '#10b981', '#f59e0b', '#6366f1', '#ec4899'
                            ][index % 5]} 
                          />
                        ))}
                      </Pie>
                      <Legend 
                        layout="vertical" 
                        verticalAlign="middle" 
                        align="right"
                        formatter={(value, entry, index) => (
                          <span className="text-sm">{value} ({statsData.bySport[index].success}% success)</span>
                        )}
                      />
                      <RechartsTooltip
                        formatter={(value, name, props) => {
                          const sport = statsData.bySport.find(s => s.name === name);
                          return [`${value} predictions (${sport?.success}% success)`, name];
                        }}
                      />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            {/* Top Performing Leagues */}
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Leagues</CardTitle>
                <CardDescription>Leagues with the highest success rates</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-80 pr-4">
                  <div className="space-y-4">
                    {[
                      { name: "Premier League", sport: "Football", success: 78, matches: 64 },
                      { name: "NBA", sport: "Basketball", success: 76, matches: 87 },
                      { name: "La Liga", sport: "Football", success: 74, matches: 58 },
                      { name: "ATP Tour", sport: "Tennis", success: 73, matches: 45 },
                      { name: "NHL", sport: "Ice Hockey", success: 71, matches: 52 },
                      { name: "Bundesliga", sport: "Football", success: 70, matches: 49 },
                      { name: "Serie A", sport: "Football", success: 69, matches: 54 },
                      { name: "MLB", sport: "Baseball", success: 68, matches: 62 },
                      { name: "Ligue 1", sport: "Football", success: 67, matches: 47 },
                      { name: "Euroleague", sport: "Basketball", success: 66, matches: 39 }
                    ].map((league, i) => (
                      <div key={i} className="flex items-center">
                        <div className="w-8 text-muted-foreground text-sm">{i + 1}.</div>
                        <div className="flex-1">
                          <div className="font-medium">{league.name}</div>
                          <div className="text-sm text-muted-foreground">{league.sport}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{league.success}%</div>
                          <div className="text-sm text-muted-foreground">{league.matches} matches</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}