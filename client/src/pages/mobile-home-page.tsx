import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { DateSelector } from "@/components/ui/date-selector";
import { SportSelector } from "@/components/ui/sport-selector";
import PredictionCard from "@/components/predictions/prediction-card";
import { useAuth } from "@/hooks/use-auth";
import { format, startOfDay } from 'date-fns';
import { 
  ChevronRight, 
  TrendingUp, 
  Trophy,
  Sparkles,
  BookmarkIcon,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

export default function MobileHomePage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedSport, setSelectedSport] = useState<string>('all');
  const { user } = useAuth();
  const [_, navigate] = useLocation();

  const formattedDate = format(selectedDate, 'yyyy-MM-dd');
  
  // Query for predictions based on selected date and sport
  const { 
    data: predictions, 
    isLoading,
    refetch, 
    isRefetching 
  } = useQuery({
    queryKey: ['/api/predictions', formattedDate, selectedSport],
    enabled: !!user,
  });
  
  // Get top prediction with highest confidence
  const topPrediction = predictions && predictions.length > 0 
    ? [...predictions].sort((a, b) => b.confidence - a.confidence)[0]
    : null;
    
  // Get today's predictions for all other sports
  const otherPredictions = predictions && predictions.length > 0 
    ? predictions.filter(p => p.id !== (topPrediction?.id || 0)).slice(0, 5)
    : [];
  
  // Calculate prediction stats
  const totalPredictions = predictions?.length || 0;
  const confidencePredictions = predictions?.filter(p => p.confidence >= 70).length || 0;
  const highOddsPredictions = predictions?.filter(p => p.odds >= 2.0).length || 0;
  
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
    <div className="pb-8">
      {/* Greeting */}
      <section className="mb-4 mt-2">
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center"
        >
          <div>
            <h1 className="text-xl font-bold">Welcome back, {user?.username || 'User'}</h1>
            <p className="text-sm text-muted-foreground">
              {format(new Date(), 'EEEE, MMMM d')}
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon"
              className="rounded-full"
              onClick={() => refetch()}
            >
              <RefreshCw size={18} className={cn("text-muted-foreground", isRefetching && "animate-spin")} />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              className="rounded-full"
              onClick={() => navigate('/my-picks')}
            >
              <BookmarkIcon size={18} className="text-muted-foreground" />
            </Button>
          </div>
        </motion.div>
      </section>
      
      {/* Date selector */}
      <section className="mb-4 -mx-4">
        <DateSelector
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
        />
      </section>
      
      {/* Top pick of the day */}
      <section className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-bold flex items-center gap-1">
            <Sparkles size={18} className="text-yellow-500" />
            Top Pick Today
          </h2>
        </div>
        
        {isLoading ? (
          <Skeleton className="h-32 w-full rounded-xl" />
        ) : topPrediction ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <PredictionCard
              id={topPrediction.id}
              homeTeam={topPrediction.homeTeam}
              awayTeam={topPrediction.awayTeam}
              league={topPrediction.league}
              sport={topPrediction.sport}
              prediction={topPrediction.prediction}
              market={topPrediction.market}
              odds={topPrediction.odds}
              confidence={topPrediction.confidence}
              startTime={topPrediction.startTime}
              isCorrect={topPrediction.isCorrect}
              isPremium={false}
              isSaved={false}
              onToggleSave={handleToggleSave}
              onSelect={() => handleViewPrediction(topPrediction.id)}
            />
          </motion.div>
        ) : (
          <div className="bg-muted rounded-xl p-4 text-center text-muted-foreground">
            No predictions available for this date
          </div>
        )}
      </section>
      
      {/* Quick stats */}
      <section className="mb-6">
        <div className="grid grid-cols-3 gap-3">
          <motion.div 
            className="bg-gradient-to-br from-primary/10 to-primary/20 rounded-xl p-3"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <div className="mb-1">
              <TrendingUp size={16} className="text-primary" />
            </div>
            <div className="text-lg font-bold">{totalPredictions}</div>
            <div className="text-xs text-muted-foreground">Total Matches</div>
          </motion.div>
          
          <motion.div 
            className="bg-gradient-to-br from-green-500/10 to-green-500/20 rounded-xl p-3"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="mb-1">
              <Trophy size={16} className="text-green-500" />
            </div>
            <div className="text-lg font-bold">{confidencePredictions}</div>
            <div className="text-xs text-muted-foreground">High Confidence</div>
          </motion.div>
          
          <motion.div 
            className="bg-gradient-to-br from-amber-500/10 to-amber-500/20 rounded-xl p-3"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            <div className="mb-1">
              <Sparkles size={16} className="text-amber-500" />
            </div>
            <div className="text-lg font-bold">{highOddsPredictions}</div>
            <div className="text-xs text-muted-foreground">High Odds</div>
          </motion.div>
        </div>
      </section>
      
      {/* Sport Selector */}
      <section className="mb-4 -mx-4">
        <SportSelector
          selectedSport={selectedSport}
          onSelectSport={setSelectedSport}
        />
      </section>
      
      {/* More Predictions */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold">Today's Predictions</h2>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-xs font-medium flex items-center"
            onClick={() => navigate('/predictions')}
          >
            See all
            <ChevronRight size={16} />
          </Button>
        </div>
        
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-28 w-full rounded-xl" />
            ))}
          </div>
        ) : otherPredictions.length > 0 ? (
          <motion.div 
            className="space-y-3"
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            {otherPredictions.map(prediction => (
              <motion.div key={prediction.id} variants={itemVariants}>
                <PredictionCard
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
                  isPremium={false}
                  isSaved={false}
                  onToggleSave={handleToggleSave}
                  onSelect={() => handleViewPrediction(prediction.id)}
                />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="bg-muted rounded-xl p-4 text-center text-muted-foreground">
            No additional predictions available
          </div>
        )}
      </section>
    </div>
  );
}