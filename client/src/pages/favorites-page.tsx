import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { PredictionCard } from '@/components/mobile/prediction-card';
import { FilterSection } from '@/components/mobile/filter-section';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

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
}

export default function FavoritesPage() {
  const { user } = useAuth();
  const [_, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedSports, setSelectedSports] = useState<string[]>([]);
  const [selectedMarkets, setSelectedMarkets] = useState<string[]>([]);
  
  // Fetch user's favorite predictions
  const { 
    data: favorites = [],
    isLoading 
  } = useQuery<Prediction[]>({
    queryKey: ['/api/favorites'],
    enabled: !!user,
  });
  
  // Mutation for removing a prediction from favorites
  const removeFavoriteMutation = useMutation({
    mutationFn: async (predictionId: number) => {
      const res = await apiRequest('DELETE', `/api/favorites/${predictionId}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/favorites'] });
      toast({
        title: "Removed from favorites",
        description: "Prediction has been removed from your favorites",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to remove prediction from favorites",
        variant: "destructive",
      });
    },
  });
  
  // Filter favorites based on selected filters
  const filteredFavorites = favorites.filter(prediction => {
    if (selectedSports.length > 0 && !selectedSports.includes(prediction.sport)) {
      return false;
    }
    
    if (selectedMarkets.length > 0 && !selectedMarkets.includes(prediction.market)) {
      return false;
    }
    
    return true;
  });
  
  // Get all available sports and markets from favorites
  const availableSports = Array.from(new Set(favorites.map(p => p.sport)))
    .map(sport => ({ id: sport, label: sport.charAt(0).toUpperCase() + sport.slice(1) }));
    
  const availableMarkets = Array.from(new Set(favorites.map(p => p.market)))
    .map(market => ({ id: market, label: market }));
  
  // Toggle sport selection
  const handleToggleSport = (sportId: string) => {
    setSelectedSports(prev => 
      prev.includes(sportId)
        ? prev.filter(id => id !== sportId)
        : [...prev, sportId]
    );
  };
  
  // Toggle market selection
  const handleToggleMarket = (marketId: string) => {
    setSelectedMarkets(prev => 
      prev.includes(marketId)
        ? prev.filter(id => id !== marketId)
        : [...prev, marketId]
    );
  };
  
  // View prediction details
  const handleViewPrediction = (id: number) => {
    navigate(`/prediction/${id}`);
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
  
  // Group favorites by result status
  const getStatusIcon = (prediction: Prediction) => {
    if (prediction.isCorrect === true) {
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    } else if (prediction.isCorrect === false) {
      return <XCircle className="w-4 h-4 text-red-500" />;
    } else {
      return <Clock className="w-4 h-4 text-amber-500" />;
    }
  };
  
  return (
    <div className="pb-20">
      {/* Header */}
      <section className="mb-4 mt-2">
        <h1 className="text-xl font-bold mb-4">Favorites</h1>
        
        {/* Filters */}
        {favorites.length > 0 && (
          <FilterSection 
            selectedSports={selectedSports}
            onSportToggle={handleToggleSport}
            availableSports={availableSports}
            selectedMarkets={selectedMarkets}
            onMarketToggle={handleToggleMarket}
            availableMarkets={availableMarkets}
          />
        )}
      </section>
      
      {/* Favorites list */}
      <section>
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-24 w-full rounded-lg" />
            ))}
          </div>
        ) : filteredFavorites.length > 0 ? (
          <motion.div
            className="space-y-2"
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            {filteredFavorites.map(prediction => (
              <motion.div key={prediction.id} variants={itemVariants}>
                <PredictionCard
                  homeTeam={prediction.homeTeam}
                  awayTeam={prediction.awayTeam}
                  league={prediction.league}
                  date={prediction.startTime}
                  odds={prediction.odds}
                  prediction={prediction.prediction}
                  isSaved={true}
                  onToggleSave={() => removeFavoriteMutation.mutate(prediction.id)}
                  onClick={() => handleViewPrediction(prediction.id)}
                />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="bg-muted rounded-xl p-6 text-center text-muted-foreground">
            <p className="mb-2">You haven't saved any predictions yet</p>
            <p className="text-sm">
              Add predictions to your favorites by tapping the heart icon on any prediction
            </p>
          </div>
        )}
      </section>
    </div>
  );
}