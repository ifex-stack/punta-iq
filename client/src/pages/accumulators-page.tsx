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
    <path d="M12 2a10 10 0 0 0-6.88 17.23l.73-.73a10 10 0 0 1 12.3 0l.73.73A10 10 0 0 0 12 2Z" />
    <path d="M12 22a10 10 0 0 0 6.88-17.23l-.73.73a10 10 0 0 1-12.3 0l-.73-.73A10 10 0 0 0 12 22Z" />
  </svg>
);

const Basketball: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10" />
    <path d="M4.93 4.93 19.07 19.07" />
    <path d="M4.93 19.07 19.07 4.93" />
    <path d="M12 2a10 10 0 0 1 0 20" />
    <path d="M12 22a10 10 0 0 1 0-20" />
  </svg>
);

const Tennis: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10" />
    <path d="M18 6a5 5 0 0 1-5 5 5 5 0 0 1-5-5 5 5 0 0 1 5-5 5 5 0 0 1 5 5Z" />
    <path d="M6 18a5 5 0 0 1 5-5 5 5 0 0 1 5 5 5 5 0 0 1-5 5 5 5 0 0 1-5-5Z" />
  </svg>
);

const Volleyball: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 12a5 5 0 0 0 5 5" />
    <path d="M9 6.5a5 5 0 0 1 7.5 1.5" />
    <path d="M7.5 12a4.95 4.95 0 0 1-1.5-3.5" />
  </svg>
);

const Gamepad2: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="2" y="6" width="20" height="12" rx="2" />
    <path d="M12 12h.01" />
    <path d="M7 12h.01" />
    <path d="M17 12h.01" />
    <path d="M7 8v2" />
    <path d="M6 9h2" />
  </svg>
);

const Swords: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m14.5 17.5 3 3 3-3" />
    <path d="M14.5 9.5 18 6l3 3-3.5 3.5" />
    <path d="m14.5 17.5-10-10 3.5-3.5 10 10" />
    <path d="m7 11 3.5 3.5" />
    <path d="M14.5 17.5 18 21" />
    <path d="m21 18-3.5-3.5" />
    <path d="M14.5 9.5 11 6" />
    <path d="m14.5 9.5-7-7" />
    <path d="m3.5 13.5 5 5" />
  </svg>
);

const Goal: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 2v20" />
    <path d="M2 12h20" />
    <path d="M12 2a10 10 0 0 1 0 20" />
    <path d="M12 2a10 10 0 0 0 0 20" />
    <path d="M2 7h5" />
    <path d="M2 17h5" />
    <path d="M17 2v5" />
    <path d="M17 17v5" />
  </svg>
);

const Timer: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const ShieldAlert: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="M12 8v4" />
    <path d="M12 16h.01" />
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

// Market options
const FOOTBALL_MARKETS = [
  { id: 'match_result', name: 'Match Result', icon: <FootballIcon className="h-4 w-4" />, description: 'Home, Draw, Away' },
  { id: 'btts', name: 'Both Teams To Score', icon: <Goal className="h-4 w-4" />, description: 'Yes/No' },
  { id: 'over_under', name: 'Over/Under Goals', icon: <BarChart4 className="h-4 w-4" />, description: 'Total goals in match' },
  { id: 'corners', name: 'Corners', icon: <ChevronRight className="h-4 w-4 rotate-45" />, description: 'Corner markets' },
  { id: 'cards', name: 'Cards', icon: <ShieldAlert className="h-4 w-4" />, description: 'Booking markets' },
  { id: 'handicap', name: 'Handicap', icon: <Target className="h-4 w-4" />, description: 'Asian & European handicaps' },
  { id: 'halftime', name: 'Half-Time Markets', icon: <Timer className="h-4 w-4" />, description: 'First half markets' },
  { id: 'scorer', name: 'Goalscorer Markets', icon: <Sparkles className="h-4 w-4" />, description: 'First, anytime or last goalscorer' },
];

const BASKETBALL_MARKETS = [
  { id: 'match_winner', name: 'Match Winner', icon: <Basketball className="h-4 w-4" />, description: 'Home or Away win' },
  { id: 'point_spread', name: 'Point Spread', icon: <Target className="h-4 w-4" />, description: 'Handicap betting' },
  { id: 'total_points', name: 'Total Points', icon: <BarChart4 className="h-4 w-4" />, description: 'Over/Under on total points' },
  { id: 'quarter_betting', name: 'Quarter Betting', icon: <Timer className="h-4 w-4" />, description: 'Markets by quarters' },
];

const TENNIS_MARKETS = [
  { id: 'match_winner', name: 'Match Winner', icon: <Tennis className="h-4 w-4" />, description: 'Player to win match' },
  { id: 'set_betting', name: 'Set Betting', icon: <Target className="h-4 w-4" />, description: 'Exact set score' },
  { id: 'game_handicap', name: 'Game Handicap', icon: <BarChart4 className="h-4 w-4" />, description: 'Game advantage betting' },
];

const VOLLEYBALL_MARKETS = [
  { id: 'match_winner', name: 'Match Winner', icon: <Volleyball className="h-4 w-4" />, description: 'Team to win match' },
  { id: 'set_handicap', name: 'Set Handicap', icon: <Target className="h-4 w-4" />, description: 'Set advantage betting' },
  { id: 'total_sets', name: 'Total Sets', icon: <BarChart4 className="h-4 w-4" />, description: 'Over/Under on total sets' },
];

export default function AccumulatorsPage() {
  // States
  const [sport, setSport] = useState<string>('all');
  const [marketType, setMarketType] = useState<string>('all'); 
  const [activeAccumulator, setActiveAccumulator] = useState<string | null>(null);
  const [savedAccumulators, setSavedAccumulators] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentTab, setCurrentTab] = useState<string>('recommended');
  const [dateRange, setDateRange] = useState<{ from: Date | undefined, to: Date | undefined }>({
    from: startOfDay(new Date()),
    to: endOfDay(addDays(new Date(), 2))
  });
  const [dateFilterType, setDateFilterType] = useState<string>('upcoming'); // 'upcoming', 'past', 'custom'
  const [isDatePopoverOpen, setIsDatePopoverOpen] = useState(false);
  const [_, setLocation] = useLocation();
  const { toast } = useToast();

  // Fetch odds data
  const { data: footballOdds, isLoading: isLoadingFootball, refetch: refetchFootball } = useQuery({
    queryKey: ['/api/odds/football'],
  });

  const { data: basketballOdds, isLoading: isLoadingBasketball, refetch: refetchBasketball } = useQuery({
    queryKey: ['/api/odds/basketball'],
  });

  // Merge and process all predictions
  const allPredictions: Prediction[] = React.useMemo(() => {
    const predictions: Prediction[] = [];
    
    if (footballOdds) {
      Object.values(footballOdds).forEach((prediction: any) => {
        predictions.push({
          ...prediction,
          odds: parseFloat(prediction.homeOdds) || 1.5,
          status: 'pending',
        });
      });
    }
    
    if (basketballOdds) {
      Object.values(basketballOdds).forEach((prediction: any) => {
        predictions.push({
          ...prediction,
          odds: parseFloat(prediction.homeOdds) || 1.5,
          status: 'pending',
        });
      });
    }
    
    return predictions;
  }, [footballOdds, basketballOdds]);
  
  const isLoading = isLoadingFootball || isLoadingBasketball;
  const hasPredictions = allPredictions && allPredictions.length > 0;

  // Generate AI accumulators for different markets and strategies
  const generateAccumulators = (): Accumulator[] => {
    if (!hasPredictions) return [];
    
    const accas: Accumulator[] = [];
    
    // Helper function to generate accumulators with specific criteria
    const createAccumulator = (
      id: string, 
      name: string, 
      description: string,
      targetOdds: number,
      minConfidence: number,
      sport: string,
      marketType: string,
      icon: React.ReactNode,
      colorTheme: string,
      isRecommended: boolean = false
    ) => {
      // Filter and shuffle predictions based on criteria
      let filteredPredictions = [...allPredictions];
      
      // Apply sport filter
      if (sport !== 'all') {
        filteredPredictions = filteredPredictions.filter(p => p.sport.toLowerCase() === sport.toLowerCase());
      }
      
      // Filter by confidence threshold
      filteredPredictions = filteredPredictions.filter(p => p.confidence >= minConfidence);
      
      // Shuffle to get variety
      filteredPredictions = filteredPredictions.sort(() => 0.5 - Math.random());
      
      // Build the accumulator
      let currentOdds = 1;
      const selections: Prediction[] = [];
      
      for (const prediction of filteredPredictions) {
        if (selections.length >= 6) break; // Maximum 6 selections for better UX
        
        // Add selection and calculate new odds
        const newOdds = currentOdds * (prediction.odds || 1.5);
        
        // Avoid duplicate teams
        if (selections.some(s => s.homeTeam === prediction.homeTeam || s.awayTeam === prediction.awayTeam)) {
          continue;
        }
        
        selections.push(prediction);
        currentOdds = newOdds;
        
        // Stop if we've reached target odds range
        if (currentOdds >= targetOdds * 0.8) break;
      }
      
      // Only create accumulator if we have selections
      if (selections.length === 0) return null;
      
      // Calculate average confidence
      const confidence = Math.floor(
        selections.reduce((sum, p) => sum + p.confidence, 0) / selections.length
      );
      
      return {
        id,
        name,
        description,
        selections,
        totalOdds: currentOdds.toFixed(2),
        potentialReturn: (25 * currentOdds).toFixed(0), // £25 stake
        confidence,
        stake: 25,
        marketType,
        sport,
        icon,
        colorTheme,
        isRecommended
      };
    };
    
    // 1. Football Match Result Accumulator
    const footyMatchResult = createAccumulator(
      'football_match_results',
      'Match Result Banker',
      'High confidence home/away/draw selections',
      4,
      70,
      'football',
      'match_result',
      <FootballIcon className="h-4 w-4" />,
      'indigo',
      true
    );
    if (footyMatchResult) accas.push(footyMatchResult);
    
    // 2. BTTS Accumulator
    const bttsAccumulator = createAccumulator(
      'btts_yes',
      'Both Teams To Score',
      'Teams expected to both find the net',
      6,
      65,
      'football',
      'btts',
      <Goal className="h-4 w-4" />,
      'emerald',
      true
    );
    if (bttsAccumulator) accas.push(bttsAccumulator);
    
    // 3. Over Goals Accumulator
    const overGoalsAccumulator = createAccumulator(
      'over_25_goals',
      'Over 2.5 Goals',
      'Matches expected to have 3+ goals',
      5,
      60,
      'football',
      'over_under',
      <BarChart4 className="h-4 w-4" />,
      'amber',
      false
    );
    if (overGoalsAccumulator) accas.push(overGoalsAccumulator);
    
    // 4. Basketball Point Spread
    const basketballSpread = createAccumulator(
      'basketball_spread',
      'Point Spread Special',
      'Basketball handicap selections',
      8,
      65,
      'basketball',
      'point_spread',
      <Basketball className="h-4 w-4" />,
      'orange',
      false
    );
    if (basketballSpread) accas.push(basketballSpread);
    
    // 5. Mixed Sports Value
    const mixedSportsValue = createAccumulator(
      'mixed_sports_value',
      'Cross-Sport Value',
      'Best value picks across different sports',
      15,
      60,
      'all',
      'all',
      <Swords className="h-4 w-4" />,
      'purple',
      true
    );
    if (mixedSportsValue) accas.push(mixedSportsValue);
    
    // 6. Weekend Special
    const weekendSpecial = createAccumulator(
      'weekend_special',
      'Weekend Winner',
      'Best bets for this weekend',
      10,
      70,
      'all',
      'all',
      <Sparkles className="h-4 w-4" />,
      'blue',
      false
    );
    if (weekendSpecial) accas.push(weekendSpecial);
    
    // 7. High Odds Longshot
    const highOddsLongshot = createAccumulator(
      'high_odds_longshot',
      'High Odds Longshot',
      'Lower probability but massive returns',
      40,
      50,
      'all',
      'all',
      <Rocket className="h-4 w-4" />,
      'rose',
      false
    );
    if (highOddsLongshot) accas.push(highOddsLongshot);
    
    return accas;
  };
  
  // Generate all available accumulators
  const accumulators = React.useMemo(() => generateAccumulators(), [allPredictions]);
  
  // Handle date filter changes
  const handleDateFilterChange = (type: string) => {
    setDateFilterType(type);
    
    // Set appropriate date ranges based on selected filter
    if (type === 'upcoming') {
      setDateRange({
        from: startOfDay(new Date()),
        to: endOfDay(addDays(new Date(), 7))
      });
    } else if (type === 'past') {
      setDateRange({
        from: startOfDay(addDays(new Date(), -30)), // Last 30 days
        to: endOfDay(addDays(new Date(), -1))       // Up to yesterday
      });
    }
    // For 'custom', don't change dateRange - user will set it manually
  };
  
  // Filter accumulators based on user selection
  const filteredAccumulators = React.useMemo(() => {
    let filtered = [...accumulators];
    
    // Filter by current tab
    if (currentTab === 'recommended') {
      filtered = filtered.filter(acca => acca.isRecommended);
    }
    
    // Apply sport filter
    if (sport !== 'all') {
      filtered = filtered.filter(acca => acca.sport === 'all' || acca.sport === sport);
    }
    
    // Apply market filter
    if (marketType !== 'all') {
      filtered = filtered.filter(acca => acca.marketType === 'all' || acca.marketType === marketType);
    }
    
    // Apply date filter
    if (dateRange.from && dateRange.to) {
      filtered = filtered.filter(acca => {
        // Check if any selection in the accumulator falls within the date range
        return acca.selections.some(selection => {
          const matchDate = new Date(selection.startTime);
          return matchDate >= dateRange.from! && matchDate <= dateRange.to!;
        });
      });
    }
    
    // Apply search filter
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(acca => 
        acca.name.toLowerCase().includes(term) ||
        acca.description.toLowerCase().includes(term) ||
        acca.selections.some(sel => 
          sel.homeTeam.toLowerCase().includes(term) || 
          sel.awayTeam.toLowerCase().includes(term) ||
          sel.league.toLowerCase().includes(term)
        )
      );
    }
    
    return filtered;
  }, [accumulators, sport, marketType, searchTerm, currentTab, dateRange]);

  // Refresh data
  const refreshData = async () => {
    await Promise.all([
      refetchFootball(),
      refetchBasketball(),
    ]);
    toast({
      title: "Data refreshed",
      description: "Latest odds and predictions have been loaded.",
    });
  };

  // Track saved accumulator
  const toggleSaveAccumulator = (id: string) => {
    if (savedAccumulators.includes(id)) {
      setSavedAccumulators(savedAccumulators.filter(accaId => accaId !== id));
      toast({
        title: "Accumulator removed",
        description: "The accumulator has been removed from your saved list.",
      });
    } else {
      setSavedAccumulators([...savedAccumulators, id]);
      toast({
        title: "Accumulator saved",
        description: "The accumulator has been added to your saved list.",
      });
    }
  };

  // Back button handler
  const handleBack = () => {
    setLocation('/predictions');
  };

  // Calculate win probability based on confidence
  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 80) return { label: 'Very High', color: 'bg-green-500' };
    if (confidence >= 70) return { label: 'High', color: 'bg-emerald-500' };
    if (confidence >= 60) return { label: 'Good', color: 'bg-lime-500' };
    if (confidence >= 50) return { label: 'Medium', color: 'bg-amber-500' };
    return { label: 'Low', color: 'bg-red-500' };
  };

  // Calculate risk level based on odds
  const getRiskLevel = (odds: string) => {
    const oddsNum = parseFloat(odds);
    if (oddsNum <= 2) return { label: 'Low Risk', color: 'bg-green-100 text-green-800' };
    if (oddsNum <= 5) return { label: 'Moderate', color: 'bg-blue-100 text-blue-800' };
    if (oddsNum <= 15) return { label: 'Medium', color: 'bg-amber-100 text-amber-800' };
    if (oddsNum <= 30) return { label: 'High', color: 'bg-orange-100 text-orange-800' };
    return { label: 'Very High', color: 'bg-red-100 text-red-800' };
  };

  // Calculate the effective market types for current state
  const getEffectiveMarkets = () => {
    if (sport === 'football') return FOOTBALL_MARKETS;
    if (sport === 'basketball') return BASKETBALL_MARKETS;
    if (sport === 'tennis') return TENNIS_MARKETS;
    if (sport === 'volleyball') return VOLLEYBALL_MARKETS;
    return [...FOOTBALL_MARKETS, ...BASKETBALL_MARKETS];
  };

  // Handle search
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  return (
    <div className="container py-6 max-w-screen-xl animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={handleBack} className="mr-1">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <PuntaIQLogo size="md" />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={refreshData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-12 gap-4">
        {/* Filters sidebar */}
        <div className="col-span-12 md:col-span-3 space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search */}
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search accumulators..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={handleSearch}
                  />
                </div>
              </div>

              {/* Sports filter */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Sports</h3>
                <div className="flex flex-wrap gap-2">
                  <Badge 
                    variant={sport === 'all' ? 'default' : 'outline'} 
                    className="cursor-pointer hover:bg-muted"
                    onClick={() => setSport('all')}
                  >
                    All Sports
                  </Badge>
                  <Badge 
                    variant={sport === 'football' ? 'default' : 'outline'} 
                    className="cursor-pointer hover:bg-muted"
                    onClick={() => setSport('football')}
                  >
                    <FootballIcon className="h-3.5 w-3.5 mr-1" /> Football
                  </Badge>
                  <Badge 
                    variant={sport === 'basketball' ? 'default' : 'outline'} 
                    className="cursor-pointer hover:bg-muted"
                    onClick={() => setSport('basketball')}
                  >
                    <Basketball className="h-3.5 w-3.5 mr-1" /> Basketball
                  </Badge>
                  <Badge 
                    variant={sport === 'tennis' ? 'default' : 'outline'} 
                    className="cursor-pointer hover:bg-muted"
                    onClick={() => setSport('tennis')}
                  >
                    <Tennis className="h-3.5 w-3.5 mr-1" /> Tennis
                  </Badge>
                  <Badge 
                    variant={sport === 'volleyball' ? 'default' : 'outline'} 
                    className="cursor-pointer hover:bg-muted"
                    onClick={() => setSport('volleyball')}
                  >
                    <Volleyball className="h-3.5 w-3.5 mr-1" /> Volleyball
                  </Badge>
                </div>
              </div>

              {/* Market type filter - organized by sport */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium">Market Type</h3>
                
                <div className="flex flex-wrap gap-2">
                  <Badge 
                    variant={marketType === 'all' ? 'default' : 'outline'} 
                    className="cursor-pointer hover:bg-muted"
                    onClick={() => setMarketType('all')}
                  >
                    All Markets
                  </Badge>
                </div>
                
                {/* Only show relevant sports based on current selection */}
                {(sport === 'all' || sport === 'football') && (
                  <div className="space-y-1">
                    <h4 className="text-xs font-medium flex items-center">
                      <FootballIcon className="h-3.5 w-3.5 mr-1" /> Football Markets
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {FOOTBALL_MARKETS.map(market => (
                        <Badge 
                          key={market.id}
                          variant={marketType === market.id ? 'default' : 'outline'} 
                          className="cursor-pointer hover:bg-muted"
                          onClick={() => setMarketType(market.id)}
                        >
                          {market.icon} {market.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {(sport === 'all' || sport === 'basketball') && (
                  <div className="space-y-1">
                    <h4 className="text-xs font-medium flex items-center">
                      <Basketball className="h-3.5 w-3.5 mr-1" /> Basketball Markets
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {BASKETBALL_MARKETS.map(market => (
                        <Badge 
                          key={market.id}
                          variant={marketType === market.id ? 'default' : 'outline'} 
                          className="cursor-pointer hover:bg-muted"
                          onClick={() => setMarketType(market.id)}
                        >
                          {market.icon} {market.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {(sport === 'all' || sport === 'tennis') && (
                  <div className="space-y-1">
                    <h4 className="text-xs font-medium flex items-center">
                      <Tennis className="h-3.5 w-3.5 mr-1" /> Tennis Markets
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {TENNIS_MARKETS.map(market => (
                        <Badge 
                          key={market.id}
                          variant={marketType === market.id ? 'default' : 'outline'} 
                          className="cursor-pointer hover:bg-muted"
                          onClick={() => setMarketType(market.id)}
                        >
                          {market.icon} {market.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {(sport === 'all' || sport === 'volleyball') && (
                  <div className="space-y-1">
                    <h4 className="text-xs font-medium flex items-center">
                      <Volleyball className="h-3.5 w-3.5 mr-1" /> Volleyball Markets
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {VOLLEYBALL_MARKETS.map(market => (
                        <Badge 
                          key={market.id}
                          variant={marketType === market.id ? 'default' : 'outline'} 
                          className="cursor-pointer hover:bg-muted"
                          onClick={() => setMarketType(market.id)}
                        >
                          {market.icon} {market.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Date filter */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Date Range</h3>
                <div className="flex flex-wrap gap-2 mb-2">
                  <Badge 
                    variant={dateFilterType === 'upcoming' ? 'default' : 'outline'} 
                    className="cursor-pointer hover:bg-muted"
                    onClick={() => handleDateFilterChange('upcoming')}
                  >
                    <Activity className="h-3.5 w-3.5 mr-1" /> Upcoming (7 days)
                  </Badge>
                  <Badge 
                    variant={dateFilterType === 'past' ? 'default' : 'outline'} 
                    className="cursor-pointer hover:bg-muted"
                    onClick={() => handleDateFilterChange('past')}
                  >
                    <Clock className="h-3.5 w-3.5 mr-1" /> Historical (30 days)
                  </Badge>
                  <Badge 
                    variant={dateFilterType === 'custom' ? 'default' : 'outline'} 
                    className="cursor-pointer hover:bg-muted"
                    onClick={() => {
                      setDateFilterType('custom');
                      setIsDatePopoverOpen(true);
                    }}
                  >
                    <Calendar className="h-3.5 w-3.5 mr-1" /> Custom
                  </Badge>
                </div>

                {/* Custom Date Range Selector */}
                {dateFilterType === 'custom' && (
                  <div className="p-2 rounded-md border bg-card shadow-sm">
                    <Popover open={isDatePopoverOpen} onOpenChange={setIsDatePopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button 
                          variant="outline" 
                          className="w-full justify-between text-left font-normal flex items-center"
                          size="sm"
                        >
                          <div className="flex items-center">
                            <Calendar className="mr-2 h-4 w-4" />
                            <span>
                              {dateRange.from ? (
                                dateRange.to ? (
                                  <>
                                    {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
                                  </>
                                ) : (
                                  format(dateRange.from, "LLL dd, y")
                                )
                              ) : (
                                "Pick a date range"
                              )}
                            </span>
                          </div>
                          <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="center">
                        <CalendarComponent
                          mode="range"
                          defaultMonth={dateRange.from}
                          selected={{
                            from: dateRange.from,
                            to: dateRange.to
                          }}
                          onSelect={(range) => {
                            if (range) {
                              setDateRange({
                                from: range.from,
                                to: range.to
                              });
                              if (range.from && range.to) {
                                // Close popover when a complete range is selected
                                setTimeout(() => setIsDatePopoverOpen(false), 300);
                              }
                            }
                          }}
                          numberOfMonths={2}
                          initialFocus
                        />
                        <div className="p-3 border-t flex justify-between items-center">
                          <span className="text-xs text-muted-foreground">
                            Select start and end dates
                          </span>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => setIsDatePopoverOpen(false)}
                          >
                            Apply
                          </Button>
                        </div>
                      </PopoverContent>
                    </Popover>
                    <div className="mt-2 flex gap-2 items-center text-xs text-muted-foreground">
                      <AlertCircle className="h-3.5 w-3.5" />
                      <span>Data availability varies by date range</span>
                    </div>
                  </div>
                )}

                {/* Current selection display */}
                {!isDatePopoverOpen && dateFilterType === 'custom' && dateRange.from && dateRange.to && (
                  <div className="text-xs text-muted-foreground">
                    <span className="font-medium">Selected range: </span>
                    {format(dateRange.from, "MMM dd, yyyy")} to {format(dateRange.to, "MMM dd, yyyy")}
                  </div>
                )}
              </div>

              {/* Help section */}
              <Card className="bg-muted/50">
                <CardContent className="p-3">
                  <div className="flex gap-2 items-start">
                    <AlertCircle className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <div className="text-xs text-muted-foreground">
                      Our AI analyzes thousands of data points to create these accumulators. 
                      Confidence ratings are based on historical accuracy.
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>

          {/* Create custom accumulator */}
          <Card className="bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-950/40 dark:to-violet-950/40">
            <CardContent className="p-4">
              <div className="flex flex-col items-center text-center gap-2">
                <div className="h-10 w-10 rounded-full bg-indigo-500/10 flex items-center justify-center">
                  <PlusCircle className="h-5 w-5 text-indigo-500" />
                </div>
                <h3 className="font-semibold">Create Custom Accumulator</h3>
                <p className="text-xs text-muted-foreground">
                  Build your own accumulator by selecting individual predictions
                </p>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm" className="mt-2">
                      Get Started
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Coming Soon</DialogTitle>
                      <DialogDescription>
                        Custom accumulator builder will be available in the next update.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-end">
                      <DialogTrigger asChild>
                        <Button variant="outline">Close</Button>
                      </DialogTrigger>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Accumulators list */}
        <div className="col-span-12 md:col-span-9">
          <Tabs defaultValue="recommended" value={currentTab} onValueChange={setCurrentTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="recommended">
                <Sparkles className="h-4 w-4 mr-2" />
                Recommended
              </TabsTrigger>
              <TabsTrigger value="all">
                <ScrollText className="h-4 w-4 mr-2" />
                All Accumulators
              </TabsTrigger>
              <TabsTrigger value="saved">
                <BookmarkIcon className="h-4 w-4 mr-2" />
                Saved ({savedAccumulators.length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="recommended" className="mt-0">
              <div className="grid grid-cols-1 gap-4">
                {isLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <Card key={i}>
                        <CardHeader>
                          <Skeleton className="h-6 w-32" />
                          <Skeleton className="h-4 w-48" />
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {[...Array(3)].map((_, j) => (
                              <div key={j} className="flex justify-between">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-4 w-16" />
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : filteredAccumulators.length === 0 ? (
                  <div className="rounded-lg border p-8 text-center">
                    <div className="flex justify-center mb-3">
                      <AlertCircle className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-1">No accumulators found</h3>
                    <p className="text-muted-foreground mb-4">
                      There are no accumulators available matching your criteria.
                    </p>
                    <Button variant="outline" onClick={() => {
                      setSport('all');
                      setMarketType('all');
                      setSearchTerm('');
                    }}>
                      Reset filters
                    </Button>
                  </div>
                ) : (
                  filteredAccumulators.map(acca => (
                    <AccumulatorCard 
                      key={acca.id}
                      accumulator={acca}
                      isActive={activeAccumulator === acca.id}
                      isSaved={savedAccumulators.includes(acca.id)}
                      onToggle={() => setActiveAccumulator(activeAccumulator === acca.id ? null : acca.id)}
                      onSave={() => toggleSaveAccumulator(acca.id)}
                      confidenceFn={getConfidenceLabel}
                      riskLevelFn={getRiskLevel}
                    />
                  ))
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="all" className="mt-0">
              <div className="grid grid-cols-1 gap-4">
                {isLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <Card key={i}>
                        <CardHeader>
                          <Skeleton className="h-6 w-32" />
                          <Skeleton className="h-4 w-48" />
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {[...Array(3)].map((_, j) => (
                              <div key={j} className="flex justify-between">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-4 w-16" />
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : accumulators.length === 0 ? (
                  <div className="rounded-lg border p-8 text-center">
                    <div className="flex justify-center mb-3">
                      <AlertCircle className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-1">No accumulators generated</h3>
                    <p className="text-muted-foreground mb-4">
                      We couldn't generate any accumulators. This could be due to insufficient data.
                    </p>
                    <Button onClick={refreshData}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Reload Data
                    </Button>
                  </div>
                ) : filteredAccumulators.length === 0 ? (
                  <div className="rounded-lg border p-8 text-center">
                    <div className="flex justify-center mb-3">
                      <AlertCircle className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-1">No accumulators match filters</h3>
                    <p className="text-muted-foreground mb-4">
                      There are no accumulators available matching your criteria.
                    </p>
                    <Button variant="outline" onClick={() => {
                      setSport('all');
                      setMarketType('all');
                      setSearchTerm('');
                    }}>
                      Reset filters
                    </Button>
                  </div>
                ) : (
                  filteredAccumulators.map(acca => (
                    <AccumulatorCard 
                      key={acca.id}
                      accumulator={acca}
                      isActive={activeAccumulator === acca.id}
                      isSaved={savedAccumulators.includes(acca.id)}
                      onToggle={() => setActiveAccumulator(activeAccumulator === acca.id ? null : acca.id)}
                      onSave={() => toggleSaveAccumulator(acca.id)}
                      confidenceFn={getConfidenceLabel}
                      riskLevelFn={getRiskLevel}
                    />
                  ))
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="saved" className="mt-0">
              <div className="grid grid-cols-1 gap-4">
                {savedAccumulators.length === 0 ? (
                  <div className="rounded-lg border p-8 text-center">
                    <div className="flex justify-center mb-3">
                      <BookmarkIcon className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-1">No saved accumulators</h3>
                    <p className="text-muted-foreground mb-4">
                      You haven't saved any accumulators yet. Browse the available options and save your favorites.
                    </p>
                    <Button variant="outline" onClick={() => setCurrentTab('recommended')}>
                      Browse accumulators
                    </Button>
                  </div>
                ) : (
                  accumulators
                    .filter(acca => savedAccumulators.includes(acca.id))
                    .map(acca => (
                      <AccumulatorCard 
                        key={acca.id}
                        accumulator={acca}
                        isActive={activeAccumulator === acca.id}
                        isSaved={true}
                        onToggle={() => setActiveAccumulator(activeAccumulator === acca.id ? null : acca.id)}
                        onSave={() => toggleSaveAccumulator(acca.id)}
                        confidenceFn={getConfidenceLabel}
                        riskLevelFn={getRiskLevel}
                      />
                    ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

// Accumulator card component
function AccumulatorCard({ 
  accumulator, 
  isActive, 
  isSaved,
  onToggle,
  onSave,
  confidenceFn,
  riskLevelFn
}: { 
  accumulator: Accumulator;
  isActive: boolean;
  isSaved: boolean;
  onToggle: () => void;
  onSave: () => void;
  confidenceFn: (confidence: number) => { label: string, color: string };
  riskLevelFn: (odds: string) => { label: string, color: string };
}) {
  const confidence = confidenceFn(accumulator.confidence);
  const riskLevel = riskLevelFn(accumulator.totalOdds);
  
  return (
    <Card className={`
      transition-all duration-200 overflow-hidden
      border-l-4 hover:shadow-md
      ${isActive ? 'shadow-md' : ''}
      ${accumulator.colorTheme === 'indigo' ? 'border-l-indigo-500' : ''}
      ${accumulator.colorTheme === 'emerald' ? 'border-l-emerald-500' : ''}
      ${accumulator.colorTheme === 'amber' ? 'border-l-amber-500' : ''}
      ${accumulator.colorTheme === 'orange' ? 'border-l-orange-500' : ''}
      ${accumulator.colorTheme === 'rose' ? 'border-l-rose-500' : ''}
      ${accumulator.colorTheme === 'blue' ? 'border-l-blue-500' : ''}
      ${accumulator.colorTheme === 'purple' ? 'border-l-purple-500' : ''}
    `}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <div className={`
              p-1.5 rounded-md
              ${accumulator.colorTheme === 'indigo' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300' : ''}
              ${accumulator.colorTheme === 'emerald' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300' : ''}
              ${accumulator.colorTheme === 'amber' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300' : ''}
              ${accumulator.colorTheme === 'orange' ? 'bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300' : ''}
              ${accumulator.colorTheme === 'rose' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300' : ''}
              ${accumulator.colorTheme === 'blue' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300' : ''}
              ${accumulator.colorTheme === 'purple' ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300' : ''}
            `}>
              {accumulator.icon}
            </div>
            <CardTitle className="text-lg">{accumulator.name}</CardTitle>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={onSave}>
              <BookmarkIcon className={`h-[18px] w-[18px] ${isSaved ? 'fill-current' : ''}`} />
            </Button>
            <Button variant="ghost" size="icon" onClick={onToggle}>
              <ChevronDown className={`h-[18px] w-[18px] transition-transform ${isActive ? 'rotate-180' : ''}`} />
            </Button>
          </div>
        </div>
        <CardDescription>{accumulator.description}</CardDescription>
      </CardHeader>
      <CardContent className="pb-3">
        <div className="flex flex-wrap gap-x-6 gap-y-2 mb-3">
          <div className="flex items-center text-sm">
            <Zap className="h-4 w-4 mr-1 text-amber-500" />
            <span className="font-medium mr-1">Odds:</span>
            {accumulator.totalOdds}
          </div>
          <div className="flex items-center text-sm">
            <TrendingUp className="h-4 w-4 mr-1 text-emerald-500" />
            <span className="font-medium mr-1">Return:</span>
            £{accumulator.potentialReturn}
          </div>
          <div className="flex items-center text-sm">
            <Badge variant="outline" className={riskLevel.color}>
              {riskLevel.label}
            </Badge>
          </div>
          <div className="flex items-center text-sm">
            <div className="flex items-center gap-1">
              <span className="font-medium">Confidence:</span>
              <div className="flex items-center gap-1">
                <div className={`h-2 w-2 rounded-full ${confidence.color}`} />
                <span>{confidence.label}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Selections (shown when expanded) */}
        <Accordion 
          type="single" 
          collapsible 
          value={isActive ? "selections" : ""}
          className="w-full"
        >
          <AccordionItem value="selections" className="border-none">
            <AccordionContent className="pt-2">
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {accumulator.selections.map((selection, index) => (
                    <div key={index} className="rounded-md border bg-card p-3 text-card-foreground shadow-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-sm">
                          {selection.sport === 'football' && <FootballIcon className="h-3.5 w-3.5 mr-1.5" />}
                          {selection.sport === 'basketball' && <Basketball className="h-3.5 w-3.5 mr-1.5" />}
                          {selection.sport === 'tennis' && <Tennis className="h-3.5 w-3.5 mr-1.5" />}
                          {selection.sport === 'volleyball' && <Volleyball className="h-3.5 w-3.5 mr-1.5" />}
                          <span className="font-medium">{selection.league}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {selection.prediction}
                        </Badge>
                      </div>
                      <div className="mt-1 text-sm">
                        {selection.homeTeam} vs {selection.awayTeam}
                      </div>
                      <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {new Date(selection.startTime).toLocaleDateString()} 
                        </div>
                        <div>
                          Odds: {selection.odds?.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-center pt-2">
                  <div className="text-sm text-muted-foreground">
                    <span className="font-medium">£{accumulator.stake}</span> stake
                  </div>
                  <Button size="sm" variant="outline">
                    View Detailed Analysis
                    <ExternalLink className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}