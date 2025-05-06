import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { DateSelector } from "@/components/ui/date-selector";
import { SportSelector } from "@/components/ui/sport-selector";
import PredictionCard from "@/components/predictions/prediction-card";
import { useAuth } from "@/hooks/use-auth";
import { format } from 'date-fns';
import { 
  Filter,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  SearchIcon,
  SlidersHorizontal
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Drawer } from 'vaul';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export default function MobileExplorePage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedSport, setSelectedSport] = useState<string>('all');
  const [showLeagues, setShowLeagues] = useState<boolean>(false);
  const [confidenceRange, setConfidenceRange] = useState<[number, number]>([50, 100]);
  const [oddsRange, setOddsRange] = useState<[number, number]>([1.1, 5]);
  const [selectedLeagues, setSelectedLeagues] = useState<string[]>([]);
  const [selectedMarkets, setSelectedMarkets] = useState<string[]>(['Match Result']);
  const { user } = useAuth();
  const [_, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState<string>('');

  const formattedDate = format(selectedDate, 'yyyy-MM-dd');
  
  // Query for predictions based on filters
  const { 
    data: predictions, 
    isLoading,
    refetch, 
    isRefetching 
  } = useQuery({
    queryKey: ['/api/predictions', formattedDate, selectedSport, confidenceRange, oddsRange, selectedLeagues, selectedMarkets],
    enabled: !!user,
  });
  
  // Filter predictions based on search query
  const filteredPredictions = predictions && predictions.length > 0
    ? predictions.filter(p => {
        if (!searchQuery) return true;
        
        const query = searchQuery.toLowerCase();
        return (
          p.homeTeam.toLowerCase().includes(query) || 
          p.awayTeam.toLowerCase().includes(query) ||
          p.league.toLowerCase().includes(query)
        );
      })
    : [];
    
  // Get unique leagues for the sport filter
  const availableLeagues = predictions && predictions.length > 0
    ? [...new Set(predictions.map(p => p.league))]
    : [];
    
  // Get unique markets for the market filter
  const availableMarkets = predictions && predictions.length > 0
    ? [...new Set(predictions.map(p => p.market))]
    : ['Match Result', 'Over/Under', 'Both Teams to Score', 'Handicap'];
    
  // Toggle saved prediction
  const handleToggleSave = (id: number) => {
    console.log(`Toggling saved state for prediction ${id}`);
    // Here you would call an API to save/unsave a prediction
  };
  
  // View prediction details
  const handleViewPrediction = (id: number) => {
    console.log(`Viewing prediction details for ${id}`);
    navigate(`/prediction/${id}`);
  };
  
  // Toggle league selection
  const handleToggleLeague = (league: string) => {
    setSelectedLeagues(prev => 
      prev.includes(league) 
        ? prev.filter(l => l !== league)
        : [...prev, league]
    );
  };
  
  // Toggle market selection
  const handleToggleMarket = (market: string) => {
    setSelectedMarkets(prev => 
      prev.includes(market) 
        ? prev.filter(m => m !== market)
        : [...prev, market]
    );
  };
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 }
  };
  
  // Group predictions by league
  const predictionsByLeague = filteredPredictions.reduce((acc, prediction) => {
    const league = prediction.league;
    if (!acc[league]) {
      acc[league] = [];
    }
    acc[league].push(prediction);
    return acc;
  }, {} as Record<string, typeof predictions>);
  
  return (
    <div className="pb-8">
      {/* Header */}
      <section className="mb-3 mt-2">
        <div className="flex justify-between items-center mb-3">
          <h1 className="text-xl font-bold">Explore Predictions</h1>
          <div className="flex items-center gap-2">
            {/* Search button */}
            <Button 
              variant="ghost" 
              size="icon"
              className="rounded-full"
              onClick={() => document.getElementById('search-input')?.focus()}
            >
              <SearchIcon size={18} className="text-muted-foreground" />
            </Button>
            
            {/* Refresh button */}
            <Button 
              variant="ghost" 
              size="icon"
              className="rounded-full"
              onClick={() => refetch()}
            >
              <RefreshCw size={18} className={cn("text-muted-foreground", isRefetching && "animate-spin")} />
            </Button>
            
            {/* Filter drawer */}
            <Drawer.Root>
              <Drawer.Trigger asChild>
                <Button 
                  variant="outline" 
                  size="icon"
                  className="rounded-full"
                >
                  <SlidersHorizontal size={18} />
                </Button>
              </Drawer.Trigger>
              <Drawer.Portal>
                <Drawer.Overlay className="fixed inset-0 bg-black/40" />
                <Drawer.Content className="bg-background flex flex-col rounded-t-[10px] h-[90%] mt-24 fixed bottom-0 left-0 right-0">
                  <div className="p-4 bg-muted-foreground/5 rounded-t-[10px] flex-1 overflow-auto">
                    <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-muted-foreground/20 mb-4" />
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold mb-4">Filters</h3>
                      
                      {/* Confidence range */}
                      <div className="mb-6">
                        <Label className="text-sm mb-3 block">
                          Confidence: {confidenceRange[0]}% - {confidenceRange[1]}%
                        </Label>
                        <Slider
                          defaultValue={confidenceRange}
                          min={0}
                          max={100}
                          step={5}
                          onValueChange={(value) => setConfidenceRange(value as [number, number])}
                          className="my-4"
                        />
                      </div>
                      
                      {/* Odds range */}
                      <div className="mb-6">
                        <Label className="text-sm mb-3 block">
                          Odds: {oddsRange[0].toFixed(1)} - {oddsRange[1].toFixed(1)}
                        </Label>
                        <Slider
                          defaultValue={oddsRange}
                          min={1.1}
                          max={10}
                          step={0.1}
                          onValueChange={(value) => setOddsRange(value as [number, number])}
                          className="my-4"
                        />
                      </div>
                      
                      {/* Market types */}
                      <div className="mb-6">
                        <h4 className="text-sm font-medium mb-3">Market Types</h4>
                        <div className="grid grid-cols-2 gap-2">
                          {availableMarkets.map(market => (
                            <div key={market} className="flex items-center space-x-2">
                              <Switch
                                id={`market-${market}`}
                                checked={selectedMarkets.includes(market)}
                                onCheckedChange={() => handleToggleMarket(market)}
                              />
                              <Label htmlFor={`market-${market}`}>{market}</Label>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {/* Leagues */}
                      <div className="mb-4">
                        <h4 className="text-sm font-medium mb-3">Leagues</h4>
                        <div className="grid grid-cols-1 gap-2 max-h-52 overflow-y-auto pr-2">
                          {availableLeagues.map(league => (
                            <div key={league} className="flex items-center space-x-2">
                              <Switch
                                id={`league-${league}`}
                                checked={selectedLeagues.length === 0 || selectedLeagues.includes(league)}
                                onCheckedChange={() => handleToggleLeague(league)}
                              />
                              <Label htmlFor={`league-${league}`}>{league}</Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    {/* Action buttons */}
                    <div className="flex gap-2 mt-4">
                      <Button 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => {
                          setConfidenceRange([50, 100]);
                          setOddsRange([1.1, 5]);
                          setSelectedLeagues([]);
                          setSelectedMarkets(['Match Result']);
                        }}
                      >
                        Reset
                      </Button>
                      <Button className="flex-1" onClick={() => (document.querySelector('[data-vaul-drawer-trigger]') as HTMLElement)?.click()}>
                        Apply
                      </Button>
                    </div>
                  </div>
                </Drawer.Content>
              </Drawer.Portal>
            </Drawer.Root>
          </div>
        </div>
        
        {/* Search input */}
        <div className="mb-4">
          <div className="relative">
            <SearchIcon size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <Input
              id="search-input"
              placeholder="Search teams or leagues..."
              className="pl-9 bg-muted/40"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </section>
      
      {/* Date selector */}
      <section className="mb-4 -mx-4">
        <DateSelector
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
        />
      </section>
      
      {/* Sport selector */}
      <section className="mb-4 -mx-4">
        <SportSelector
          selectedSport={selectedSport}
          onSelectSport={setSelectedSport}
        />
      </section>
      
      {/* Predictions by league */}
      <section>
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-8 w-1/3" />
                <Skeleton className="h-28 w-full rounded-xl" />
                <Skeleton className="h-28 w-full rounded-xl" />
              </div>
            ))}
          </div>
        ) : Object.entries(predictionsByLeague).length > 0 ? (
          <motion.div 
            className="space-y-6"
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            {Object.entries(predictionsByLeague).map(([league, leaguePredictions]) => (
              <motion.div key={league} variants={itemVariants}>
                <div 
                  className="flex items-center justify-between mb-2 cursor-pointer"
                  onClick={() => setShowLeagues(prev => !prev)}
                >
                  <h2 className="text-base font-bold flex items-center gap-1">
                    {league}
                    <Badge variant="outline" className="text-xs ml-2">
                      {leaguePredictions.length}
                    </Badge>
                  </h2>
                  <Button variant="ghost" size="sm" className="p-0 h-6 w-6">
                    {showLeagues ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </Button>
                </div>
                
                <div className="space-y-2">
                  {leaguePredictions.map(prediction => (
                    <PredictionCard
                      key={prediction.id}
                      id={prediction.id}
                      homeTeam={prediction.homeTeam}
                      awayTeam={prediction.awayTeam}
                      league={prediction.league}
                      sport={prediction.sport}
                      prediction={prediction.prediction}
                      market={prediction.market}
                      odds={prediction.odds}
                      confidence={prediction.confidence}
                      startTime={prediction.startTime}
                      isCorrect={prediction.isCorrect}
                      compact={true}
                      showLeague={false}
                      isPremium={false}
                      isSaved={false}
                      onToggleSave={handleToggleSave}
                      onSelect={() => handleViewPrediction(prediction.id)}
                    />
                  ))}
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="bg-muted rounded-xl p-6 text-center text-muted-foreground">
            <p className="mb-2">No predictions match your filters</p>
            <Button 
              variant="outline" 
              onClick={() => {
                setConfidenceRange([50, 100]);
                setOddsRange([1.1, 5]);
                setSelectedLeagues([]);
                setSelectedMarkets(['Match Result']);
                setSearchQuery('');
              }}
              className="mt-2"
            >
              Reset Filters
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}