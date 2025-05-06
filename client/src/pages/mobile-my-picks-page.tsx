import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import PredictionCard from "@/components/predictions/prediction-card";
import { useAuth } from "@/hooks/use-auth";
import { 
  RefreshCw,
  Check,
  X,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from "@/components/ui/scroll-area";

type PredictionStatus = 'pending' | 'won' | 'lost' | 'all';

export default function MobileMyPicksPage() {
  const [selectedStatus, setSelectedStatus] = useState<PredictionStatus>('pending');
  const { user } = useAuth();
  const [_, navigate] = useNavigate();

  // Query for saved predictions
  const { 
    data: savedPredictions, 
    isLoading,
    refetch, 
    isRefetching 
  } = useQuery({
    queryKey: ['/api/user/saved-predictions'],
    enabled: !!user,
  });
  
  // Filter predictions based on status
  const getFilteredPredictions = () => {
    if (!savedPredictions || savedPredictions.length === 0) return [];
    
    if (selectedStatus === 'all') return savedPredictions;
    
    return savedPredictions.filter(p => {
      if (selectedStatus === 'pending') return p.isCorrect === null;
      if (selectedStatus === 'won') return p.isCorrect === true;
      if (selectedStatus === 'lost') return p.isCorrect === false;
      return true;
    });
  };
  
  const filteredPredictions = getFilteredPredictions();
  
  // Toggle saved prediction
  const handleToggleSave = (id: number) => {
    console.log(`Removing prediction ${id} from saved list`);
    // Here you would call an API to remove a prediction from saved list
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
        staggerChildren: 0.05
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 }
  };
  
  // Calculate stats
  const totalPredictions = savedPredictions?.length || 0;
  const pendingPredictions = savedPredictions?.filter(p => p.isCorrect === null).length || 0;
  const wonPredictions = savedPredictions?.filter(p => p.isCorrect === true).length || 0;
  const lostPredictions = savedPredictions?.filter(p => p.isCorrect === false).length || 0;
  
  // Calculate win rate
  const completedPredictions = wonPredictions + lostPredictions;
  const winRate = completedPredictions > 0 
    ? Math.round((wonPredictions / completedPredictions) * 100) 
    : 0;
  
  return (
    <div className="pb-8">
      {/* Header */}
      <section className="mb-4 mt-2">
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center"
        >
          <div>
            <h1 className="text-xl font-bold">My Saved Picks</h1>
            <p className="text-sm text-muted-foreground">
              {totalPredictions} predictions saved
            </p>
          </div>
          
          <Button 
            variant="ghost" 
            size="icon"
            className="rounded-full"
            onClick={() => refetch()}
          >
            <RefreshCw size={18} className={cn("text-muted-foreground", isRefetching && "animate-spin")} />
          </Button>
        </motion.div>
      </section>
      
      {/* Stats cards */}
      <section className="mb-6">
        <div className="grid grid-cols-4 gap-2">
          <motion.div 
            className="bg-gradient-to-br from-primary/10 to-primary/20 rounded-xl p-3"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <div className="text-lg font-bold">{winRate}%</div>
            <div className="text-xs text-muted-foreground">Win Rate</div>
          </motion.div>
          
          <motion.div 
            className="bg-gradient-to-br from-muted to-muted/80 rounded-xl p-3"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center space-x-1">
              <Clock size={12} className="text-muted-foreground" />
              <span className="text-lg font-bold">{pendingPredictions}</span>
            </div>
            <div className="text-xs text-muted-foreground">Pending</div>
          </motion.div>
          
          <motion.div 
            className="bg-gradient-to-br from-green-500/10 to-green-500/20 rounded-xl p-3"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center space-x-1">
              <Check size={12} className="text-green-500" />
              <span className="text-lg font-bold">{wonPredictions}</span>
            </div>
            <div className="text-xs text-muted-foreground">Won</div>
          </motion.div>
          
          <motion.div 
            className="bg-gradient-to-br from-red-500/10 to-red-500/20 rounded-xl p-3"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex items-center space-x-1">
              <X size={12} className="text-red-500" />
              <span className="text-lg font-bold">{lostPredictions}</span>
            </div>
            <div className="text-xs text-muted-foreground">Lost</div>
          </motion.div>
        </div>
      </section>
      
      {/* Status Tabs */}
      <section className="mb-6">
        <Tabs 
          defaultValue="pending" 
          className="w-full"
          onValueChange={(value) => setSelectedStatus(value as PredictionStatus)}
        >
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="won">Won</TabsTrigger>
            <TabsTrigger value="lost">Lost</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all">
            {renderPredictionsList(filteredPredictions, isLoading)}
          </TabsContent>
          
          <TabsContent value="pending">
            {renderPredictionsList(filteredPredictions, isLoading)}
          </TabsContent>
          
          <TabsContent value="won">
            {renderPredictionsList(filteredPredictions, isLoading)}
          </TabsContent>
          
          <TabsContent value="lost">
            {renderPredictionsList(filteredPredictions, isLoading)}
          </TabsContent>
        </Tabs>
      </section>
    </div>
  );
  
  // Helper function to render predictions list with proper loading state
  function renderPredictionsList(predictions: any[] | undefined, isLoading: boolean) {
    if (isLoading) {
      return (
        <div className="space-y-3 mt-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      );
    }
    
    if (!predictions || predictions.length === 0) {
      return (
        <div className="bg-muted rounded-xl p-6 text-center text-muted-foreground mt-4">
          <p className="mb-2">No saved predictions in this category</p>
          <Button 
            variant="outline" 
            onClick={() => navigate('/explore')}
            className="mt-2"
          >
            Explore Predictions
          </Button>
        </div>
      );
    }
    
    return (
      <motion.div 
        className="space-y-3 mt-4 max-h-[60vh]"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        <ScrollArea className="h-full pr-4">
          {predictions.map(prediction => (
            <motion.div key={prediction.id} variants={itemVariants} className="mb-3">
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
                isPremium={false}
                isSaved={true}
                onToggleSave={handleToggleSave}
                onSelect={() => handleViewPrediction(prediction.id)}
              />
            </motion.div>
          ))}
        </ScrollArea>
      </motion.div>
    );
  }
}