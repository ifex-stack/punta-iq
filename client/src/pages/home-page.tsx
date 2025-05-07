import React, { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  ChevronRight, ChevronLeft, Filter, Loader2, TrendingUp, Bell, 
  ChevronDown, Calculator, Trophy, Activity,
  Target, BarChart3, Users, Sparkles, Star, Zap, 
  ArrowRight, BadgeCheck, PieChart, ArrowUpRight,
  CheckCircle2, Calendar
} from "lucide-react";
import PredictionCard from "@/components/predictions/prediction-card";
import SportsTabs from "@/components/predictions/sports-tabs";
import AccumulatorPanel from "@/components/predictions/accumulator-panel";
import { useAuth } from "@/hooks/use-auth";
import { useNotifications } from "@/hooks/use-notifications";
import { useOnboarding } from "@/components/onboarding/onboarding-provider";
import { PuntaIQLogo } from "@/components/ui/puntaiq-logo";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingTopics } from "@/components/news/trending-topics";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format, addDays, startOfDay, isToday, isPast, isFuture } from 'date-fns';

export default function HomePage() {
  const [_, navigate] = useLocation();
  const { user, isLoading: isAuthLoading } = useAuth();
  const { toast } = useToast();
  const notifications = useNotifications();
  const { showOnboarding } = useOnboarding();
  const [selectedSport, setSelectedSport] = useState("all");
  
  // Calendar state
  const [date, setDate] = useState<Date>(new Date());
  const [calendarOpen, setCalendarOpen] = useState<boolean>(false);
  const formattedDate = format(date, 'MMM dd, yyyy');
  const isCurrentDate = isToday(date);
  
  interface Prediction {
    id: string;
    sport: string;
    league: string;
    homeTeam: string;
    awayTeam: string;
    prediction: string;
    confidence: number;
    startTime: string;
    odds: number;
    [key: string]: any;
  }
  
  const { data: predictions, isLoading: isPredictionsLoading } = useQuery<Prediction[]>({
    queryKey: ['/api/predictions', selectedSport],
    enabled: true, // Load predictions even for non-authenticated users (free tier)
  });
  
  interface StatsData {
    weekSuccessRate: number;
    weekCorrect: number;
    weekTotal: number;
    monthSuccessRate: number;
    monthCorrect: number;
    monthTotal: number;
    avgConfidence: number;
    totalPredictions: number;
    todayCount: number;
    todaySports: number;
  }
  
  const { data: stats } = useQuery<StatsData>({
    queryKey: ['/api/predictions/stats'],
    enabled: !!user, // Only load stats for authenticated users
  });
  
  const isLoading = isAuthLoading || isPredictionsLoading;
  
  const handleSportChange = (sport: string) => {
    setSelectedSport(sport);
  };
  
  const handleDateChange = (newDate: Date | undefined) => {
    if (newDate) {
      setDate(newDate);
      setCalendarOpen(false);
      
      // Here you could refetch predictions for the selected date
      // or navigate to a date-specific view
      toast({
        title: `Date Selected: ${format(newDate, 'MMMM dd, yyyy')}`,
        description: `Showing predictions for ${isToday(newDate) ? 'today' : format(newDate, 'MMM dd, yyyy')}`,
      });
    }
  };
  
  // Test notification function
  const handleSendTestNotification = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to test the notification system.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Send a test notification via API
      const response = await apiRequest('POST', '/api/notifications', {
        userId: user.id,
        title: "Test Notification",
        body: "This is a test notification from PuntaIQ",
        category: "test",
        actionUrl: null
      });
      
      toast({
        title: "Success",
        description: "Test notification sent successfully!",
        variant: "default",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send test notification",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="animate-in fade-in duration-500">
      {/* Fixed header with calendar */}
      <div className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur border-b">
        <div className="container flex h-14 items-center justify-between max-w-6xl">
          <div className="flex items-center">
            <PuntaIQLogo size="sm" />
          </div>
          <div className="flex items-center space-x-4">
            {/* Calendar date picker */}
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className={`gap-1 ${!isCurrentDate ? 'text-blue-600 border-blue-300 dark:text-blue-400 dark:border-blue-700' : ''}`}
                >
                  <Calendar className="h-4 w-4" />
                  <span>{formattedDate}</span>
                  <ChevronDown className="h-3.5 w-3.5 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <CalendarComponent
                  mode="single"
                  selected={date}
                  onSelect={handleDateChange}
                  initialFocus
                  className="p-2"
                />
              </PopoverContent>
            </Popover>
            
            {/* Notification bell icon */}
            {user && (
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                  3
                </span>
              </Button>
            )}
            
            {/* Profile/login button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(user ? "/profile" : "/auth")}
              className="gap-1"
            >
              {user ? "My Profile" : "Sign In"}
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      
      {/* Hero section with gradient background */}
      <div className="relative bg-gradient-to-b from-indigo-50 to-white dark:from-gray-900 dark:to-background">
        <div className="container py-16 max-w-6xl">
          <div className="flex flex-col items-center text-center mb-12">
            <div className="mb-6">
              <PuntaIQLogo size="lg" />
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              AI-Powered Sports Predictions
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground max-w-3xl mb-6 sm:mb-8 px-4 sm:px-0">
              Smart sports predictions driven by advanced AI, helping you make informed decisions with up-to-date statistics and insights.
            </p>
            
            <div className="flex flex-wrap gap-4 justify-center">
              <Button 
                onClick={() => navigate("/predictions")} 
                size="lg" 
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
              >
                <Sparkles className="mr-2 h-5 w-5" />
                Explore Predictions
              </Button>
              
              {!user && (
                <Button 
                  onClick={() => navigate("/auth")} 
                  variant="outline" 
                  size="lg"
                >
                  Create Free Account
                </Button>
              )}
            </div>
          </div>
          
          {/* Quick stats */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              <Card className="bg-white/90 dark:bg-gray-900/90 backdrop-blur border-0 shadow-lg">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="rounded-full p-3 bg-indigo-100 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                    <BadgeCheck className="h-7 w-7" />
                  </div>
                  <div>
                    <div className="text-3xl font-bold">{stats.weekSuccessRate}%</div>
                    <p className="text-xs text-muted-foreground">Success Rate (7d)</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-white/90 dark:bg-gray-900/90 backdrop-blur border-0 shadow-lg">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="rounded-full p-3 bg-purple-100 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400">
                    <Calculator className="h-7 w-7" />
                  </div>
                  <div>
                    <div className="text-3xl font-bold">{stats.avgConfidence}%</div>
                    <p className="text-xs text-muted-foreground">Avg. Confidence</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-white/90 dark:bg-gray-900/90 backdrop-blur border-0 shadow-lg">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="rounded-full p-3 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                    <TrendingUp className="h-7 w-7" />
                  </div>
                  <div>
                    <div className="text-3xl font-bold">{stats.monthSuccessRate}%</div>
                    <p className="text-xs text-muted-foreground">Success Rate (30d)</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-white/90 dark:bg-gray-900/90 backdrop-blur border-0 shadow-lg">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="rounded-full p-3 bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
                    <Zap className="h-7 w-7" />
                  </div>
                  <div>
                    <div className="text-3xl font-bold">{stats.todayCount}</div>
                    <p className="text-xs text-muted-foreground">Today's Predictions</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
        
        {/* Decorative elements */}
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
      </div>
      
      {/* Main content section */}
      <div className="container py-12 max-w-6xl">
        {/* Top Accumulators Banner */}
        <div className="mb-8">
          <Card className="border-0 shadow-md bg-gradient-to-r from-indigo-500/90 to-purple-500/90 dark:from-indigo-600/90 dark:to-purple-600/90 text-white overflow-hidden">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col md:flex-row justify-between items-center gap-3">
                <div className="flex items-start space-x-4">
                  <div className="bg-white/20 p-3 rounded-full">
                    <Activity className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-1 text-white">Today's AI Accumulators</h3>
                    <p className="text-white/90 max-w-md">
                      Ready-made AI selections with up to 50x potential returns
                    </p>
                  </div>
                </div>
                <Button 
                  size="lg" 
                  onClick={() => navigate("/accumulators")}
                  className="bg-white hover:bg-white/90 text-indigo-700 border-0"
                >
                  View Accumulators
                  <ArrowUpRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Trending Topics in Sports */}
        <div className="mb-8">
          <TrendingTopics />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column - Today's Predictions */}
          <div className="lg:col-span-2">
            <Card className="border-0 shadow-lg overflow-hidden">
              <CardHeader className="border-b bg-muted/30">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <CardTitle>Today's Predictions</CardTitle>
                  <Tabs defaultValue="featured" className="w-full sm:w-[400px]">
                    <TabsList className="h-9 grid w-full grid-cols-4">
                      <TabsTrigger value="featured" className="text-xs sm:text-sm">Featured</TabsTrigger>
                      <TabsTrigger value="football" className="text-xs sm:text-sm">Football</TabsTrigger>
                      <TabsTrigger value="basketball" className="text-xs sm:text-sm">Basketball</TabsTrigger>
                      <TabsTrigger value="tennis" className="text-xs sm:text-sm">Tennis</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="flex justify-center items-center py-16">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                  </div>
                ) : !predictions || predictions.length === 0 ? (
                  <div className="text-center py-16 px-4">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
                      <Target className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">No Predictions Available</h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      We don't have any predictions for this selection at the moment. 
                      Please try another category or check back later.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {predictions.slice(0, 5).map((prediction: any, index: number) => (
                      <div 
                        key={prediction.id}
                        className={`p-4 hover:bg-muted/50 transition-colors ${index % 2 === 0 ? 'bg-background' : 'bg-muted/20'}`}
                      >
                        <PredictionCard prediction={prediction} />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
              <CardFooter className="border-t bg-muted/30 justify-between py-3">
                <div className="text-xs text-muted-foreground">
                  Updated every 4 hours with latest data
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => navigate("/predictions")}
                  className="gap-1"
                >
                  View All Predictions 
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </CardFooter>
            </Card>
            
            {/* Features grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
              <Card 
                className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/40 border-0 shadow-md hover:shadow-lg transition-all cursor-pointer"
                onClick={() => navigate("/history")}
              >
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center">
                    <div className="rounded-full bg-indigo-100 dark:bg-indigo-900/50 p-3 mb-4">
                      <TrendingUp className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <h3 className="font-semibold mb-2">Historical Dashboard</h3>
                    <p className="text-sm text-muted-foreground">
                      Track your prediction history and analyze performance
                    </p>
                    <Badge className="mt-2 bg-indigo-500">New</Badge>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/40 border-0 shadow-md">
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center">
                    <div className="rounded-full bg-indigo-100 dark:bg-indigo-900/50 p-3 mb-4">
                      <BarChart3 className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <h3 className="font-semibold mb-2">Advanced Statistics</h3>
                    <p className="text-sm text-muted-foreground">
                      In-depth statistical analysis for all sports and leagues
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 border-0 shadow-md">
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center">
                    <div className="rounded-full bg-emerald-100 dark:bg-emerald-900/50 p-3 mb-4">
                      <Trophy className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <h3 className="font-semibold mb-2">Fantasy Contests</h3>
                    <p className="text-sm text-muted-foreground">
                      Compete in daily fantasy contests with cash prizes
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40 border-0 shadow-md">
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center">
                    <div className="rounded-full bg-amber-100 dark:bg-amber-900/50 p-3 mb-4">
                      <Trophy className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                    </div>
                    <h3 className="font-semibold mb-2">Gamification</h3>
                    <p className="text-sm text-muted-foreground">
                      Earn badges, climb leaderboards, and maintain streaks
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
          
          {/* Right column - Sidebar */}
          <div className="space-y-6">
            {/* Subscription card */}
            <Card className="border-0 shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 text-white">
                <h3 className="text-xl font-bold mb-2">Premium Predictions</h3>
                <p className="text-white/80 text-sm mb-4">
                  Get unlimited access to all premium predictions and features
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="bg-white/20">MOST POPULAR</Badge>
                  <Badge variant="secondary" className="hidden-xs bg-white/20">SAVE 50%</Badge>
                </div>
              </div>
              <CardContent className="pt-6">
                <div className="mb-6">
                  <div className="flex items-baseline mb-2">
                    <span className="text-3xl font-bold">$9.99</span>
                    <span className="text-muted-foreground ml-2">/month</span>
                  </div>
                  <p className="text-muted-foreground text-sm">
                    Cancel anytime. Instant access.
                  </p>
                </div>
                
                <ul className="space-y-3 mb-6">
                  <li className="flex gap-2 items-center">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    <span>High-accuracy premium predictions</span>
                  </li>
                  <li className="flex gap-2 items-center">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    <span>Advanced statistical insights</span>
                  </li>
                  <li className="flex gap-2 items-center">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    <span>Custom accumulators generator</span>
                  </li>
                  <li className="flex gap-2 items-center">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    <span>Early access to new features</span>
                  </li>
                </ul>
                
                <Button 
                  onClick={() => navigate("/subscription")} 
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600"
                >
                  Get Premium
                </Button>
              </CardContent>
            </Card>
            
            {/* News Panel */}
            <Card className="border-0 shadow-lg overflow-hidden">
              <CardHeader className="py-3 border-b bg-muted/30">
                <div className="flex justify-between items-center">
                  <CardTitle>Latest News</CardTitle>
                  <Badge variant="secondary">
                    <Star className="h-3 w-3 fill-current mr-1" />
                    Top Stories
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  <div className="p-4 hover:bg-muted/30 transition-colors cursor-pointer">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-semibold">
                        Premier League Update
                      </h4>
                      <Badge variant="outline">Football</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">Manchester City extends lead with 3-0 victory over Arsenal</p>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground">2 hours ago</span>
                    </div>
                  </div>
                  
                  <div className="p-4 hover:bg-muted/30 transition-colors cursor-pointer">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-semibold">
                        NBA Playoffs
                      </h4>
                      <Badge variant="outline">Basketball</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">Lakers advance to conference finals after game 7 thriller</p>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground">5 hours ago</span>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t bg-muted/30 justify-center py-3">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => navigate("/news")}
                  className="gap-1"
                >
                  Browse All News
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </CardFooter>
            </Card>
            
            {/* Community stats */}
            <Card className="border-0 shadow-md overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center">
                  <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                  Community Stats
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Active Users</span>
                    <span>8,742</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Predictions Today</span>
                    <span>384</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Win Rate (30d)</span>
                    <span className="text-emerald-600 dark:text-emerald-400">68.3%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Developer Tools */}
            {user && (
              <Card className="border-0 shadow-md overflow-hidden bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-950/30 dark:to-indigo-950/30">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-base flex items-center">
                      <Sparkles className="h-4 w-4 mr-2 text-blue-500" />
                      Developer Tools
                    </CardTitle>
                    <Badge variant="outline" className="bg-blue-100/80 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                      Test Only
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <Button 
                      onClick={handleSendTestNotification}
                      variant="outline" 
                      size="sm"
                      className="w-full flex justify-between items-center"
                    >
                      <span className="flex items-center">
                        <Bell className="mr-2 h-4 w-4" />
                        Send Test Notification
                      </span>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    
                    <Button 
                      onClick={() => showOnboarding()}
                      variant="outline" 
                      size="sm"
                      className="w-full flex justify-between items-center bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30"
                    >
                      <span className="flex items-center">
                        <Users className="mr-2 h-4 w-4" />
                        Launch Onboarding Flow
                      </span>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}