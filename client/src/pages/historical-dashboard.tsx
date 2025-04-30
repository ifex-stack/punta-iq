import React, { useState } from "react";
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
  AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
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
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [filterView, setFilterView] = useState("calendar"); // calendar, range, advanced
  const [performanceTab, setPerformanceTab] = useState("overall");
  const [resultType, setResultType] = useState("all"); // all, won, lost, pending
  
  // State for date range and pagination
  const [fromDate, setFromDate] = useState<string | undefined>(undefined);
  const [toDate, setToDate] = useState<string | undefined>(undefined);
  const [market, setMarket] = useState<string | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(20);

  // Convert single date to date range if needed
  const effectiveFromDate = selectedDate 
    ? selectedDate.toISOString().split('T')[0] 
    : fromDate;
  
  const effectiveToDate = selectedDate 
    ? selectedDate.toISOString().split('T')[0] 
    : toDate;

  // Query for historical dashboard data
  const { data: dashboardData, isLoading, isError } = useQuery<HistoricalDashboardResponse>({
    queryKey: [
      '/api/historical-dashboard', 
      selectedSport, 
      effectiveFromDate, 
      effectiveToDate, 
      resultType,
      market,
      currentPage,
      limit
    ],
    enabled: !!user,
  });
  
  // Generate some sample historical statistics
  const historicalStats = {
    overall: {
      totalPredictions: 2467,
      successRate: 68.4,
      averageOdds: 1.89,
      roi: 24.3,
      wonCount: 1688,
      lostCount: 779
    },
    football: {
      totalPredictions: 1423,
      successRate: 72.1,
      averageOdds: 1.76,
      roi: 27.1,
      wonCount: 1026,
      lostCount: 397
    },
    basketball: {
      totalPredictions: 654,
      successRate: 64.8,
      averageOdds: 2.04,
      roi: 21.6, 
      wonCount: 424,
      lostCount: 230
    },
    tennis: {
      totalPredictions: 235,
      successRate: 59.6,
      averageOdds: 2.21,
      roi: 17.8,
      wonCount: 140,
      lostCount: 95
    },
    other: {
      totalPredictions: 155,
      successRate: 63.2,
      averageOdds: 1.92,
      roi: 18.9,
      wonCount: 98,
      lostCount: 57
    },
  };
  
  // Generate sample monthly performance data
  const monthlyPerformance = [
    { month: "Jan", successRate: 62.4, predictions: 184 },
    { month: "Feb", successRate: 65.7, predictions: 192 },
    { month: "Mar", successRate: 68.9, predictions: 212 },
    { month: "Apr", successRate: 67.2, predictions: 195 },
    { month: "May", successRate: 70.5, predictions: 220 },
    { month: "Jun", successRate: 71.8, predictions: 234 },
    { month: "Jul", successRate: 69.3, predictions: 225 },
    { month: "Aug", successRate: 72.1, predictions: 247 },
    { month: "Sep", successRate: 68.4, predictions: 215 },
    { month: "Oct", successRate: 66.9, predictions: 208 },
    { month: "Nov", successRate: 69.7, predictions: 226 },
    { month: "Dec", successRate: 71.1, predictions: 231 }
  ];
  
  // Sample historical predictions
  const samplePredictions = [
    {
      id: 1,
      date: "2023-12-10",
      sport: "football",
      league: "Premier League",
      match: "Arsenal vs Manchester United",
      prediction: "Home Win",
      odds: 1.85,
      result: "won",
      confidence: 82
    },
    {
      id: 2,
      date: "2023-12-10",
      sport: "basketball",
      league: "NBA",
      match: "LA Lakers vs Chicago Bulls",
      prediction: "Over 205.5",
      odds: 1.92,
      result: "lost",
      confidence: 78
    },
    {
      id: 3,
      date: "2023-12-11",
      sport: "tennis",
      league: "ATP Tour",
      match: "Djokovic vs Federer",
      prediction: "Under 22.5 Games",
      odds: 2.10,
      result: "won",
      confidence: 75
    },
    {
      id: 4,
      date: "2023-12-12",
      sport: "football",
      league: "La Liga",
      match: "Barcelona vs Real Madrid",
      prediction: "BTTS",
      odds: 1.75,
      result: "won",
      confidence: 88
    },
    {
      id: 5,
      date: "2023-12-13",
      sport: "basketball",
      league: "Euroleague",
      match: "CSKA Moscow vs Barcelona",
      prediction: "Away +5.5",
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
  
  if (!user) {
    navigate("/auth");
    return null;
  }

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
        </div>
        
        <div className="flex gap-2">
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
            Export CSV
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar with filters */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Filter className="h-5 w-5 mr-2" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Sport</Label>
                <SportsTabs 
                  selectedSport={selectedSport} 
                  onSelectSport={setSelectedSport}
                  className="mt-2"
                />
              </div>
              
              <Separator />
              
              <div>
                <Label>Result Type</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <Button 
                    variant={resultType === "all" ? "default" : "outline"} 
                    size="sm"
                    onClick={() => setResultType("all")}
                  >
                    All
                  </Button>
                  <Button 
                    variant={resultType === "won" ? "default" : "outline"} 
                    size="sm"
                    onClick={() => setResultType("won")}
                    className={resultType === "won" ? "bg-green-500 hover:bg-green-600" : ""}
                  >
                    Won
                  </Button>
                  <Button 
                    variant={resultType === "lost" ? "default" : "outline"} 
                    size="sm"
                    onClick={() => setResultType("lost")}
                    className={resultType === "lost" ? "bg-red-500 hover:bg-red-600" : ""}
                  >
                    Lost
                  </Button>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Date Selection</Label>
                  <div className="flex gap-1">
                    <Button 
                      variant={filterView === "calendar" ? "default" : "outline"} 
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => setFilterView("calendar")}
                    >
                      <CalendarIcon className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant={filterView === "advanced" ? "default" : "outline"} 
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => setFilterView("advanced")}
                    >
                      <ListFilter className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                {filterView === "calendar" && (
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    className="border rounded-md p-2"
                  />
                )}
                
                {filterView === "advanced" && (
                  <div className="space-y-3 pt-2">
                    <div>
                      <Label htmlFor="date-from" className="text-xs">From</Label>
                      <Input 
                        id="date-from"
                        type="date"
                        className="mt-1"
                        value={fromDate || ''}
                        onChange={(e) => {
                          setFromDate(e.target.value || undefined);
                          // Clear single date selection when using date range
                          setSelectedDate(undefined);
                        }}
                      />
                    </div>
                    <div>
                      <Label htmlFor="date-to" className="text-xs">To</Label>
                      <Input 
                        id="date-to"
                        type="date"
                        className="mt-1"
                        value={toDate || ''}
                        onChange={(e) => {
                          setToDate(e.target.value || undefined);
                          // Clear single date selection when using date range
                          setSelectedDate(undefined);
                        }}
                      />
                    </div>
                    <Button 
                      className="w-full mt-2" 
                      size="sm"
                      onClick={() => {
                        // Reset page to 1 when applying new filters
                        setCurrentPage(1);
                      }}
                    >
                      Apply Filters
                    </Button>
                  </div>
                )}
              </div>
              
              <Separator />
              
              <div>
                <Label>League</Label>
                <Select defaultValue="all">
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select league" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Leagues</SelectItem>
                    <SelectItem value="premier-league">Premier League</SelectItem>
                    <SelectItem value="la-liga">La Liga</SelectItem>
                    <SelectItem value="serie-a">Serie A</SelectItem>
                    <SelectItem value="bundesliga">Bundesliga</SelectItem>
                    <SelectItem value="ligue-1">Ligue 1</SelectItem>
                    <SelectItem value="nba">NBA</SelectItem>
                    <SelectItem value="euroleague">Euroleague</SelectItem>
                    <SelectItem value="atp">ATP Tour</SelectItem>
                    <SelectItem value="wta">WTA Tour</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Prediction Type</Label>
                <Select 
                  defaultValue="all"
                  value={market || 'all'}
                  onValueChange={(value) => {
                    setMarket(value !== 'all' ? value : undefined);
                    setCurrentPage(1); // Reset to first page on filter change
                  }}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select prediction type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="1x2">Match Result (1X2)</SelectItem>
                    <SelectItem value="btts">Both Teams to Score</SelectItem>
                    <SelectItem value="over-under">Over/Under</SelectItem>
                    <SelectItem value="double-chance">Double Chance</SelectItem>
                    <SelectItem value="handicap">Handicap</SelectItem>
                    <SelectItem value="correct-score">Correct Score</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Confidence Level</Label>
                <Select defaultValue="all">
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select confidence level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="high">High (80%+)</SelectItem>
                    <SelectItem value="medium">Medium (60-80%)</SelectItem>
                    <SelectItem value="low">Low (Below 60%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Separator />
              
              <Button 
                className="w-full"
                onClick={() => {
                  setCurrentPage(1);
                }}
              >
                <Filter className="h-4 w-4 mr-2" />
                Apply All Filters
              </Button>
              
              <Button 
                variant="ghost" 
                className="w-full"
                onClick={() => {
                  // Reset all filters to default values
                  setSelectedSport("all");
                  setResultType("all");
                  setSelectedDate(undefined);
                  setFromDate(undefined);
                  setToDate(undefined);
                  setMarket(undefined);
                  setCurrentPage(1);
                }}
              >
                Reset Filters
              </Button>
            </CardContent>
          </Card>
        </div>
        
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Performance cards */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Performance Analytics
              </CardTitle>
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
              </Tabs>
            </CardHeader>
            <CardContent>
              <TabsContent value="overall" className="mt-0 space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-sm text-muted-foreground">Success Rate</div>
                      <div className={cn("text-2xl font-bold mt-1", getStatValueColor(historicalStats.overall.successRate))}>
                        {historicalStats.overall.successRate}%
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-sm text-muted-foreground">Predictions</div>
                      <div className="text-2xl font-bold mt-1">
                        {historicalStats.overall.totalPredictions}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-sm text-muted-foreground">Avg. Odds</div>
                      <div className="text-2xl font-bold mt-1">
                        {historicalStats.overall.averageOdds.toFixed(2)}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-sm text-muted-foreground">ROI</div>
                      <div className={cn("text-2xl font-bold mt-1", getStatValueColor(historicalStats.overall.roi, false))}>
                        {historicalStats.overall.roi}%
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
                            style={{ width: `${historicalStats.overall.successRate}%` }}
                          />
                        </div>
                        <div className="text-sm whitespace-nowrap">{historicalStats.overall.successRate}%</div>
                      </div>
                      <div className="flex justify-between mt-2 text-sm">
                        <div>
                          <span className="text-green-500 font-medium">{historicalStats.overall.wonCount}</span> Won
                        </div>
                        <div>
                          <span className="text-red-500 font-medium">{historicalStats.overall.lostCount}</span> Lost
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
              
              <TabsContent value="monthly" className="mt-0 space-y-4">
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
              
              <TabsContent value="sports" className="mt-0 space-y-4">
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
              
              <TabsContent value="predictions" className="mt-0 space-y-4">
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
                              <div>{prediction.league}</div>
                              <div>{new Date(prediction.date).toLocaleDateString()}</div>
                            </div>
                            <Separator className="my-2" />
                            <div className="flex flex-wrap justify-between text-sm">
                              <div>
                                <span className="text-muted-foreground">Prediction:</span>{" "}
                                <span className="font-medium">{prediction.prediction}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Odds:</span>{" "}
                                <span className="font-medium">{prediction.odds}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Confidence:</span>{" "}
                                <span className={cn(
                                  "font-medium",
                                  prediction.confidence >= 80 ? "text-green-500" : 
                                  prediction.confidence >= 60 ? "text-amber-500" : "text-red-500"
                                )}>
                                  {prediction.confidence}%
                                </span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}

                      {/* Show empty state when no predictions match filters */}
                      {(dashboardData?.predictions || filteredPredictions).length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          <p className="mb-2">No predictions found with the current filters</p>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              // Reset all filters
                              setSelectedSport("all");
                              setResultType("all");
                              setSelectedDate(undefined);
                              setFromDate(undefined);
                              setToDate(undefined);
                              setMarket(undefined);
                              setCurrentPage(1);
                            }}
                          >
                            Reset Filters
                          </Button>
                        </div>
                      )}
                    </div>
                    
                    {/* Pagination controls */}
                    <div className="flex justify-between items-center mt-4">
                      <div className="text-sm text-muted-foreground">
                        Showing {dashboardData?.pagination?.currentCount || (dashboardData?.predictions || filteredPredictions).length} 
                        of {dashboardData?.pagination?.totalCount || filteredPredictions.length} predictions
                      </div>
                      <div className="flex space-x-1">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          disabled={currentPage <= 1 || isLoading}
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        >
                          Previous
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          disabled={!dashboardData?.pagination?.hasNextPage || isLoading}
                          onClick={() => setCurrentPage(prev => prev + 1)}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </TabsContent>
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
                            {prediction.homeTeam ? `${prediction.homeTeam} vs ${prediction.awayTeam}` : prediction.match}
                          </div>
                          {getResultBadge(prediction.result || (prediction.isCorrect === true ? 'won' : prediction.isCorrect === false ? 'lost' : 'pending'))}
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