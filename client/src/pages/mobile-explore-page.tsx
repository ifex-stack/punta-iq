import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Filter, ChevronDown } from 'lucide-react';
import { PredictionCard } from '@/components/mobile/prediction-card';
import { FilterSection } from '@/components/mobile/filter-section';

// Define the Prediction type
interface Prediction {
  id: number;
  homeTeam: string;
  awayTeam: string;
  league: string;
  sport: string;
  market: string;
  prediction: string;
  odds: number;
  confidence: number;
  startTime: string;
  isCorrect: boolean | null;
  isPremium?: boolean;
}

export default function MobileExplorePage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [savedPredictions, setSavedPredictions] = useState<number[]>([]);
  
  // Filter states
  const [selectedSports, setSelectedSports] = useState<string[]>(['football']);
  const [selectedMarkets, setSelectedMarkets] = useState<string[]>(['win']);
  
  // Available filter options
  const availableSports = [
    { id: 'football', label: 'Football' },
    { id: 'basketball', label: 'Basketball' },
    { id: 'tennis', label: 'Tennis' },
    { id: 'hockey', label: 'Hockey' },
    { id: 'baseball', label: 'Baseball' },
  ];
  
  const availableMarkets = [
    { id: 'win', label: 'Win' },
    { id: 'over_under', label: 'Over/Under' },
    { id: 'both_score', label: 'Both Teams Score' },
    { id: 'handicap', label: 'Handicap' },
    { id: 'correct_score', label: 'Correct Score' },
  ];
  
  // Query for predictions
  const { 
    data: predictions = [], 
    isLoading
  } = useQuery<Prediction[]>({
    queryKey: ['/api/predictions/explore', selectedSports, selectedMarkets],
    enabled: !!user,
  });
  
  // Handle sport selection
  const handleSportToggle = (sportId: string) => {
    setSelectedSports(prev => 
      prev.includes(sportId)
        ? prev.filter(id => id !== sportId)
        : [...prev, sportId]
    );
  };
  
  // Handle market selection
  const handleMarketToggle = (marketId: string) => {
    setSelectedMarkets(prev => 
      prev.includes(marketId)
        ? prev.filter(id => id !== marketId)
        : [...prev, marketId]
    );
  };
  
  // Handle save/unsave predictions
  const handleToggleSave = (predictionId: number) => {
    setSavedPredictions(prev => 
      prev.includes(predictionId)
        ? prev.filter(id => id !== predictionId)
        : [...prev, predictionId]
    );
  };
  
  // Filter predictions based on search query
  const filteredPredictions = predictions.filter(prediction => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      prediction.homeTeam.toLowerCase().includes(query) ||
      prediction.awayTeam.toLowerCase().includes(query) ||
      prediction.league.toLowerCase().includes(query)
    );
  });
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };
  
  return (
    <div className="pb-20">
      {/* Header */}
      <section className="mb-4 mt-2">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-bold">Explore</h1>
          <Button 
            variant="outline" 
            size="sm" 
            className="h-9 flex gap-1 items-center"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={14} />
            <span className="text-xs">Filters</span>
            <ChevronDown 
              size={14} 
              className={`transition-transform ${showFilters ? 'rotate-180' : 'rotate-0'}`} 
            />
          </Button>
        </div>
        
        {/* Search input */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search teams, leagues..."
            className="pl-10 h-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </section>
      
      {/* Filters */}
      {showFilters && (
        <Card className="p-4 mb-4">
          <FilterSection
            selectedSports={selectedSports}
            onSportToggle={handleSportToggle}
            availableSports={availableSports}
            selectedMarkets={selectedMarkets}
            onMarketToggle={handleMarketToggle}
            availableMarkets={availableMarkets}
          />
        </Card>
      )}
      
      {/* Predictions */}
      <section>
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map(i => (
              <Skeleton key={i} className="h-24 w-full rounded-lg" />
            ))}
          </div>
        ) : filteredPredictions.length > 0 ? (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-2"
          >
            {filteredPredictions.map(prediction => (
              <motion.div key={prediction.id} variants={itemVariants}>
                <PredictionCard
                  homeTeam={prediction.homeTeam}
                  awayTeam={prediction.awayTeam}
                  league={prediction.league}
                  date={prediction.startTime}
                  odds={prediction.odds}
                  prediction={prediction.prediction}
                  isSaved={savedPredictions.includes(prediction.id)}
                  onToggleSave={() => handleToggleSave(prediction.id)}
                  onClick={() => console.log('Navigate to prediction details', prediction.id)}
                />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="text-center p-6 bg-muted rounded-lg">
            <p className="text-muted-foreground">No predictions match your filters</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2"
              onClick={() => {
                setSelectedSports(['football']);
                setSelectedMarkets(['win']);
                setSearchQuery('');
              }}
            >
              Reset Filters
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}