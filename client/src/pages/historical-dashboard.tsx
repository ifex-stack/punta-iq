import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  ChevronLeft, 
  Calendar as CalendarIcon,
  Filter, 
  Download,
  BarChart3,
  ListFilter,
  TrendingUp,
  Check,
  X,
  AlertTriangle,
  RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { getQueryFn } from "@/lib/queryClient";
import SportsTabs from "@/components/predictions/sports-tabs";

// Define types for historical dashboard API response
interface Prediction {
  id: number;
  match?: string;
  homeTeam?: string;
  awayTeam?: string;
  date: string;
  sport: string;
  league: string;
  prediction: string;
  odds: number;
  result?: string;
  isCorrect?: boolean | null;
  confidence: number;
  market?: string;
  createdAt: string;
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  currentCount: number;
  hasNextPage: boolean;
}

interface Metrics {
  totalPredictions: number;
  wonCount: number;
  lostCount: number;
  pendingCount: number;
  successRate: number;
  averageOdds: number;
  roi: number;
}

interface MonthlyData {
  month: string;
  year: number;
  total: number;
  won: number;
  successRate: number;
}

interface SportPerformance {
  totalPredictions: number;
  successRate: number;
  averageOdds: number;
  roi: number;
  wonCount: number;
  lostCount: number;
}

interface SportPerformanceData {
  [key: string]: SportPerformance;
  overall: SportPerformance;
}

interface HistoricalDashboardResponse {
  metrics: Metrics;
  predictions: Prediction[];
  pagination: Pagination;
  monthlyPerformance: MonthlyData[];
  sportPerformance: SportPerformanceData;
}

export default function HistoricalDashboard() {
  const [_, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedSport, setSelectedSport] = useState("all");
  const [resultType, setResultType] = useState("all");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [performanceTab, setPerformanceTab] = useState("overall");
  const [market, setMarket] = useState("");
  const [fromDate, setFromDate] = useState<Date | undefined>(undefined);
  const [toDate, setToDate] = useState<Date | undefined>(undefined);
  
  // Calculate effective dates for filter
  const effectiveFromDate = fromDate ? fromDate.toISOString().split('T')[0] : undefined;
  const effectiveToDate = toDate ? toDate.toISOString().split('T')[0] : undefined;
  
  // Fetch historical dashboard data with improved error handling
  const { data: dashboardData, isLoading, isError, error, refetch } = useQuery<HistoricalDashboardResponse>({
    queryKey: [
      '/api/historical-dashboard', 
      { 
        sport: selectedSport !== "all" ? selectedSport : undefined,
        resultType: resultType !== "all" ? resultType : undefined,
        date: selectedDate ? selectedDate.toISOString().split('T')[0] : undefined,
        market: market || undefined,
        fromDate: effectiveFromDate,
        toDate: effectiveToDate
      }
    ],
    // TEMPORARY FIX: Always enable the query regardless of auth status
    enabled: true, 
    retry: 3, // Retry 3 times on failure
    retryDelay: attempt => Math.min(attempt > 1 ? 2000 : 1000, 30 * 1000),
    staleTime: 5 * 60 * 1000, // 5 minutes 
    refetchOnWindowFocus: false, // Don't refetch when window gains focus
    queryFn: getQueryFn({ on401: "returnNull" }), // Allow unauthenticated requests for testing
  });
  
  // Debug logs for any authentication or data issues
  useEffect(() => {
    if (isError) {
      console.error("Failed to fetch historical dashboard data:", error);
      // Add additional debug info
      if (!user) {
        console.error("User is not authenticated - this may be causing the error");
      }
    }
  }, [isError, error, user]);
  
  // Sample data for development/demo
  const historicalStats = {
    overall: {
      totalPredictions: 3826,
      wonCount: 2448,
      lostCount: 1378,
      successRate: 64,
      averageOdds: 1.85,
      roi: 18.4
    },
    football: {
      totalPredictions: 1423,
      wonCount: 912,
      lostCount: 511,
      successRate: 64,
      averageOdds: 1.92,
      roi: 22.9
    },
    basketball: {
      totalPredictions: 856,
      wonCount: 547,
      lostCount: 309,
      successRate: 63,
      averageOdds: 1.78,
      roi: 13.2
    },
    tennis: {
      totalPredictions: 532,
      wonCount: 351,
      lostCount: 181,
      successRate: 66,
      averageOdds: 1.71,
      roi: 12.9
    },
    hockey: {
      totalPredictions: 423,
      wonCount: 262,
      lostCount: 161,
      successRate: 62,
      averageOdds: 1.90,
      roi: 17.8
    },
    baseball: {
      totalPredictions: 312,
      wonCount: 186,
      lostCount: 126,
      successRate: 60,
      averageOdds: 1.98,
      roi: 18.8
    },
    cricket: {
      totalPredictions: 140,
      wonCount: 95,
      lostCount: 45,
      successRate: 68,
      averageOdds: 1.67,
      roi: 13.6
    },
    americanFootball: {
      totalPredictions: 82,
      wonCount: 51,
      lostCount: 31,
      successRate: 62,
      averageOdds: 1.86,
      roi: 15.3
    },
    rugby: {
      totalPredictions: 58,
      wonCount: 44,
      lostCount: 14,
      successRate: 76,
      averageOdds: 1.59,
      roi: 20.8
    }
  };
  
  // Sample monthly performance data
  const monthlyPerformance = [
    { month: "Jan", year: 2023, total: 285, won: 182, successRate: 64, predictions: 285 },
    { month: "Feb", year: 2023, total: 312, won: 196, successRate: 63, predictions: 312 },
    { month: "Mar", year: 2023, total: 346, won: 225, successRate: 65, predictions: 346 },
    { month: "Apr", year: 2023, total: 310, won: 192, successRate: 62, predictions: 310 },
    { month: "May", year: 2023, total: 328, won: 210, successRate: 64, predictions: 328 },
    { month: "Jun", year: 2023, total: 318, won: 210, successRate: 66, predictions: 318 },
    { month: "Jul", year: 2023, total: 325, won: 221, successRate: 68, predictions: 325 },
    { month: "Aug", year: 2023, total: 335, won: 224, successRate: 67, predictions: 335 },
    { month: "Sep", year: 2023, total: 342, won: 212, successRate: 62, predictions: 342 },
    { month: "Oct", year: 2023, total: 338, won: 207, successRate: 61, predictions: 338 },
    { month: "Nov", year: 2023, total: 346, won: 230, successRate: 66, predictions: 346 },
    { month: "Dec", year: 2023, total: 241, won: 139, successRate: 58, predictions: 241 }
  ];
  
  // Sample predictions data
  const samplePredictions = [
    {
      id: 1, 
      date: "2023-12-10",
      sport: "football",
      league: "Premier League",
      match: "Arsenal vs Man Utd",
      prediction: "Arsenal Win",
      odds: 1.75,
      result: "won",
      confidence: 80
    },
    {
      id: 2, 
      date: "2023-12-11",
      sport: "basketball",
      league: "NBA",
      match: "Lakers vs Celtics",
      prediction: "Over 210.5",
      odds: 1.90,
      result: "won",
      confidence: 78
    },
    {
      id: 3, 
      date: "2023-12-12",
      sport: "tennis",
      league: "ATP",
      match: "Djokovic vs Nadal",
      prediction: "Djokovic -1.5 Sets",
      odds: 2.10,
      result: "won",
      confidence: 82
    },
    {
      id: 4, 
      date: "2023-12-13",
      sport: "hockey",
      league: "NHL",
      match: "Maple Leafs vs Bruins",
      prediction: "Under 5.5 Goals",
      odds: 1.85,
      result: "lost",
      confidence: 68
    },
    {
      id: 5, 
      date: "2023-12-14",
      sport: "cricket",
      league: "IPL",
      match: "Mumbai vs Chennai",
      prediction: "Mumbai Win",
      odds: 1.95,
      result: "lost",
      confidence: 72
    },
    {
      id: 6, 
      date: "2023-12-14",
      sport: "football",
      league: "Bundesliga",
      match: "Bayern Munich vs Dortmund",
      prediction: "Over 2.5 Goals",
      odds: 1.65,
      result: "won",
      confidence: 85
    },
    {
      id: 7,
      date: "2023-12-15",
      sport: "football",
      league: "Serie A",
      match: "Inter vs AC Milan",
      prediction: "Draw",
      odds: 3.40,
      result: "lost",
      confidence: 60
    },
    {
      id: 8,
      date: "2023-12-15",
      sport: "tennis",
      league: "WTA",
      match: "Serena Williams vs Osaka",
      prediction: "Osaka Win",
      odds: 2.25,
      result: "won",
      confidence: 76
    }
  ];
  
  // Filter predictions based on selected filters
  const filteredPredictions = samplePredictions.filter(pred => {
    let shouldInclude = true;
    
    // Filter by sport
    if (selectedSport !== "all" && pred.sport !== selectedSport) {
      shouldInclude = false;
    }
    
    // Filter by result type
    if (resultType !== "all" && pred.result !== resultType) {
      shouldInclude = false;
    }
    
    // Filter by date
    if (selectedDate && !pred.date.includes(selectedDate.toISOString().split('T')[0])) {
      shouldInclude = false;
    }
    
    return shouldInclude;
  });
  
  // Calculate winning percentage for the date badge
  const getWinPercentage = (predictions: typeof samplePredictions) => {
    if (!predictions.length) return 0;
    const wins = predictions.filter(p => p.result === "won").length;
    return Math.round((wins / predictions.length) * 100);
  };
  
  const getResultBadge = (result?: string | null) => {
    if (!result) {
      return <Badge variant="outline" className="text-amber-500 border-amber-500"><AlertTriangle className="h-3 w-3 mr-1" /> Pending</Badge>;
    }
    
    switch(result.toLowerCase()) {
      case "won":
        return <Badge className="bg-green-500 hover:bg-green-600"><Check className="h-3 w-3 mr-1" /> Won</Badge>;
      case "lost":
        return <Badge variant="destructive"><X className="h-3 w-3 mr-1" /> Lost</Badge>;
      default:
        return <Badge variant="outline" className="text-amber-500 border-amber-500"><AlertTriangle className="h-3 w-3 mr-1" /> Pending</Badge>;
    }
  };
  
  const performanceTabs = [
    { id: "overall", label: "Overall" },
    { id: "monthly", label: "Monthly" },
    { id: "sports", label: "By Sport" },
    { id: "predictions", label: "Predictions" },
  ];
  
  const getStatValueColor = (value: number, isPercentage = true) => {
    if (isPercentage) {
      if (value >= 70) return "text-green-500";
      if (value >= 60) return "text-amber-500";
      return "text-red-500";
    } else {
      if (value >= 20) return "text-green-500";
      if (value >= 10) return "text-amber-500";
      return value >= 0 ? "text-muted-foreground" : "text-red-500";
    }
  };

  // Handle loading state
  if (isLoading) {
    return (
      <div className="container py-8 max-w-6xl">
        <div className="mb-6 flex items-center">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate("/")}
            className="mr-2"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">Historical Dashboard</h1>
        </div>
        <div className="flex items-center justify-center min-h-[60vh] w-full">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
            <p className="text-muted-foreground">Loading historical dashboard data...</p>
          </div>
        </div>
      </div>
    );
  }

  // Handle error state
  if (isError) {
    return (
      <div className="container py-8 max-w-6xl">
        <div className="mb-6 flex items-center">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate("/")}
            className="mr-2"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">Historical Dashboard</h1>
        </div>
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center text-destructive">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Error Loading Dashboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">We encountered an error while loading your historical prediction data. This could be due to:</p>
            <ul className="list-disc pl-5 mb-4 space-y-1">
              <li>Connection issues with our prediction database</li>
              <li>No historical prediction data available for your account</li>
              <li>Temporary server issue</li>
            </ul>
            <Button onClick={() => refetch()} className="mr-2">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            <Button variant="outline" onClick={() => navigate("/")}>
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If server data is not available, use sample data
  const metrics = dashboardData?.metrics || historicalStats.overall;
  const sportPerformanceData = dashboardData?.sportPerformance || historicalStats;
  const monthlyPerformanceData = dashboardData?.monthlyPerformance || monthlyPerformance;
  const predictions = dashboardData?.predictions || filteredPredictions;
  
  // We have data (either from server or fallback), render the dashboard
  return (
    <div className="container py-8 max-w-6xl">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate("/")}
            className="mr-2"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">Historical Dashboard</h1>
          {!dashboardData && (
            <Badge variant="outline" className="ml-2 text-amber-500 border-amber-500">
              <AlertTriangle className="h-3 w-3 mr-1" /> 
              Demo Mode
            </Badge>
          )}
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => refetch()}
            className="mr-2"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              // Create query parameters
              const params = new URLSearchParams();
              if (selectedSport !== "all") params.append("sport", selectedSport);
              if (effectiveFromDate) params.append("fromDate", effectiveFromDate);
              if (effectiveToDate) params.append("toDate", effectiveToDate);
              if (resultType !== "all") params.append("resultType", resultType);
              if (market) params.append("market", market);
              
              // Navigate to export endpoint with parameters
              window.open(`/api/historical-dashboard/export?${params.toString()}`, '_blank');
            }}
          >
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Filter className="h-5 w-5 mr-2" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="sport-filter">Sport</Label>
                <Select value={selectedSport} onValueChange={setSelectedSport}>
                  <SelectTrigger id="sport-filter">
                    <SelectValue placeholder="Select sport" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sports</SelectItem>
                    <SelectItem value="football">Football</SelectItem>
                    <SelectItem value="basketball">Basketball</SelectItem>
                    <SelectItem value="tennis">Tennis</SelectItem>
                    <SelectItem value="hockey">Hockey</SelectItem>
                    <SelectItem value="baseball">Baseball</SelectItem>
                    <SelectItem value="cricket">Cricket</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="result-filter">Result</Label>
                <Select value={resultType} onValueChange={setResultType}>
                  <SelectTrigger id="result-filter">
                    <SelectValue placeholder="Select result" />
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
                <Label htmlFor="market-filter">Market</Label>
                <Input 
                  id="market-filter" 
                  placeholder="e.g. Over 2.5, Match Result" 
                  value={market}
                  onChange={(e) => setMarket(e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="date-range">Date Range</Label>
                <div className="grid grid-cols-2 gap-2 mt-1.5">
                  <div className="relative">
                    <Button
                      variant="outline"
                      onClick={() => document.getElementById("from-date-picker")?.click()}
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {fromDate ? (
                        fromDate.toLocaleDateString()
                      ) : (
                        <span className="text-muted-foreground">From date</span>
                      )}
                    </Button>
                    <div className="absolute top-full mt-1 z-10">
                      <div className="hidden">
                        <Calendar
                          id="from-date-picker"
                          mode="single"
                          selected={fromDate}
                          onSelect={setFromDate}
                          initialFocus
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="relative">
                    <Button
                      variant="outline"
                      onClick={() => document.getElementById("to-date-picker")?.click()}
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {toDate ? (
                        toDate.toLocaleDateString()
                      ) : (
                        <span className="text-muted-foreground">To date</span>
                      )}
                    </Button>
                    <div className="absolute top-full mt-1 z-10">
                      <div className="hidden">
                        <Calendar
                          id="to-date-picker"
                          mode="single"
                          selected={toDate}
                          onSelect={setToDate}
                          initialFocus
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <Label>Select specific date</Label>
                <div className="mt-2">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    className="border rounded-md p-3"
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={() => {
                  setSelectedSport("all");
                  setResultType("all");
                  setSelectedDate(undefined);
                  setMarket("");
                  setFromDate(undefined);
                  setToDate(undefined);
                }}
                variant="outline"
                className="w-full"
              >
                Reset Filters
              </Button>
            </CardFooter>
          </Card>
          
          {/* Sports summary */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center">
                <ListFilter className="h-5 w-5 mr-2" />
                Sports Breakdown
              </CardTitle>
              <CardDescription>
                Performance by sport
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SportsTabs 
                selectedSport={selectedSport}
                onSelectSport={(sport: string) => setSelectedSport(sport === selectedSport ? "all" : sport)}
              />
            </CardContent>
          </Card>
        </div>
        
        <div className="lg:col-span-2 space-y-6">
          {/* Performance analytics */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Performance Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs 
                value={performanceTab} 
                onValueChange={setPerformanceTab}
                className="w-full"
              >
                <TabsList className="grid grid-cols-4">
                  {performanceTabs.map((tab) => (
                    <TabsTrigger key={tab.id} value={tab.id}>
                      {tab.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
                <TabsContent value="overall" className="mt-4 space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-sm text-muted-foreground">Success Rate</div>
                        <div className={cn("text-2xl font-bold mt-1", getStatValueColor(metrics.successRate))}>
                          {metrics.successRate}%
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-sm text-muted-foreground">Predictions</div>
                        <div className="text-2xl font-bold mt-1">
                          {metrics.totalPredictions}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-sm text-muted-foreground">Avg. Odds</div>
                        <div className="text-2xl font-bold mt-1">
                          {metrics.averageOdds.toFixed(2)}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-sm text-muted-foreground">ROI</div>
                        <div className={cn("text-2xl font-bold mt-1", getStatValueColor(metrics.roi, false))}>
                          {metrics.roi}%
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="py-3">
                        <CardTitle className="text-sm font-medium">Win/Loss Ratio</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <div className="flex items-center gap-2">
                          <div className="h-10 w-full bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-green-500" 
                              style={{ width: `${metrics.successRate}%` }}
                            />
                          </div>
                          <div className="text-sm whitespace-nowrap">{metrics.successRate}%</div>
                        </div>
                        <div className="flex justify-between mt-2 text-sm">
                          <div>
                            <span className="text-green-500 font-medium">{metrics.wonCount}</span> Won
                          </div>
                          <div>
                            <span className="text-red-500 font-medium">{metrics.lostCount}</span> Lost
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="py-3">
                        <CardTitle className="text-sm font-medium">Best Performing Sport</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <div className="flex justify-between items-center">
                          <div className="space-y-1">
                            <div className="font-medium">Football</div>
                            <div className="text-sm text-muted-foreground">1,423 predictions</div>
                          </div>
                          <div className={cn("text-2xl font-bold", getStatValueColor(historicalStats.football.successRate))}>
                            {historicalStats.football.successRate}%
                          </div>
                        </div>
                        <Separator className="my-3" />
                        <div className="flex justify-between text-sm">
                          <div>Avg. Odds: <span className="font-medium">{historicalStats.football.averageOdds.toFixed(2)}</span></div>
                          <div>ROI: <span className={cn("font-medium", getStatValueColor(historicalStats.football.roi, false))}>
                            {historicalStats.football.roi}%
                          </span></div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <Card>
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm font-medium">Monthly Performance Trend</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="h-[180px] w-full">
                        <div className="flex h-full items-end gap-2">
                          {monthlyPerformance.map((month) => (
                            <div key={month.month} className="flex-1 flex flex-col items-center">
                              <div 
                                className={cn(
                                  "w-full rounded-t-sm", 
                                  month.successRate >= 70 ? "bg-green-500" : 
                                  month.successRate >= 60 ? "bg-amber-500" : "bg-red-500"
                                )}
                                style={{ height: `${month.successRate * 1.8}px` }}
                              />
                              <div className="text-xs text-muted-foreground mt-1">{month.month}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="monthly" className="mt-4 space-y-4">
                  <div className="space-y-4">
                    {monthlyPerformance.slice(6).map((month) => (
                      <Card key={month.month}>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-center">
                            <div className="font-medium">{month.month}</div>
                            <Badge className={cn(
                              month.successRate >= 70 ? "bg-green-500 hover:bg-green-600" : 
                              month.successRate >= 60 ? "bg-amber-500 hover:bg-amber-600" : "bg-red-500 hover:bg-red-600"
                            )}>
                              {month.successRate}%
                            </Badge>
                          </div>
                          <div className="flex justify-between mt-2 text-sm text-muted-foreground">
                            <div>{month.predictions} predictions</div>
                            <div>ROI: <span className="font-medium">
                              {(month.successRate / 3).toFixed(1)}%
                            </span></div>
                          </div>
                          <div className="h-2 w-full bg-muted rounded-full mt-3 overflow-hidden">
                            <div 
                              className={cn(
                                "h-full",
                                month.successRate >= 70 ? "bg-green-500" : 
                                month.successRate >= 60 ? "bg-amber-500" : "bg-red-500"
                              )}
                              style={{ width: `${month.successRate}%` }}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
                
                <TabsContent value="sports" className="mt-4 space-y-4">
                  <div className="space-y-4">
                    {Object.entries(historicalStats).filter(([key]) => key !== "overall").map(([sport, stats]) => (
                      <Card key={sport}>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-center">
                            <div className="font-medium capitalize">{sport}</div>
                            <Badge className={cn(
                              stats.successRate >= 70 ? "bg-green-500 hover:bg-green-600" : 
                              stats.successRate >= 60 ? "bg-amber-500 hover:bg-amber-600" : "bg-red-500 hover:bg-red-600"
                            )}>
                              {stats.successRate}%
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 mt-2 text-sm text-muted-foreground">
                            <div>Total: <span className="font-medium">{stats.totalPredictions}</span></div>
                            <div>Avg. Odds: <span className="font-medium">{stats.averageOdds.toFixed(2)}</span></div>
                            <div>Won: <span className="text-green-500 font-medium">{stats.wonCount}</span></div>
                            <div>Lost: <span className="text-red-500 font-medium">{stats.lostCount}</span></div>
                          </div>
                          <div className="h-2 w-full bg-muted rounded-full mt-3 overflow-hidden">
                            <div 
                              className={cn(
                                "h-full",
                                stats.successRate >= 70 ? "bg-green-500" : 
                                stats.successRate >= 60 ? "bg-amber-500" : "bg-red-500"
                              )}
                              style={{ width: `${stats.successRate}%` }}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
                
                <TabsContent value="predictions" className="mt-4 space-y-4">
                  {isLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    </div>
                  ) : isError ? (
                    <div className="p-4 border border-red-300 bg-red-50 rounded-md text-red-600">
                      <div className="flex items-center">
                        <AlertTriangle className="h-5 w-5 mr-2" />
                        <p className="font-medium">Failed to load prediction data</p>
                      </div>
                      <p className="text-sm mt-1">Please try again or contact support if the issue persists.</p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-3">
                        {/* Use real API data if available, fallback to sample data for development */}
                        {(dashboardData?.predictions || filteredPredictions).map((prediction) => (
                          <Card key={prediction.id}>
                            <CardContent className="p-4">
                              <div className="flex justify-between items-center">
                                <div className="font-medium">{prediction.match}</div>
                                {getResultBadge(prediction.result)}
                              </div>
                              <div className="flex flex-wrap justify-between mt-1 text-sm text-muted-foreground">
                                <div className="mr-4">
                                  <span className="text-muted-foreground">Prediction:</span>{" "}
                                  <span className="font-medium">{prediction.prediction}</span>
                                </div>
                                <div className="mr-4">
                                  <span className="text-muted-foreground">Odds:</span>{" "}
                                  <span className="font-medium">{prediction.odds.toFixed(2)}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Confidence:</span>{" "}
                                  <span className={cn(
                                    "font-medium",
                                    prediction.confidence >= 80 ? "text-green-500" : 
                                    prediction.confidence >= 65 ? "text-amber-500" : "text-red-500"
                                  )}>
                                    {prediction.confidence}%
                                  </span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
          
          {/* Calendar view */}
          {selectedDate && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg">
                  {selectedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </CardTitle>
                <Badge>
                  {dashboardData?.metrics?.successRate || getWinPercentage(filteredPredictions)}% Success
                </Badge>
              </CardHeader>
              <CardContent className="space-y-3">
                {isLoading ? (
                  <div className="flex justify-center py-6">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                  </div>
                ) : (dashboardData?.predictions || filteredPredictions).length > 0 ? (
                  (dashboardData?.predictions || filteredPredictions).map((prediction) => (
                    <Card key={prediction.id} className="bg-muted/50 border">
                      <CardContent className="p-3">
                        <div className="flex justify-between items-center">
                          <div className="font-medium">
                            {prediction.match}
                          </div>
                          {getResultBadge(prediction.result)}
                        </div>
                        <div className="flex justify-between mt-1 text-sm text-muted-foreground">
                          <div>{prediction.prediction}</div>
                          <div>Odds: {prediction.odds}</div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center text-muted-foreground py-6">
                    No predictions found for the selected date
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          
          {/* Historical stats */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                Historical Statistics
              </CardTitle>
              <CardDescription>
                Long-term performance metrics for all predictions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-6">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">All-time predictions</div>
                    <div className="text-xl font-bold mt-1">
                      {dashboardData?.metrics?.totalPredictions || historicalStats.overall.totalPredictions}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">All-time win rate</div>
                    <div className={cn(
                      "text-xl font-bold mt-1", 
                      getStatValueColor(dashboardData?.metrics?.successRate || historicalStats.overall.successRate)
                    )}>
                      {dashboardData?.metrics?.successRate || historicalStats.overall.successRate}%
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Best month</div>
                    <div className="text-xl font-bold mt-1">
                      {dashboardData?.monthlyPerformance ? 
                        dashboardData.monthlyPerformance.reduce((max, m) => 
                          m.successRate > max.successRate ? m : max
                        ).month : 
                        monthlyPerformance.reduce((max, m) => 
                          m.successRate > max.successRate ? m : max
                        ).month
                      }{" "}
                      <span className="text-sm font-normal">
                        ({dashboardData?.monthlyPerformance ? 
                          dashboardData.monthlyPerformance.reduce((max, m) => 
                            m.successRate > max.successRate ? m : max
                          ).successRate : 
                          monthlyPerformance.reduce((max, m) => 
                            m.successRate > max.successRate ? m : max
                          ).successRate
                        }%)
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Best sport</div>
                    <div className="text-xl font-bold mt-1 capitalize">
                      {dashboardData?.sportPerformance ? 
                        Object.entries(dashboardData.sportPerformance)
                          .filter(([key, _]) => key !== 'overall')
                          .reduce((best, [key, data]) => 
                            data.successRate > best.performance.successRate 
                              ? {sport: key, performance: data} 
                              : best, 
                            {sport: 'none', performance: {successRate: 0}}
                          ).sport :
                        'Football'
                      }{" "}
                      <span className="text-sm font-normal">
                        ({dashboardData?.sportPerformance ? 
                          Object.entries(dashboardData.sportPerformance)
                            .filter(([key, _]) => key !== 'overall')
                            .reduce((best, [key, data]) => 
                              data.successRate > best.performance.successRate 
                                ? {sport: key, performance: data} 
                                : best, 
                              {sport: 'none', performance: {successRate: 0}}
                            ).performance.successRate :
                          historicalStats.football.successRate
                        }%)
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}