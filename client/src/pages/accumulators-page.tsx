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
  
  // Fetch accumulator predictions based on risk and sport filters
  const { data: accumulators, isLoading } = useQuery<Accumulator[]>({
    queryKey: ['/api/accumulators', riskLevel, filterSport, format(date, 'yyyy-MM-dd')],
    enabled: true,
  });

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
            <span className="text-sm font-medium">{accumulator.selections.length}</span>
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full text-sm"
            onClick={() => setSelectionDialogOpen(true)}
          >
            <ScrollText className="h-3.5 w-3.5 mr-2" />
            View Selections
          </Button>
        </div>
        
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Market Type:</span>
            <span className="text-sm font-medium">{accumulator.marketType}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Confidence:</span>
            <Badge variant="secondary" className={getConfidenceBadgeColor(accumulator.confidence)}>
              {accumulator.confidence}%
            </Badge>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Stake → Return:</span>
            <span className="text-sm font-medium">£{accumulator.stake} → £{accumulator.potentialReturn}</span>
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
            <DialogTitle>Accumulator Selections</DialogTitle>
            <DialogDescription>{accumulator.name} - {accumulator.totalOdds}x odds</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
            {accumulator.selections.map((selection, index) => (
              <Card key={index} className="overflow-hidden border">
                <CardContent className="p-3">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-medium">{selection.homeTeam} vs {selection.awayTeam}</div>
                      <div className="text-xs text-muted-foreground">{selection.league}, {selection.country}</div>
                    </div>
                    <Badge>{selection.odds}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="text-sm">
                      <span className="text-muted-foreground mr-1">Prediction:</span>
                      <span className="font-medium">{selection.prediction}</span>
                    </div>
                    <Badge variant="outline" className={getConfidenceBadgeColor(selection.confidence)}>
                      {selection.confidence}%
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <DialogFooter>
            <Button onClick={() => setSelectionDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}