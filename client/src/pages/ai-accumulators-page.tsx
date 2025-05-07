import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import {
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle,
} from '@/components/ui/card';
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from '@/components/ui/tabs';
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  ScrollText, Search, Activity, AlertCircle, ArrowUpRight, 
  BookmarkIcon, Clock, Filter, ChevronDown, Sparkles,
  ChevronRight, RefreshCw, Zap, Trophy, TrendingUp,
  Rocket, Flame, Target, BarChart4, 
  CheckCircle2, XCircle, Percent, 
  Menu, PlusCircle, BellRing, ExternalLink,
  Calendar, ChevronLeft, Share2, Brain
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format, addDays, startOfDay, endOfDay, isToday, isPast, isFuture } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

// Import our custom components
import SmartAccumulatorBuilder from '@/components/accumulators/smart-accumulator-builder';
import AIConfidenceVisualizer from '@/components/accumulators/ai-confidence-visualizer';

// Custom icons for sports (since some might not be in Lucide)
interface IconProps {
  className?: string;
}

const FootballIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 2a10 10 0 1 0 10 10H12V2z" />
    <path d="M12 12 2.5 7.5" />
    <path d="m12 12 7.5 3" />
    <path d="m12 12 7.5-7.5" />
    <path d="m12 12-5 7.5" />
  </svg>
);

const BasketballIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10" />
    <path d="M4.9 4.9a19 19 0 0 1 14.2 14.2" />
    <path d="M19.1 19.1a19 19 0 0 1-14.2-14.2" />
    <path d="M12 2v20" />
    <path d="M2 12h20" />
  </svg>
);

const TennisIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10" />
    <path d="M18.2 7.2a10 10 0 0 0-14.4 0" />
    <path d="M18.2 16.8a10 10 0 0 1-14.4 0" />
    <path d="M2 12h20" />
  </svg>
);

const VolleyballIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 10a5 5 0 0 0 5 2" />
    <path d="M7 10a5 5 0 0 1 5-2" />
    <path d="M12 14a5 5 0 0 1-5 2" />
    <path d="M17 14a5 5 0 0 0-5 2" />
  </svg>
);

// Define interfaces for typesafety
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

interface Accumulator {
  id: string;
  name: string;
  description: string;
  selections: Prediction[];
  totalOdds: number | string;
  potentialReturn: string;
  confidence: number;
  stake: number;
  marketType: string;
  sport: string;
  icon: React.ReactNode;
  colorTheme: string;
  isRecommended?: boolean;
  tier?: string;
}

export default function AIAccumulatorsPage() {
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [riskLevel, setRiskLevel] = useState<'safe' | 'balanced' | 'risky' | 'high-risk' | 'ultra'>('balanced');
  const [filterSport, setFilterSport] = useState<string>('all');
  const [selectedTab, setSelectedTab] = useState<string>('recommended');
  const [date, setDate] = useState<Date>(new Date());
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [showCustomBuilder, setShowCustomBuilder] = useState(false);
  const [savedAccumulators, setSavedAccumulators] = useState<string[]>([]);
  const [activeFilterTab, setActiveFilterTab] = useState<'2x' | '5x' | '10x' | 'all'>('all');
  
  // Date handling
  const formattedDate = format(date, 'MMMM dd, yyyy');
  const isCurrentDate = isToday(date);
  
  // Fetch all accumulators package with different types from API
  const { 
    data: accumulatorsData, 
    isLoading: loadingAccumulators, 
    error: accumulatorsError, 
    refetch: refetchAccumulators 
  } = useQuery<any>({
    queryKey: ['/api/accumulators-package', { sport: filterSport, risk: riskLevel, date: format(date, 'yyyy-MM-dd') }],
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    refetchOnWindowFocus: false,
    retry: 1,
    retryDelay: 1000,
    enabled: true
  });
  
  // Process accumulators from API response
  const accumulators = React.useMemo(() => {
    if (!accumulatorsData) return [];
    
    // Color themes based on risk and sport
    const colorThemes = {
      safe: 'bg-green-50 border-green-200',
      balanced: 'bg-blue-50 border-blue-200',
      risky: 'bg-orange-50 border-orange-200',
      'high-risk': 'bg-red-50 border-red-200',
      ultra: 'bg-purple-50 border-purple-200',
    };
    
    // Icons based on sport
    const sportIcons = {
      Soccer: <FootballIcon className="h-5 w-5" />,
      Football: <FootballIcon className="h-5 w-5" />,
      Basketball: <BasketballIcon className="h-5 w-5" />,
      Tennis: <TennisIcon className="h-5 w-5" />,
      Volleyball: <VolleyballIcon className="h-5 w-5" />,
      Mixed: <Sparkles className="h-5 w-5" />
    };
    
    // Map AccumulatorType to marketType
    const marketTypeMap: Record<string, string> = {
      home_win_special: 'match_winner',
      value_finder: 'mixed',
      upset_special: 'match_winner',
      goals_galore: 'btts',
      goals_fiesta: 'over_under'
    };
    
    // Process all received accumulators
    const result: Accumulator[] = [];
    
    // Process byType data
    if (accumulatorsData.byType) {
      Object.entries(accumulatorsData.byType).forEach(([type, acc]: [string, any]) => {
        if (!acc) return;
        
        // Skip if no selections
        if (!acc.selections || acc.selections.length === 0) return;
        
        // Format selections
        const formattedSelections = acc.selections.map((selection: any) => ({
          id: selection.matchId,
          sport: acc.sport || 'Soccer',
          league: selection.league,
          homeTeam: selection.homeTeam,
          awayTeam: selection.awayTeam,
          startTime: selection.startTime,
          prediction: selection.selection,
          confidence: selection.confidence,
          odds: selection.odds,
          explanation: selection.explanation,
          status: 'pending'
        }));
        
        const stake = 10; // Default $10 stake
        
        // Determine tier based on odds
        const totalOdds = typeof acc.totalOdds === 'number' ? acc.totalOdds : parseFloat(acc.totalOdds);
        let tier = '';
        if (totalOdds <= 2.5) tier = '2x';
        else if (totalOdds <= 7.5) tier = '5x';
        else tier = '10x';
        
        result.push({
          id: acc.id,
          name: acc.name,
          description: acc.description,
          selections: formattedSelections,
          totalOdds: acc.totalOdds.toFixed(2),
          potentialReturn: `$${(totalOdds * stake).toFixed(2)}`,
          confidence: acc.confidence,
          stake,
          marketType: marketTypeMap[type] || 'mixed',
          sport: acc.sport || 'Soccer',
          icon: sportIcons[acc.sport as keyof typeof sportIcons] || sportIcons.Mixed,
          colorTheme: colorThemes[riskLevel as keyof typeof colorThemes],
          isRecommended: type === 'valueFinder' || type === 'homeWinSpecial' || type === 'weekendBanker' || type === 'longshotHero' || type === 'globalExplorer',
          tier
        });
      });
    }
    
    return result;
  }, [accumulatorsData, riskLevel]);
  
  // Filter accumulators based on active filter tab 
  const filteredAccumulators = React.useMemo(() => {
    if (activeFilterTab === 'all') return accumulators;
    return accumulators.filter(acc => acc.tier === activeFilterTab);
  }, [accumulators, activeFilterTab]);
  
  // Is accumulator data loading?
  const isLoading = loadingAccumulators;
  
  // Risk level options
  const riskLevels = [
    { value: 'safe', label: 'Safe (2x)', description: 'Lower risk, lower reward' },
    { value: 'balanced', label: 'Balanced (5x)', description: 'Moderate risk and reward' },
    { value: 'risky', label: 'Risky (10x)', description: 'Higher risk, higher reward' },
    { value: 'high-risk', label: 'High Risk (20x)', description: 'Very high risk and reward' },
    { value: 'ultra', label: 'Ultra (50x)', description: 'Extreme risk, extreme reward' },
  ];
  
  // Generate example sport-specific accumulators
  const sportFilters = [
    { value: 'all', label: 'All Sports', icon: <Activity className="h-4 w-4" /> },
    { value: 'football', label: 'Football', icon: <FootballIcon className="h-4 w-4" /> },
    { value: 'basketball', label: 'Basketball', icon: <BasketballIcon className="h-4 w-4" /> },
    { value: 'tennis', label: 'Tennis', icon: <TennisIcon className="h-4 w-4" /> },
    { value: 'volleyball', label: 'Volleyball', icon: <VolleyballIcon className="h-4 w-4" /> },
  ];
  
  const handleDateChange = (newDate: Date | undefined) => {
    if (newDate) {
      setDate(newDate);
      setCalendarOpen(false);
    }
  };
  
  const handlePreviousDay = () => {
    setDate(prevDate => addDays(prevDate, -1));
  };
  
  const handleNextDay = () => {
    setDate(prevDate => addDays(prevDate, 1));
  };
  
  const handleBookmarkAccumulator = (id: string) => {
    if (savedAccumulators.includes(id)) {
      setSavedAccumulators(prev => prev.filter(accId => accId !== id));
      toast({
        title: "Accumulator Removed",
        description: "The accumulator has been removed from your saved list.",
      });
    } else {
      setSavedAccumulators(prev => [...prev, id]);
      toast({
        title: "Accumulator Saved",
        description: "The accumulator has been added to your saved list.",
      });
    }
  };
  
  const handleSaveCustomAccumulator = (accumulator: any) => {
    toast({
      title: "Custom Accumulator Saved",
      description: "Your custom accumulator has been created successfully.",
    });
    
    setShowCustomBuilder(false);
    
    // In a real implementation, this would save to API and refetch
    setTimeout(() => {
      refetchAccumulators();
    }, 500);
  };
  
  return (
    <div className="container max-w-7xl mx-auto p-4 animate-in fade-in duration-300">
      <div className="flex flex-col space-y-6">
        {/* Header section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">AI Accumulator Builder</h1>
            <p className="text-muted-foreground">Build and optimize accumulators with AI-powered insights</p>
          </div>
          
          {/* Date selector & controls */}
          <div className="flex items-center space-x-2 bg-muted/40 p-1.5 rounded-lg">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={handlePreviousDay}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button 
                  variant={isCurrentDate ? "default" : "outline"} 
                  size="sm"
                  className={`flex items-center gap-2 ${isCurrentDate ? 'bg-primary text-primary-foreground' : ''}`}
                >
                  <Calendar className="h-3.5 w-3.5" />
                  {formattedDate}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <CalendarComponent
                  mode="single"
                  selected={date}
                  onSelect={handleDateChange}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            
            <Button 
              variant="ghost" 
              size="icon"
              onClick={handleNextDay}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Main tabs */}
        <Tabs 
          defaultValue="recommended" 
          className="w-full"
          onValueChange={setSelectedTab}
        >
          <div className="flex justify-between items-center border-b">
            <TabsList className="h-10">
              <TabsTrigger value="recommended" className="px-4">
                <Sparkles className="h-4 w-4 mr-2" />
                Recommended
              </TabsTrigger>
              <TabsTrigger value="saved" className="px-4">
                <BookmarkIcon className="h-4 w-4 mr-2" />
                Saved
              </TabsTrigger>
              <TabsTrigger value="custom" className="px-4">
                <Brain className="h-4 w-4 mr-2" />
                Smart Builder
              </TabsTrigger>
              <TabsTrigger value="all" className="px-4">
                <ScrollText className="h-4 w-4 mr-2" />
                All
              </TabsTrigger>
            </TabsList>
            
            {/* Filter controls */}
            <div className="flex items-center space-x-2">
              {/* Risk level selector */}
              <Select
                value={riskLevel}
                onValueChange={(value) => setRiskLevel(value as any)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select risk level" />
                </SelectTrigger>
                <SelectContent>
                  {riskLevels.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      <div className="flex flex-col">
                        <span>{level.label}</span>
                        <span className="text-xs text-muted-foreground">{level.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Sport filter dropdown */}
              <Select
                value={filterSport}
                onValueChange={setFilterSport}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Select sport" />
                </SelectTrigger>
                <SelectContent>
                  {sportFilters.map((sport) => (
                    <SelectItem key={sport.value} value={sport.value}>
                      <div className="flex items-center gap-2">
                        {sport.icon}
                        <span>{sport.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Quick filter tabs for odds tiers */}
          <div className="flex mt-4 gap-2 mb-4">
            <Button 
              variant={activeFilterTab === 'all' ? "default" : "outline"} 
              size="sm"
              onClick={() => setActiveFilterTab('all')}
              className="flex items-center gap-2"
            >
              <Activity className="h-4 w-4" />
              All Tiers
            </Button>
            <Button 
              variant={activeFilterTab === '2x' ? "default" : "outline"} 
              size="sm"
              onClick={() => setActiveFilterTab('2x')}
              className="flex items-center gap-2"
            >
              <Target className="h-4 w-4" />
              2 Odds (Safe)
            </Button>
            <Button 
              variant={activeFilterTab === '5x' ? "default" : "outline"} 
              size="sm"
              onClick={() => setActiveFilterTab('5x')}
              className="flex items-center gap-2"
            >
              <Flame className="h-4 w-4" />
              5 Odds (Mid)
            </Button>
            <Button 
              variant={activeFilterTab === '10x' ? "default" : "outline"} 
              size="sm"
              onClick={() => setActiveFilterTab('10x')}
              className="flex items-center gap-2"
            >
              <Rocket className="h-4 w-4" />
              10 Odds (High)
            </Button>
          </div>
          
          {/* Recommended Tab Content */}
          <TabsContent value="recommended" className="pt-4">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="overflow-hidden">
                    <CardHeader className="pb-3">
                      <Skeleton className="h-6 w-2/3" />
                      <Skeleton className="h-4 w-1/2" />
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <Skeleton className="h-20 w-full" />
                        <Skeleton className="h-20 w-full" />
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Skeleton className="h-9 w-full" />
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : accumulatorsError ? (
              <div className="text-center py-8">
                <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-4" />
                <h3 className="font-semibold text-lg mb-2">Failed to load accumulators</h3>
                <p className="text-muted-foreground max-w-md mx-auto mb-4">
                  We couldn't load the accumulator predictions. Please try again later.
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => refetchAccumulators()}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
              </div>
            ) : filteredAccumulators.filter(acc => acc.isRecommended).length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="h-10 w-10 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="font-semibold text-lg mb-2">No recommended accumulators found</h3>
                <p className="text-muted-foreground max-w-md mx-auto mb-4">
                  Try changing the date, risk level, or sport filter to see more options.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredAccumulators
                  .filter(acc => acc.isRecommended)
                  .map((accumulator) => (
                    <AccumulatorCard 
                      key={accumulator.id} 
                      accumulator={accumulator}
                      isSaved={savedAccumulators.includes(accumulator.id)}
                      onBookmark={() => handleBookmarkAccumulator(accumulator.id)}
                    />
                  ))}
              </div>
            )}
          </TabsContent>
          
          {/* Saved Tab Content */}
          <TabsContent value="saved" className="pt-4">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2].map((i) => (
                  <Card key={i} className="overflow-hidden">
                    <CardHeader className="pb-3">
                      <Skeleton className="h-6 w-2/3" />
                      <Skeleton className="h-4 w-1/2" />
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <Skeleton className="h-20 w-full" />
                        <Skeleton className="h-20 w-full" />
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Skeleton className="h-9 w-full" />
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : savedAccumulators.length === 0 ? (
              <div className="text-center py-8">
                <BookmarkIcon className="h-10 w-10 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="font-semibold text-lg mb-2">No saved accumulators</h3>
                <p className="text-muted-foreground max-w-md mx-auto mb-4">
                  Bookmark your favorite accumulators to save them for later.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredAccumulators
                  .filter(acc => savedAccumulators.includes(acc.id))
                  .map((accumulator) => (
                    <AccumulatorCard 
                      key={accumulator.id} 
                      accumulator={accumulator} 
                      isSaved={true}
                      onBookmark={() => handleBookmarkAccumulator(accumulator.id)}
                    />
                  ))}
              </div>
            )}
          </TabsContent>
          
          {/* Smart Builder Tab Content */}
          <TabsContent value="custom" className="pt-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <SmartAccumulatorBuilder
                  onSaveAccumulator={handleSaveCustomAccumulator}
                  riskLevel={riskLevel} 
                  sportFilter={filterSport}
                />
              </div>
              
              <div className="space-y-6">
                <Card>
                  <CardHeader className="pb-3 border-b bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/40 dark:to-green-900/20">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-normal">AI-Powered</Badge>
                      <Badge variant="secondary">New</Badge>
                    </div>
                    <CardTitle className="mt-1">Smart Accumulator Features</CardTitle>
                    <CardDescription>
                      Build better accumulators with artificial intelligence
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <ul className="space-y-3">
                      <li className="flex gap-3">
                        <div className="flex-shrink-0 h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                          <Brain className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">AI Confidence Analysis</p>
                          <p className="text-xs text-muted-foreground">Get detailed confidence breakdowns and insights</p>
                        </div>
                      </li>
                      <li className="flex gap-3">
                        <div className="flex-shrink-0 h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                          <Zap className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Smart Selection Optimization</p>
                          <p className="text-xs text-muted-foreground">Our AI finds the most compatible selections</p>
                        </div>
                      </li>
                      <li className="flex gap-3">
                        <div className="flex-shrink-0 h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                          <Target className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Value Bet Detection</p>
                          <p className="text-xs text-muted-foreground">Find edges where bookmaker odds don't match true probabilities</p>
                        </div>
                      </li>
                      <li className="flex gap-3">
                        <div className="flex-shrink-0 h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                          <BarChart4 className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Risk Assessment</p>
                          <p className="text-xs text-muted-foreground">Advanced risk modeling based on historical data</p>
                        </div>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
                
                {/* Example Confidence Analysis */}
                <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/50 dark:to-slate-900/20 rounded-lg p-4 border">
                  <h3 className="text-sm font-medium mb-3">Example AI Analysis</h3>
                  <AIConfidenceVisualizer
                    overallConfidence={78}
                    factors={[
                      {
                        label: 'Selection Quality',
                        value: 85,
                        icon: <Target className="h-3.5 w-3.5 text-blue-500" />,
                        description: 'The average confidence score of individual selections.'
                      },
                      {
                        label: 'Odds Risk',
                        value: 68,
                        icon: <Percent className="h-3.5 w-3.5 text-violet-500" />,
                        description: 'How the total odds impact probability of success.'
                      },
                      {
                        label: 'Size Risk',
                        value: 72,
                        icon: <BarChart4 className="h-3.5 w-3.5 text-amber-500" />,
                        description: 'The risk associated with the number of selections.'
                      },
                      {
                        label: 'Compatibility',
                        value: 81,
                        icon: <Zap className="h-3.5 w-3.5 text-emerald-500" />,
                        description: 'How well the selections work together based on AI analysis.'
                      }
                    ]}
                  />
                </div>
              </div>
            </div>
          </TabsContent>
          
          {/* All Tab Content */}
          <TabsContent value="all" className="pt-4">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i} className="overflow-hidden">
                    <CardHeader className="pb-3">
                      <Skeleton className="h-6 w-2/3" />
                      <Skeleton className="h-4 w-1/2" />
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <Skeleton className="h-20 w-full" />
                        <Skeleton className="h-20 w-full" />
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Skeleton className="h-9 w-full" />
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : filteredAccumulators.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="h-10 w-10 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="font-semibold text-lg mb-2">No accumulators found</h3>
                <p className="text-muted-foreground max-w-md mx-auto mb-4">
                  Try changing the date, risk level, or sport filter to see more options.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredAccumulators.map((accumulator) => (
                  <AccumulatorCard 
                    key={accumulator.id} 
                    accumulator={accumulator}
                    isSaved={savedAccumulators.includes(accumulator.id)}
                    onBookmark={() => handleBookmarkAccumulator(accumulator.id)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

interface AccumulatorCardProps {
  accumulator: Accumulator;
  isSaved: boolean;
  onBookmark: () => void;
}

function AccumulatorCard({ 
  accumulator,
  isSaved,
  onBookmark
}: AccumulatorCardProps) {
  const { toast } = useToast();
  const [selectionDialogOpen, setSelectionDialogOpen] = useState(false);
  
  // Get color theme based on sport or risk level
  const colorMap: Record<string, string> = {
    football: 'from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40',
    basketball: 'from-orange-50 to-red-50 dark:from-orange-950/40 dark:to-red-950/40',
    tennis: 'from-green-50 to-emerald-50 dark:from-green-950/40 dark:to-emerald-950/40',
    volleyball: 'from-purple-50 to-fuchsia-50 dark:from-purple-950/40 dark:to-fuchsia-950/40',
  };
  
  const gradientClass = colorMap[accumulator.sport.toLowerCase()] || 'from-slate-50 to-gray-50 dark:from-slate-950/40 dark:to-gray-950/40';
  
  // Calculate badge color based on confidence
  const getConfidenceBadgeColor = (confidence: number) => {
    if (confidence >= 80) return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300';
    if (confidence >= 65) return 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300';
    return 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300';
  };
  
  const getTierBadgeColor = (tier: string | undefined) => {
    if (tier === '2x') return 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300';
    if (tier === '5x') return 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300';
    if (tier === '10x') return 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300';
    return 'bg-slate-100 text-slate-700 dark:bg-slate-900/50 dark:text-slate-300';
  };
  
  return (
    <Card className="overflow-hidden border hover:shadow-md transition-all duration-200 flex flex-col">
      <CardHeader className={`pb-3 bg-gradient-to-br ${gradientClass} border-b`}>
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            {accumulator.icon}
            <div>
              <h3 className="text-sm font-medium">{accumulator.name}</h3>
              <p className="text-xs text-muted-foreground">{accumulator.description || 'AI-Generated Accumulator'}</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            className="h-7 w-7"
            onClick={(e) => {
              e.stopPropagation();
              onBookmark();
            }}
          >
            <BookmarkIcon className={`h-4 w-4 ${isSaved ? 'fill-primary' : ''}`} />
          </Button>
        </div>
        
        <div className="flex gap-2 mt-2">
          <Badge variant="secondary">
            {accumulator.selections.length}-Fold
          </Badge>
          
          {accumulator.tier && (
            <Badge className={getTierBadgeColor(accumulator.tier)}>
              {accumulator.tier} Odds
            </Badge>
          )}
          
          <Badge variant="outline" className={getConfidenceBadgeColor(accumulator.confidence)}>
            {accumulator.confidence}% Confidence
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="py-4 flex-grow">
        <div className="space-y-3">
          {/* Only show first 3 selections, with a count of remaining */}
          {accumulator.selections.slice(0, 3).map((selection, index) => (
            <div key={index} className="flex items-center justify-between text-sm border-b pb-2">
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground">{selection.league}</span>
                <span className="font-medium">{selection.homeTeam} vs {selection.awayTeam}</span>
                <div className="text-xs mt-0.5">
                  <span className="text-muted-foreground">
                    {new Date(selection.startTime).toLocaleString(undefined, { 
                      month: 'short', 
                      day: 'numeric', 
                      hour: 'numeric', 
                      minute: '2-digit' 
                    })}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <Badge variant="outline" className="font-normal">
                  {selection.prediction}
                </Badge>
                <div className="flex items-center justify-end mt-1">
                  <span className="text-xs font-medium mr-1">@</span>
                  <Badge variant="secondary">{selection.odds}</Badge>
                </div>
              </div>
            </div>
          ))}
          
          {accumulator.selections.length > 3 && (
            <div className="text-center">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs"
                onClick={() => setSelectionDialogOpen(true)}
              >
                +{accumulator.selections.length - 3} more selections
              </Button>
            </div>
          )}
          
          <div className="flex justify-between pt-2">
            <div>
              <div className="text-xs text-muted-foreground">Total Odds</div>
              <div className="font-semibold">{accumulator.totalOdds}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Potential Return</div>
              <div className="font-semibold">{accumulator.potentialReturn}</div>
            </div>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="pt-0">
        <Button 
          className="w-full gap-1"
          onClick={() => {
            toast({
              title: "Bet Added",
              description: "The accumulator has been added to your bet slip.",
            });
          }}
        >
          <PlusCircle className="h-4 w-4" />
          Add to Bet Slip
        </Button>
      </CardFooter>
      
      {/* Dialog to show all selections */}
      <Dialog open={selectionDialogOpen} onOpenChange={setSelectionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{accumulator.name} Selections</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2 max-h-[60vh] overflow-y-auto">
            {accumulator.selections.map((selection, index) => (
              <div key={index} className="flex items-center justify-between text-sm border-b pb-3">
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground">{selection.league}</span>
                  <span className="font-medium">{selection.homeTeam} vs {selection.awayTeam}</span>
                  <div className="flex items-center mt-1">
                    <Clock className="h-3 w-3 mr-1 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {new Date(selection.startTime).toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant="outline" className="font-normal mb-1">
                    {selection.prediction}
                  </Badge>
                  <div className="flex items-center justify-end">
                    <Badge variant="secondary">{selection.odds}</Badge>
                  </div>
                  <div className="flex items-center justify-end mt-1">
                    <Badge className={getConfidenceBadgeColor(selection.confidence)} variant="outline">
                      {selection.confidence}%
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between border-t pt-3 mt-3">
            <div>
              <div className="text-xs text-muted-foreground">Total Odds</div>
              <div className="font-semibold">{accumulator.totalOdds}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Potential Return</div>
              <div className="font-semibold">{accumulator.potentialReturn}</div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}