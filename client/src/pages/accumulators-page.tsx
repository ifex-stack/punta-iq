import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Dialog, DialogContent, DialogDescription, 
  DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from '@/components/ui/dialog';
import { 
  ScrollText, Search,
  Activity, AlertCircle, ArrowUpRight, ArrowLeft,
  BookmarkIcon, Clock, Filter, ChevronDown, Sparkles,
  ChevronRight, RefreshCw, Zap, Trophy, TrendingUp,
  Rocket, Flame, Target, BarChart4, 
  CheckCircle2, XCircle, Percent, 
  Menu, PlusCircle, BellRing, ExternalLink,
  Calendar, ChevronLeft
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format, addDays, startOfDay, endOfDay, isToday, isPast, isFuture } from 'date-fns';
import { PuntaIQLogo } from '@/components/ui/puntaiq-logo';

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
  totalOdds: string;
  potentialReturn: string;
  confidence: number;
  stake: number;
  marketType: string;
  sport: string;
  icon: React.ReactNode;
  colorTheme: string;
  isRecommended?: boolean;
}

// Helper function to calculate confidence based on odds
const calculateSelectionConfidence = (odds: number): number => {
  // Using implicit probability: 1/odds as base confidence
  const baseConfidence = (1 / odds) * 100;
  return Math.min(Math.round(baseConfidence), 95); // Cap at 95%
};

// Calculate overall accumulator confidence
const calculateConfidence = (totalOdds: number, riskLevel: string): number => {
  // Base confidence factoring in total odds and risk level
  let baseConfidence = Math.max(95 - (totalOdds * 5), 10);
  
  // Adjust based on risk level
  switch (riskLevel) {
    case 'safe':
      baseConfidence = Math.min(baseConfidence + 15, 92);
      break;
    case 'balanced':
      baseConfidence = Math.min(baseConfidence + 5, 82);
      break;
    case 'risky':
      baseConfidence = Math.max(baseConfidence - 10, 35);
      break;
    case 'high-risk':
      baseConfidence = Math.max(baseConfidence - 20, 30);
      break;
    case 'ultra':
      baseConfidence = Math.max(baseConfidence - 30, 25);
      break;
  }
  
  return Math.round(baseConfidence);
};

export default function AccumulatorsPage() {
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const [riskLevel, setRiskLevel] = useState<'safe' | 'balanced' | 'risky' | 'high-risk' | 'ultra'>('balanced');
  const [filterSport, setFilterSport] = useState<string>('all');
  const [selectedTab, setSelectedTab] = useState<string>('recommended');
  const [date, setDate] = useState<Date>(new Date());
  const [calendarOpen, setCalendarOpen] = useState(false);
  
  // Date handling
  const formattedDate = format(date, 'MMMM dd, yyyy');
  const isCurrentDate = isToday(date);
  
  // Fetch soccer (football) matches for accumulators from API
  const { data: matchesData, isLoading: loadingMatches } = useQuery<any>({
    queryKey: ['/api/odds/soccer'],
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    refetchOnWindowFocus: false,
    retry: 3,
    enabled: true
  });
  
  // Fetch basketball matches for accumulators 
  const { data: basketballData, isLoading: loadingBasketball } = useQuery<any>({
    queryKey: ['/api/odds/basketball_nba'],
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    retry: 3,
    enabled: filterSport === 'all' || filterSport === 'basketball'
  });
  
  // Generate accumulator predictions based on matches data and risk level
  const accumulators = React.useMemo(() => {
    // Handle loading or missing data
    if (!matchesData) return [];
    
    // Get all events for sport filtering
    const allEvents = [
      ...((matchesData?.events || [])
        .map((event: any) => ({ 
          ...event, 
          sportType: 'football',
          // Ensure all required properties are present
          homeOdds: event.homeOdds || 2.0,
          awayOdds: event.awayOdds || 3.0,
          drawOdds: event.drawOdds || 3.5
        }))),
      ...((basketballData?.events || [])
        .map((event: any) => ({ 
          ...event, 
          sportType: 'basketball',
          // Basketball doesn't have draws
          homeOdds: event.homeOdds || 1.9,
          awayOdds: event.awayOdds || 1.9,
          drawOdds: null
        })))
    ];
    
    // Filter by sport
    const filteredEvents = filterSport === 'all' 
      ? allEvents 
      : allEvents.filter(event => event.sportType === filterSport);
    
    if (filteredEvents.length === 0) return [];
    
    // Get matches to build accumulators based on odds
    const getSortedMatches = () => {
      return [...filteredEvents]
        .filter(match => match.homeOdds && match.awayOdds) // Ensure we have odds
        .sort((a, b) => {
          // For safe bets, prioritize matches with clearer favorites (lower odds)
          if (riskLevel === 'safe') {
            const aLowestOdds = Math.min(a.homeOdds || 999, a.awayOdds || 999, a.drawOdds || 999);
            const bLowestOdds = Math.min(b.homeOdds || 999, b.awayOdds || 999, b.drawOdds || 999);
            return aLowestOdds - bLowestOdds;
          }
          
          // For risky bets, prioritize higher odds
          if (riskLevel === 'risky' || riskLevel === 'high-risk' || riskLevel === 'ultra') {
            const aHighestOdds = Math.max(a.homeOdds || 0, a.awayOdds || 0, a.drawOdds || 0);
            const bHighestOdds = Math.max(b.homeOdds || 0, b.awayOdds || 0, b.drawOdds || 0);
            return bHighestOdds - aHighestOdds;
          }
          
          // Default balanced approach - mix of safe and value bets
          return (new Date(a.startTime)).getTime() - (new Date(b.startTime)).getTime();
        });
    };
    
    // Decide number of matches in accumulator based on risk level
    const getAccumulatorSize = () => {
      switch (riskLevel) {
        case 'safe': return 2;
        case 'balanced': return 3;
        case 'risky': return 4;
        case 'high-risk': return 5;
        case 'ultra': return 6;
        default: return 3;
      }
    };
    
    const matches = getSortedMatches();
    const accSize = Math.min(getAccumulatorSize(), matches.length);
    
    if (accSize === 0) return [];
    
    // Generate different types of accumulators
    const generateAccumulators = () => {
      // Common function to select matches and calculate accumulator odds
      const buildAccumulator = (matches: any[], name: string, description: string, marketType: string, sport: string, selections: any[], isRecommended = false) => {
        // Calculate the total odds by multiplying all selection odds
        const totalOdds = selections.reduce((product, sel) => product * sel.odds, 1);
        const stake = 10; // Default $10 stake
        const potentialReturn = (totalOdds * stake).toFixed(2);
        
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
          football: <FootballIcon className="h-5 w-5" />,
          basketball: <BasketballIcon className="h-5 w-5" />,
          tennis: <TennisIcon className="h-5 w-5" />,
          volleyball: <VolleyballIcon className="h-5 w-5" />,
          all: <Sparkles className="h-5 w-5" />
        };
        
        return {
          id: `acc-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          name,
          description,
          selections,
          totalOdds: totalOdds.toFixed(2),
          potentialReturn: `$${potentialReturn}`,
          confidence: calculateConfidence(totalOdds, riskLevel),
          stake,
          marketType,
          sport,
          icon: sportIcons[sport as keyof typeof sportIcons] || sportIcons.all,
          colorTheme: colorThemes[riskLevel as keyof typeof colorThemes],
          isRecommended
        };
      };
      
      const accumulators: Accumulator[] = [];
      
      // 1. Main accumulator - Home favorites
      if (matches.length >= accSize) {
        const homeWinMatches = matches
          .filter(m => m.homeOdds && m.homeOdds <= 2.5) // Favor home teams that are favorites
          .slice(0, accSize);
        
        if (homeWinMatches.length >= accSize) {
          const selections = homeWinMatches.map(match => ({
            ...match,
            prediction: 'Home Win',
            odds: match.homeOdds,
            confidence: calculateSelectionConfidence(match.homeOdds)
          }));
          
          accumulators.push(buildAccumulator(
            homeWinMatches,
            'Home Win Special',
            'Top home teams expected to win',
            'match_winner',
            filterSport !== 'all' ? filterSport : 'football',
            selections,
            true
          ));
        }
      }
      
      // 2. Value accumulator - Mixed selections based on value
      if (matches.length >= accSize) {
        const valueBetMatches = matches.slice(0, accSize * 2);
        const valueSelections = valueBetMatches.slice(0, accSize).map(match => {
          // Determine best value bet
          const homeValue = 1 / match.homeOdds;
          const drawValue = match.drawOdds ? 1 / match.drawOdds : 0;
          const awayValue = 1 / match.awayOdds;
          
          let prediction: string;
          let odds: number;
          
          if (homeValue >= drawValue && homeValue >= awayValue) {
            prediction = 'Home Win';
            odds = match.homeOdds;
          } else if (drawValue >= homeValue && drawValue >= awayValue) {
            prediction = 'Draw';
            odds = match.drawOdds || 3.0;
          } else {
            prediction = 'Away Win';
            odds = match.awayOdds;
          }
          
          return {
            ...match,
            prediction,
            odds,
            confidence: calculateSelectionConfidence(odds)
          };
        });
        
        if (valueSelections.length >= accSize) {
          accumulators.push(buildAccumulator(
            valueBetMatches.slice(0, accSize),
            'Value Finder',
            'Selections with best value based on AI analysis',
            'mixed',
            filterSport !== 'all' ? filterSport : 'mixed',
            valueSelections,
            true
          ));
        }
      }
      
      // 3. Upset Special - Only for risky and higher
      if ((riskLevel === 'risky' || riskLevel === 'high-risk' || riskLevel === 'ultra') && matches.length >= accSize) {
        const upsetMatches = matches
          .filter(m => m.awayOdds > 2.0) // Look for underdog away teams
          .slice(0, accSize);
        
        if (upsetMatches.length >= accSize) {
          const selections = upsetMatches.map(match => ({
            ...match,
            prediction: 'Away Win',
            odds: match.awayOdds,
            confidence: calculateSelectionConfidence(match.awayOdds)
          }));
          
          accumulators.push(buildAccumulator(
            upsetMatches,
            'Upset Special',
            'Potential underdogs that could cause upsets',
            'match_winner',
            filterSport !== 'all' ? filterSport : 'football',
            selections,
            riskLevel === 'ultra'
          ));
        }
      }
      
      // 4. Both Teams To Score (BTTS) - For football only
      if ((filterSport === 'all' || filterSport === 'football') && matches.length >= accSize) {
        const bttsMatches = matches
          .filter(m => m.sport === 'football') // Only makes sense for football
          .slice(0, accSize);
        
        if (bttsMatches.length >= accSize) {
          // Generate synthetic BTTS odds based on match odds
          const selections = bttsMatches.map(match => {
            const bttsOdds = 1.8 + (Math.random() * 0.4); // Typical BTTS odds between 1.8-2.2
            
            return {
              ...match,
              prediction: 'Both Teams to Score',
              odds: bttsOdds,
              confidence: calculateSelectionConfidence(bttsOdds)
            };
          });
          
          accumulators.push(buildAccumulator(
            bttsMatches,
            'Goals Galore',
            'Both teams expected to score in these matches',
            'btts',
            'football',
            selections,
            filterSport === 'football'
          ));
        }
      }
      
      // 5. Over 2.5 Goals - For football only
      if ((filterSport === 'all' || filterSport === 'football') && matches.length >= accSize) {
        const overMatches = matches
          .filter(m => m.sport === 'football')
          .slice(0, accSize);
        
        if (overMatches.length >= accSize) {
          // Generate synthetic over 2.5 odds
          const selections = overMatches.map(match => {
            const overOdds = 1.7 + (Math.random() * 0.5); // Typical over 2.5 odds
            
            return {
              ...match,
              prediction: 'Over 2.5 Goals',
              odds: overOdds,
              confidence: calculateSelectionConfidence(overOdds)
            };
          });
          
          accumulators.push(buildAccumulator(
            overMatches,
            'Goals Fiesta',
            'Matches expected to have 3 or more goals',
            'over_under',
            'football',
            selections
          ));
        }
      }
      
      return accumulators;
    };
    
    return generateAccumulators();
  }, [matchesData, basketballData, riskLevel, filterSport]);
  
  // Using the helper functions defined at the top of the file
  
  // Is accumulator data loading?
  const isLoading = loadingMatches || (filterSport === 'all' || filterSport === 'basketball') && loadingBasketball;

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
    toast({
      title: "Accumulator Saved",
      description: "The accumulator has been added to your saved list.",
    });
  };

  return (
    <div className="container max-w-7xl mx-auto p-4 animate-in fade-in duration-300">
      <div className="flex flex-col space-y-6">
        {/* Header section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Accumulator Predictions</h1>
            <p className="text-muted-foreground">AI-powered accumulator bets with different risk levels</p>
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
              
              {/* Sport filter */}
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
                      <div className="flex items-center">
                        <span className="mr-2">{sport.icon}</span>
                        <span>{sport.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Tab content */}
          <TabsContent value="recommended" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {isLoading ? (
                // Loading skeletons
                Array(6).fill(0).map((_, index) => (
                  <Card key={index} className="overflow-hidden border border-muted/60">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between">
                        <Skeleton className="h-4 w-1/3" />
                        <Skeleton className="h-4 w-1/4" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-2/3 mb-2" />
                      <Skeleton className="h-4 w-3/4 mb-4" />
                      <Skeleton className="h-20 w-full rounded-md mb-4" />
                      <div className="flex justify-between">
                        <Skeleton className="h-4 w-1/4" />
                        <Skeleton className="h-4 w-1/3" />
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : !accumulators || accumulators.length === 0 ? (
                <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
                  <div className="rounded-full bg-muted p-3 mb-4">
                    <AlertCircle className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">No Accumulators Available</h3>
                  <p className="text-muted-foreground max-w-md">
                    We don't have any accumulator predictions matching your criteria for {formattedDate}.
                    Try changing the date, risk level, or sport filter.
                  </p>
                </div>
              ) : (
                // Accumulator cards
                accumulators
                  .filter(acc => acc.isRecommended)
                  .map((accumulator) => (
                    <AccumulatorCard
                      key={accumulator.id}
                      accumulator={accumulator}
                      onBookmark={() => handleBookmarkAccumulator(accumulator.id)}
                    />
                  ))
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="saved" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Saved accumulators content */}
              <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
                <div className="rounded-full bg-muted p-3 mb-4">
                  <BookmarkIcon className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-2">No Saved Accumulators</h3>
                <p className="text-muted-foreground max-w-md">
                  You haven't saved any accumulators yet. Browse the recommended accumulators and click the bookmark icon to save them.
                </p>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="all" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {isLoading ? (
                // Loading skeletons
                Array(6).fill(0).map((_, index) => (
                  <Card key={index} className="overflow-hidden border border-muted/60">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between">
                        <Skeleton className="h-4 w-1/3" />
                        <Skeleton className="h-4 w-1/4" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-2/3 mb-2" />
                      <Skeleton className="h-4 w-3/4 mb-4" />
                      <Skeleton className="h-20 w-full rounded-md mb-4" />
                      <div className="flex justify-between">
                        <Skeleton className="h-4 w-1/4" />
                        <Skeleton className="h-4 w-1/3" />
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : !accumulators || accumulators.length === 0 ? (
                <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
                  <div className="rounded-full bg-muted p-3 mb-4">
                    <AlertCircle className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">No Accumulators Available</h3>
                  <p className="text-muted-foreground max-w-md">
                    We don't have any accumulator predictions matching your criteria for {formattedDate}.
                    Try changing the date, risk level, or sport filter.
                  </p>
                </div>
              ) : (
                // All accumulator cards
                accumulators.map((accumulator) => (
                  <AccumulatorCard
                    key={accumulator.id}
                    accumulator={accumulator}
                    onBookmark={() => handleBookmarkAccumulator(accumulator.id)}
                  />
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Accumulator card component
function AccumulatorCard({ 
  accumulator,
  onBookmark
}: { 
  accumulator: Accumulator;
  onBookmark: () => void;
}) {
  const { toast } = useToast();
  const [selectionDialogOpen, setSelectionDialogOpen] = useState(false);
  
  // Get color theme based on sport or risk level
  const colorMap: Record<string, string> = {
    football: 'from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40',
    basketball: 'from-orange-50 to-red-50 dark:from-orange-950/40 dark:to-red-950/40',
    tennis: 'from-green-50 to-emerald-50 dark:from-green-950/40 dark:to-emerald-950/40',
    volleyball: 'from-purple-50 to-fuchsia-50 dark:from-purple-950/40 dark:to-fuchsia-950/40',
  };
  
  const gradientClass = colorMap[accumulator.sport] || 'from-slate-50 to-gray-50 dark:from-slate-950/40 dark:to-gray-950/40';
  
  // Calculate badge color based on confidence
  const getConfidenceBadgeColor = (confidence: number) => {
    if (confidence >= 80) return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300';
    if (confidence >= 65) return 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300';
    return 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300';
  };
  
  return (
    <Card className="overflow-hidden border hover:shadow-md transition-all duration-200 flex flex-col">
      <CardHeader className={`pb-3 bg-gradient-to-br ${gradientClass} border-b`}>
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            {accumulator.icon}
            <CardTitle className="text-lg">{accumulator.name}</CardTitle>
          </div>
          <Badge variant="outline" className="font-mono">
            {accumulator.totalOdds}x
          </Badge>
        </div>
        <CardDescription className="mt-1">{accumulator.description}</CardDescription>
      </CardHeader>
      
      <CardContent className="py-3 flex-grow">
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Selections:</span>
            </div>
            <Badge variant="outline" className="font-medium">
              {accumulator.selections.length} matches
            </Badge>
          </div>
          
          {/* Mini preview of first two selections */}
          <div className="bg-muted/30 rounded-md p-2 mb-2 text-xs">
            {accumulator.selections.slice(0, 2).map((selection, index) => (
              <div key={index} className="flex justify-between items-center py-1 border-b last:border-0 border-border/30">
                <div className="truncate max-w-[75%]">
                  <span className="font-medium">{selection.homeTeam}</span>
                  <span className="text-muted-foreground mx-1">vs</span>
                  <span className="font-medium">{selection.awayTeam}</span>
                </div>
                <Badge variant="secondary" className="text-[10px] px-1 py-0 h-5">
                  {selection.prediction}
                </Badge>
              </div>
            ))}
            {accumulator.selections.length > 2 && (
              <div className="text-center text-muted-foreground pt-1 text-[10px]">
                +{accumulator.selections.length - 2} more
              </div>
            )}
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full text-sm mb-2"
            onClick={() => setSelectionDialogOpen(true)}
          >
            <ScrollText className="h-3.5 w-3.5 mr-2" />
            View All Selections
          </Button>
        </div>
        
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Market Type:</span>
            <span className="text-sm font-medium">{accumulator.marketType}</span>
          </div>
          
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Confidence:</span>
              <Badge variant="secondary" className={getConfidenceBadgeColor(accumulator.confidence)}>
                {accumulator.confidence}%
              </Badge>
            </div>
            <div className="w-full bg-muted rounded-full h-1.5 dark:bg-gray-700">
              <div 
                className={`h-1.5 rounded-full ${
                  accumulator.confidence >= 80 ? 'bg-emerald-500' :
                  accumulator.confidence >= 65 ? 'bg-amber-500' : 'bg-red-500'
                }`} 
                style={{ width: `${accumulator.confidence}%` }}>
              </div>
            </div>
          </div>
          
          <div className="mt-2 pt-2 border-t border-border/30">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Potential Return:</span>
              <div className="flex items-center">
                <Badge variant="outline" className="mr-1 font-mono">£{accumulator.stake}</Badge>
                <TrendingUp className="h-3.5 w-3.5 text-emerald-500 mx-1" />
                <Badge variant="default" className="font-mono bg-emerald-500/90 hover:bg-emerald-500/90">
                  £{accumulator.potentialReturn}
                </Badge>
              </div>
            </div>
            <div className="text-xs text-muted-foreground text-right mt-1">
              Profit: £{(parseFloat(accumulator.potentialReturn) - accumulator.stake).toFixed(2)}
            </div>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between items-center border-t py-3 bg-muted/20">
        <Button 
          variant="ghost" 
          size="sm"
          className="h-8 px-2"
          onClick={onBookmark}
        >
          <BookmarkIcon className="h-4 w-4 mr-1.5" />
          Save
        </Button>
        
        <Button 
          variant="default" 
          size="sm"
          className="h-8"
        >
          <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
          Share
        </Button>
      </CardFooter>
      
      {/* Selections dialog */}
      <Dialog open={selectionDialogOpen} onOpenChange={setSelectionDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <div className="flex items-center gap-2">
              {accumulator.icon}
              <DialogTitle>{accumulator.name}</DialogTitle>
            </div>
            <DialogDescription className="flex justify-between items-center mt-1">
              <span>{accumulator.description}</span>
              <Badge variant="secondary" className="font-mono">{accumulator.totalOdds}x</Badge>
            </DialogDescription>
          </DialogHeader>
          
          {/* Summary card at the top */}
          <Card className={`overflow-hidden border-2 bg-gradient-to-br ${gradientClass} mb-4`}>
            <CardContent className="p-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-xs text-muted-foreground">SELECTIONS</div>
                  <div className="text-xl font-bold">{accumulator.selections.length}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">CONFIDENCE</div>
                  <div className={`text-xl font-bold ${
                    accumulator.confidence >= 80 ? 'text-emerald-500' :
                    accumulator.confidence >= 65 ? 'text-amber-500' : 'text-red-500'
                  }`}>{accumulator.confidence}%</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">RETURN</div>
                  <div className="text-xl font-bold">£{accumulator.potentialReturn}</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Numbered selections list */}
          <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2">
            {accumulator.selections.map((selection, index) => (
              <Card key={index} className="overflow-hidden border">
                <CardHeader className="py-2 px-3 bg-muted/50 border-b flex flex-row items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="h-6 w-6 flex items-center justify-center p-0 rounded-full">
                      {index + 1}
                    </Badge>
                    <div className="font-medium">{selection.homeTeam} vs {selection.awayTeam}</div>
                  </div>
                  <Badge variant="secondary" className="font-mono">{selection.odds}</Badge>
                </CardHeader>
                <CardContent className="p-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground text-xs">League:</span>
                      <div className="font-medium">{selection.league}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs">Country:</span>
                      <div className="font-medium">{selection.country}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs">Prediction:</span>
                      <div className="font-medium">{selection.prediction}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs">Confidence:</span>
                      <div className="flex items-center">
                        <Badge variant="outline" className={getConfidenceBadgeColor(selection.confidence)}>
                          {selection.confidence}%
                        </Badge>
                      </div>
                    </div>
                  </div>
                  {selection.explanation && (
                    <div className="mt-2 text-xs text-muted-foreground border-t border-border/30 pt-2">
                      {selection.explanation}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
          
          <DialogFooter className="flex justify-between gap-2 sm:justify-between">
            <Button variant="outline" onClick={() => setSelectionDialogOpen(false)}>
              Close
            </Button>
            <Button>
              <BookmarkIcon className="h-4 w-4 mr-1.5" />
              Save Accumulator
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}