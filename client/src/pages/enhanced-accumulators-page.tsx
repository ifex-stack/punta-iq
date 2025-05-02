import React, { useState, useCallback, useMemo } from 'react';
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
  Calendar, ChevronLeft, Share2
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format, addDays, startOfDay, endOfDay, isToday, isPast, isFuture } from 'date-fns';
import { PuntaIQLogo } from '@/components/ui/puntaiq-logo';
import { motion, AnimatePresence } from 'framer-motion';

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

// Custom accumulator builder component
interface CustomSelection {
  id: string;
  homeTeam: string;
  awayTeam: string;
  market: string;
  selection: string;
  odds: number;
}

interface CustomAccumulatorBuilderProps {
  onCancel: () => void;
  onCreateAccumulator: (selections: CustomSelection[], stake: number, riskLevel: string, sport: string) => void;
  sportFilters: Array<{
    value: string;
    label: string;
    icon: React.ReactNode;
  }>;
  riskLevels: Array<{
    value: string;
    label: string;
    description: string;
  }>;
}

function CustomAccumulatorBuilder({
  onCancel,
  onCreateAccumulator,
  sportFilters,
  riskLevels,
}: CustomAccumulatorBuilderProps) {
  const [selections, setSelections] = useState<CustomSelection[]>([
    {
      id: '1',
      homeTeam: 'Manchester United',
      awayTeam: 'Chelsea',
      market: 'match_winner',
      selection: 'home',
      odds: 1.65
    },
    {
      id: '2',
      homeTeam: 'Liverpool',
      awayTeam: 'Arsenal',
      market: 'over_under',
      selection: 'over',
      odds: 1.90
    }
  ]);
  const [stake, setStake] = useState(10);
  const [riskLevel, setRiskLevel] = useState('balanced');
  const [sport, setSport] = useState('football');

  // Calculate total odds and potential return
  const totalOdds = useMemo(() => selections.reduce((total, selection) => total * selection.odds, 1), [selections]);
  const potentialReturn = useMemo(() => totalOdds * stake, [totalOdds, stake]);

  // Add a new selection
  const addSelection = useCallback(() => {
    const newId = (selections.length + 1).toString();
    setSelections(prev => [...prev, {
      id: newId,
      homeTeam: '',
      awayTeam: '',
      market: 'match_winner',
      selection: 'home',
      odds: 1.50
    }]);
  }, [selections.length]);

  // Remove a selection
  const removeSelection = useCallback((id: string) => {
    const filtered = selections.filter(s => s.id !== id);
    if (filtered.length > 0) {
      setSelections(filtered);
    }
  }, [selections]);

  // Update a selection field
  const updateSelection = useCallback((index: number, field: keyof CustomSelection, value: string | number) => {
    setSelections(prev => {
      const newSelections = [...prev];
      newSelections[index] = {
        ...newSelections[index],
        [field]: value
      };
      return newSelections;
    });
  }, []);

  // Update market and reset selection based on market type
  const updateMarket = useCallback((index: number, market: string) => {
    setSelections(prev => {
      const newSelections = [...prev];
      newSelections[index] = {
        ...newSelections[index],
        market,
        selection: market === 'match_winner' ? 'home' : 
                 market === 'over_under' ? 'over' : 
                 market === 'both_teams_to_score' ? 'yes' : 'home'
      };
      return newSelections;
    });
  }, []);

  return (
    <Card className="border border-muted-50 overflow-hidden shadow-md">
      <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10">
        <CardTitle className="text-center">Build Your Accumulator</CardTitle>
        <CardDescription className="text-center">
          Create your own custom accumulator by selecting markets
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 p-6">
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-medium">Risk Level</h3>
          <Select 
            value={riskLevel}
            onValueChange={setRiskLevel}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a risk level" />
            </SelectTrigger>
            <SelectContent>
              {riskLevels.map(level => (
                <SelectItem key={level.value} value={level.value}>
                  {level.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-medium">Sport</h3>
          <Select 
            value={sport}
            onValueChange={setSport}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select sport" />
            </SelectTrigger>
            <SelectContent>
              {sportFilters.map(sport => (
                <SelectItem key={sport.value} value={sport.value}>
                  <div className="flex items-center gap-2">
                    {sport.icon}
                    {sport.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-medium">Selections</h3>
            <Button variant="outline" size="sm" onClick={addSelection}>
              <PlusCircle className="h-3.5 w-3.5 mr-1" />
              Add Selection
            </Button>
          </div>
          
          <div className="border rounded-md p-4 space-y-4">
            <AnimatePresence initial={false}>
              {selections.map((selection, index) => (
                <motion.div 
                  key={selection.id} 
                  className={`flex flex-col gap-3 ${index < selections.length - 1 ? 'pb-3 border-b' : ''}`}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Selection {index + 1}</span>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6"
                      onClick={() => removeSelection(selection.id)}
                      disabled={selections.length <= 1}
                    >
                      <XCircle className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs mb-1 block">Home Team</label>
                      <Input 
                        placeholder="Home Team" 
                        value={selection.homeTeam}
                        onChange={e => updateSelection(index, 'homeTeam', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-xs mb-1 block">Away Team</label>
                      <Input 
                        placeholder="Away Team" 
                        value={selection.awayTeam}
                        onChange={e => updateSelection(index, 'awayTeam', e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs mb-1 block">Market</label>
                      <Select 
                        value={selection.market}
                        onValueChange={value => updateMarket(index, value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select market" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="match_winner">Match Winner</SelectItem>
                          <SelectItem value="double_chance">Double Chance</SelectItem>
                          <SelectItem value="both_teams_to_score">Both Teams to Score</SelectItem>
                          <SelectItem value="over_under">Over/Under Goals</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-xs mb-1 block">Selection</label>
                      <Select 
                        value={selection.selection}
                        onValueChange={value => updateSelection(index, 'selection', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select prediction" />
                        </SelectTrigger>
                        <SelectContent>
                          {selection.market === 'match_winner' && (
                            <>
                              <SelectItem value="home">Home Win</SelectItem>
                              <SelectItem value="draw">Draw</SelectItem>
                              <SelectItem value="away">Away Win</SelectItem>
                            </>
                          )}
                          {selection.market === 'double_chance' && (
                            <>
                              <SelectItem value="home_draw">Home or Draw</SelectItem>
                              <SelectItem value="home_away">Home or Away</SelectItem>
                              <SelectItem value="draw_away">Draw or Away</SelectItem>
                            </>
                          )}
                          {selection.market === 'both_teams_to_score' && (
                            <>
                              <SelectItem value="yes">Yes</SelectItem>
                              <SelectItem value="no">No</SelectItem>
                            </>
                          )}
                          {selection.market === 'over_under' && (
                            <>
                              <SelectItem value="over">Over 2.5 Goals</SelectItem>
                              <SelectItem value="under">Under 2.5 Goals</SelectItem>
                            </>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-xs mb-1 block">Odds</label>
                    <Input 
                      type="number" 
                      min="1.01" 
                      step="0.01" 
                      value={selection.odds} 
                      onChange={e => updateSelection(index, 'odds', parseFloat(e.target.value) || 1.01)}
                    />
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
        
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Stake Amount ($)</label>
          <Input 
            type="number" 
            min="1" 
            step="1" 
            value={stake} 
            onChange={e => setStake(Number(e.target.value) || 1)}
          />
        </div>
        
        <motion.div 
          className="bg-gradient-to-r from-muted/40 to-muted/60 p-4 rounded-md"
          initial={{ opacity: 0.8 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm">Total Odds:</span>
            <span className="font-medium">{totalOdds.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm">Potential Return:</span>
            <span className="font-medium text-green-600 dark:text-green-400">${potentialReturn.toFixed(2)}</span>
          </div>
        </motion.div>
      </CardContent>
      <CardFooter className="flex justify-between bg-muted/20 p-4">
        <Button 
          variant="outline" 
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button 
          onClick={() => onCreateAccumulator(selections, stake, riskLevel, sport)}
          className="bg-gradient-to-r from-primary to-primary-600 hover:from-primary-600 hover:to-primary-700"
        >
          Create Accumulator
        </Button>
      </CardFooter>
    </Card>
  );
}

// Error state component
interface ApiErrorStateProps {
  message?: string;
  onRetry: () => Promise<any>;
  onCreateCustom: () => void;
}

function ApiErrorState({ 
  message = "We're experiencing an issue with retrieving data from the sports API. This could be due to API quota limits or temporary service disruption.",
  onRetry,
  onCreateCustom
}: ApiErrorStateProps) {
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryAttempted, setRetryAttempted] = useState(false);

  const handleRetry = async () => {
    // Only allow one retry attempt from this component
    if (retryAttempted) {
      onCreateCustom();
      return;
    }
    
    setIsRetrying(true);
    setRetryAttempted(true);
    
    try {
      await onRetry();
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <motion.div 
      className="col-span-full flex flex-col items-center justify-center py-12 text-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="rounded-full bg-red-100 dark:bg-red-900/30 p-3 mb-4">
        <AlertCircle className="h-6 w-6 text-red-500 dark:text-red-400" />
      </div>
      <h3 className="text-lg font-medium mb-2">Unable to Load Accumulators</h3>
      <p className="text-muted-foreground max-w-md mb-6">
        {message}
      </p>
      
      <div className="flex flex-col gap-4 w-full max-w-md">
        <Button 
          onClick={onCreateCustom}
          className="bg-gradient-to-r from-primary to-primary-600 hover:from-primary-600 hover:to-primary-700"
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Create Custom Accumulator
        </Button>
        
        <Button 
          variant="outline" 
          onClick={handleRetry}
          disabled={isRetrying}
        >
          {isRetrying ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Retrying...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry Loading Accumulators
            </>
          )}
        </Button>
      </div>
    </motion.div>
  );
}

// Empty state component
interface EmptyStateProps {
  message?: string;
  date?: string;
  onCreateCustom: () => void;
}

function EmptyState({ 
  message = "We don't have any accumulator predictions matching your criteria.",
  date,
  onCreateCustom
}: EmptyStateProps) {
  return (
    <motion.div 
      className="col-span-full flex flex-col items-center justify-center py-12 text-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="rounded-full bg-muted p-3 mb-4">
        <AlertCircle className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-medium mb-2">No Accumulators Available</h3>
      <p className="text-muted-foreground max-w-md mb-6">
        {message}
        {date && ` for ${date}.`}
        {!date && '.'}
        <br />
        Try changing the date, risk level, or sport filter.
      </p>
      
      <Button 
        onClick={onCreateCustom}
        className="bg-gradient-to-r from-primary to-primary-600 hover:from-primary-600 hover:to-primary-700"
      >
        <PlusCircle className="mr-2 h-4 w-4" />
        Create Custom Accumulator
      </Button>
    </motion.div>
  );
}

// Accumulator card component
interface AccumulatorCardProps {
  accumulator: Accumulator;
  onBookmark: () => void;
}

function AccumulatorCard({ accumulator, onBookmark }: AccumulatorCardProps) {
  const {
    id, name, description, selections, totalOdds, potentialReturn, confidence, icon,
    colorTheme, marketType, sport
  } = accumulator;
  
  const [expanded, setExpanded] = useState(false);
  
  // Format market type for display
  const formatMarketType = (type: string): string => {
    switch (type) {
      case 'match_winner': return 'Match Winner';
      case 'btts': return 'Both Teams To Score';
      case 'over_under': return 'Over/Under Goals';
      case 'mixed': return 'Mixed Markets';
      default: return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };
  
  // Format prediction for display
  const formatPrediction = (prediction: string, market: string): string => {
    switch (prediction) {
      case 'home': return 'Home Win';
      case 'away': return 'Away Win';
      case 'draw': return 'Draw';
      case 'yes': return 'Yes';
      case 'no': return 'No';
      case 'over': return market === 'over_under' ? 'Over 2.5 Goals' : 'Over';
      case 'under': return market === 'over_under' ? 'Under 2.5 Goals' : 'Under';
      default: return prediction.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className={`overflow-hidden border ${colorTheme} hover:shadow-md transition-shadow`}>
        <CardHeader className="pb-2">
          <div className="flex justify-between">
            <div className="flex items-center gap-2">
              {icon}
              <h3 className="text-base font-semibold">{name}</h3>
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" onClick={() => window.alert('Share functionality not implemented yet')}>
                <Share2 className="h-4 w-4 text-muted-foreground" />
              </Button>
              <Button variant="ghost" size="icon" onClick={onBookmark}>
                <BookmarkIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {formatMarketType(marketType)}
                </Badge>
                <Badge variant="outline" className="text-xs uppercase">
                  {sport}
                </Badge>
              </div>
              <Badge 
                className={`
                  ${confidence >= 80 ? 'bg-green-100 text-green-800' : 
                    confidence >= 60 ? 'bg-blue-100 text-blue-800' : 
                    confidence >= 40 ? 'bg-orange-100 text-orange-800' : 
                    'bg-red-100 text-red-800'}
                `}
              >
                {confidence}% Confidence
              </Badge>
            </div>
            
            <Accordion
              type="single"
              collapsible
              className="w-full"
              value={expanded ? "selections" : ""}
              onValueChange={(val) => setExpanded(val === "selections")}
            >
              <AccordionItem value="selections" className="border-b-0">
                <AccordionTrigger className="py-2 text-sm">
                  {selections.length} Selections
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3 pt-1">
                    <AnimatePresence initial={false}>
                      {selections.map((selection, index) => (
                        <motion.div 
                          key={selection.id} 
                          className="bg-muted/30 p-3 rounded-md"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2, delay: index * 0.05 }}
                        >
                          <div className="flex justify-between mb-1">
                            <span className="text-xs font-medium text-muted-foreground">
                              {selection.league}
                            </span>
                            <span className="text-xs">
                              {new Date(selection.startTime).toLocaleString('en-US', { 
                                month: 'short', 
                                day: 'numeric',
                                hour: 'numeric',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                          <div className="flex justify-between mb-1">
                            <span className="font-medium">{selection.homeTeam} vs {selection.awayTeam}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <div className="flex items-center gap-1">
                              <span className="text-primary">
                                {formatPrediction(selection.prediction, selection.valueBet?.market || '')}
                              </span>
                              <Badge 
                                variant="outline" 
                                className="text-xs h-5 bg-background"
                              >
                                {selection.odds.toFixed(2)}
                              </Badge>
                            </div>
                            <Badge 
                              className={`text-xs ${
                                selection.confidence >= 80 ? 'bg-green-100 text-green-800' : 
                                selection.confidence >= 60 ? 'bg-blue-100 text-blue-800' : 
                                selection.confidence >= 40 ? 'bg-orange-100 text-orange-800' : 
                                'bg-red-100 text-red-800'
                              }`}
                            >
                              {selection.confidence}%
                            </Badge>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
          
          <div className="flex justify-between items-center text-sm border-t pt-4">
            <div>
              <div className="font-medium">Total Odds</div>
              <div className="text-xl font-bold">{totalOdds}</div>
            </div>
            <div className="text-right">
              <div className="font-medium">Potential Return</div>
              <div className="text-xl font-bold text-green-600 dark:text-green-400">{potentialReturn}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
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
  const queryClient = useQueryClient();
  const [riskLevel, setRiskLevel] = useState<'safe' | 'balanced' | 'risky' | 'high-risk' | 'ultra'>('balanced');
  const [filterSport, setFilterSport] = useState<string>('all');
  const [selectedTab, setSelectedTab] = useState<string>('recommended');
  const [date, setDate] = useState<Date>(new Date());
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [showCustomBuilder, setShowCustomBuilder] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [savedAccumulators, setSavedAccumulators] = useState<string[]>([]);
  
  // Create a flag to completely disable further API requests on errors
  const [apiDisabled, setApiDisabled] = useState(false);
  
  // Date handling
  const formattedDate = format(date, 'MMMM dd, yyyy');
  const isCurrentDate = isToday(date);
  
  // Add error handling separately with a ref to ensure we only show one toast message
  const errorHandled = React.useRef(false);
  
  // Fetch all accumulators package with different types from API
  const { data: accumulatorsData, isLoading: loadingAccumulators, error: accumulatorsError, refetch: refetchAccumulators } = useQuery<any>({
    queryKey: ['/api/accumulators-package', { sport: filterSport, risk: riskLevel, date: format(date, 'yyyy-MM-dd') }],
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    refetchOnWindowFocus: false,
    retry: false, // Disable automatic retries
    retryDelay: 1000,
    enabled: !apiDisabled && retryCount < 3, // Completely disable when flag is set or after 3 failures
    refetchInterval: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchIntervalInBackground: false,
    gcTime: 0, // Don't cache failed requests
  });
  
  // Create a dedicated retry function that intelligently handles retries
  const handleRetry = useCallback(async () => {
    // If API is disabled, show message and don't retry
    if (apiDisabled) {
      toast({
        title: "API Disabled",
        description: "API requests have been disabled due to persistent errors. Try again later or create a custom accumulator.",
        variant: "destructive",
        duration: 5000
      });
      setShowCustomBuilder(true);
      return null;
    }
    
    // Reset error handled flag when manually retrying
    errorHandled.current = false;
    
    const currentRetryCount = retryCount + 1;
    setRetryCount(currentRetryCount);
    
    // If we've already tried multiple times and it's still failing,
    // show a more detailed toast message and disable API
    if (currentRetryCount >= 2) {
      toast({
        title: "API Quota Limit Reached",
        description: "We're experiencing high traffic. Try again later or create a custom accumulator.",
        variant: "destructive",
        duration: 5000
      });
      
      // Disable API and show custom builder
      setApiDisabled(true);
      setShowCustomBuilder(true);
      return null;
    }
    
    try {
      return await refetchAccumulators();
    } catch (err) {
      console.error("Manual retry failed:", err);
      // If we get an error on manual retry, disable API
      setApiDisabled(true);
      return null;
    }
  }, [retryCount, toast, refetchAccumulators, errorHandled, apiDisabled]);
  
  // Auto-detect errors and show custom builder once
  React.useEffect(() => {
    if (accumulatorsError && !errorHandled.current) {
      console.error("Error fetching accumulators:", accumulatorsError);
      
      // Show the custom builder immediately on any error
      setShowCustomBuilder(true);
      
      // Display appropriate error message based on error type
      const errorAny = accumulatorsError as any;
      const isQuotaError = 
        errorAny.message?.includes("quota") || 
        errorAny.status === 429;
      
      const isMatchError = 
        errorAny.message?.includes("upcoming matches") || 
        errorAny.message?.includes("Not enough");
      
      toast({
        title: isQuotaError ? "API Quota Limit Reached" : 
              isMatchError ? "No Matches Available" : 
              "Unable to Generate Accumulators",
        description: isQuotaError ? 
                    "Our sports data API quota limit has been reached. You can create custom accumulators instead." :
                    isMatchError ? 
                    "Not enough upcoming matches found. Try changing the date or create custom accumulators instead." :
                    "We're having trouble generating accumulators. You can create custom ones instead.",
        variant: "destructive",
        duration: 5000,
      });
      
      // Disable further API calls
      setApiDisabled(true);
      
      // Also increase retry count as a backup measure
      if (retryCount < 3) {
        setRetryCount(3);
      }
      
      // Mark that we've handled this error
      errorHandled.current = true;
    }
  }, [accumulatorsError, toast, retryCount, setApiDisabled]);
  
  // Reset API disabled when certain parameters change
  useEffect(() => {
    // If user changes date, sport, or risk level, reset error state
    setApiDisabled(false);
    setRetryCount(0);
    errorHandled.current = false;
  }, [date, filterSport, riskLevel]);
  
  // Process accumulators from API response
  const accumulators = useMemo(() => {
    if (!accumulatorsData) return [];
    
    // Color themes based on risk and sport
    const colorThemes = {
      safe: 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800',
      balanced: 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800',
      risky: 'bg-orange-50 dark:bg-orange-900/10 border-orange-200 dark:border-orange-800',
      'high-risk': 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800',
      ultra: 'bg-purple-50 dark:bg-purple-900/10 border-purple-200 dark:border-purple-800',
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
        
        result.push({
          id: acc.id,
          name: acc.name,
          description: acc.description,
          selections: formattedSelections,
          totalOdds: acc.totalOdds.toFixed(2),
          potentialReturn: `$${(acc.totalOdds * stake).toFixed(2)}`,
          confidence: acc.confidence,
          stake,
          marketType: marketTypeMap[type] || 'mixed',
          sport: acc.sport || 'Soccer',
          icon: sportIcons[acc.sport as keyof typeof sportIcons] || sportIcons.Mixed,
          colorTheme: colorThemes[riskLevel as keyof typeof colorThemes],
          isRecommended: type === 'valueFinder' || type === 'homeWinSpecial' || type === 'weekendBanker' || type === 'longshotHero' || type === 'globalExplorer'
        });
      });
    }
    
    return result;
  }, [accumulatorsData, riskLevel]);
  
  // Filtered accumulators based on tab selection and saved status
  const filteredAccumulators = useMemo(() => {
    if (selectedTab === 'recommended') {
      return accumulators.filter(acc => acc.isRecommended);
    } else if (selectedTab === 'saved') {
      return accumulators.filter(acc => savedAccumulators.includes(acc.id));
    }
    return accumulators;
  }, [accumulators, selectedTab, savedAccumulators]);
  
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

  const handleDateChange = useCallback((newDate: Date | undefined) => {
    if (newDate) {
      setDate(newDate);
      setCalendarOpen(false);
    }
  }, []);

  const handlePreviousDay = useCallback(() => {
    setDate(prevDate => addDays(prevDate, -1));
  }, []);

  const handleNextDay = useCallback(() => {
    setDate(prevDate => addDays(prevDate, 1));
  }, []);

  const handleBookmarkAccumulator = useCallback((id: string) => {
    setSavedAccumulators(prev => {
      if (prev.includes(id)) {
        toast({
          title: "Accumulator Removed",
          description: "The accumulator has been removed from your saved list.",
        });
        return prev.filter(accId => accId !== id);
      } else {
        toast({
          title: "Accumulator Saved",
          description: "The accumulator has been added to your saved list.",
        });
        return [...prev, id];
      }
    });
  }, [toast]);

  const handleCreateCustomAccumulator = useCallback((selections: CustomSelection[], stake: number, riskLevel: string, sport: string) => {
    // In a real implementation, we would send this data to the API
    // but for now we'll just show a success message
    toast({
      title: "Accumulator Created",
      description: "Your custom accumulator has been created successfully",
      variant: "default",
    });
    setShowCustomBuilder(false);
  }, [toast]);

  const showCreateCustomButton = useCallback(() => {
    setShowCustomBuilder(true);
  }, []);

  return (
    <div className="container max-w-7xl mx-auto p-4 animate-in fade-in duration-300">
      <div className="flex flex-col space-y-6">
        {/* Header section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary-600">Accumulator Predictions</h1>
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
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center border-b gap-4">
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
            <div className="flex items-center space-x-2 pb-2 sm:pb-0">
              {/* Create Custom Button - Always visible */}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={showCreateCustomButton}
                className="mr-2 sm:hidden md:flex"
              >
                <PlusCircle className="h-3.5 w-3.5 mr-1" />
                Create Custom
              </Button>
              
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
              {isLoading && retryCount < 3 ? (
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
              ) : showCustomBuilder ? (
                <div className="col-span-full">
                  <CustomAccumulatorBuilder
                    sportFilters={sportFilters.filter(s => s.value !== 'all')}
                    riskLevels={riskLevels}
                    onCancel={() => setShowCustomBuilder(false)}
                    onCreateAccumulator={handleCreateCustomAccumulator}
                  />
                </div>
              ) : accumulatorsError ? (
                <ApiErrorState
                  onRetry={handleRetry}
                  onCreateCustom={() => setShowCustomBuilder(true)}
                  message="We're experiencing an issue with the sports data API. This is likely due to reaching our API quota limit for the day."
                />
              ) : !filteredAccumulators || filteredAccumulators.length === 0 ? (
                <EmptyState
                  date={formattedDate}
                  onCreateCustom={() => setShowCustomBuilder(true)}
                />
              ) : (
                // Accumulator cards
                filteredAccumulators.map((accumulator) => (
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
              {isLoading && retryCount < 3 ? (
                // Loading skeletons
                Array(3).fill(0).map((_, index) => (
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
              ) : !filteredAccumulators || filteredAccumulators.length === 0 ? (
                <EmptyState
                  message="You haven't saved any accumulators yet. Browse the recommended accumulators and click the bookmark icon to save them."
                  onCreateCustom={() => setShowCustomBuilder(true)}
                />
              ) : (
                // Saved accumulator cards
                filteredAccumulators.map((accumulator) => (
                  <AccumulatorCard
                    key={accumulator.id}
                    accumulator={accumulator}
                    onBookmark={() => handleBookmarkAccumulator(accumulator.id)}
                  />
                ))
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="all" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {isLoading && retryCount < 3 ? (
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
              ) : showCustomBuilder ? (
                <div className="col-span-full">
                  <CustomAccumulatorBuilder
                    sportFilters={sportFilters.filter(s => s.value !== 'all')}
                    riskLevels={riskLevels}
                    onCancel={() => setShowCustomBuilder(false)}
                    onCreateAccumulator={handleCreateCustomAccumulator}
                  />
                </div>
              ) : accumulatorsError ? (
                <ApiErrorState
                  onRetry={handleRetry}
                  onCreateCustom={() => setShowCustomBuilder(true)}
                  message="We're experiencing an issue with the sports data API. This is likely due to reaching our API quota limit for the day."
                />
              ) : !filteredAccumulators || filteredAccumulators.length === 0 ? (
                <EmptyState
                  date={formattedDate}
                  onCreateCustom={() => setShowCustomBuilder(true)}
                />
              ) : (
                // All accumulator cards
                filteredAccumulators.map((accumulator) => (
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
        
        {/* Mobile FAB for creating custom accumulator */}
        <div className="fixed bottom-20 right-4 sm:hidden">
          <Button
            onClick={() => setShowCustomBuilder(true)}
            size="icon"
            className="h-12 w-12 rounded-full bg-primary shadow-lg hover:bg-primary/80 text-white"
          >
            <PlusCircle className="h-6 w-6" />
          </Button>
        </div>
      </div>
    </div>
  );
}