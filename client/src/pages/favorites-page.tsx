import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, BookmarkCheck, BookmarkX, BarChart3 } from 'lucide-react';
import { PredictionCard } from '@/components/mobile/prediction-card';

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
  isSaved: boolean;
}

export default function FavoritesPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('all');
  
  // Query for saved predictions
  const { 
    data: savedPredictions = [], 
    isLoading 
  } = useQuery<Prediction[]>({
    queryKey: ['/api/predictions/saved'],
    enabled: !!user,
  });
  
  // Filter predictions based on their status
  const allPredictions = savedPredictions;
  const pendingPredictions = savedPredictions.filter(p => p.isCorrect === null);
  const wonPredictions = savedPredictions.filter(p => p.isCorrect === true);
  const lostPredictions = savedPredictions.filter(p => p.isCorrect === false);
  
  // Handle unsave prediction
  const handleUnsave = (predictionId: number) => {
    // API call to unsave prediction would go here
    console.log('Unsaved prediction', predictionId);
  };
  
  // Get active predictions list based on tab
  const getActivePredictions = () => {
    switch (activeTab) {
      case 'pending': return pendingPredictions;
      case 'won': return wonPredictions;
      case 'lost': return lostPredictions;
      default: return allPredictions;
    }
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
    <div className="pb-20">
      {/* Header */}
      <section className="mb-4 mt-2">
        <h1 className="text-xl font-bold mb-4">Favorites</h1>
      </section>
      
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-4 mb-6">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="won">Won</TabsTrigger>
          <TabsTrigger value="lost">Lost</TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeTab} className="mt-0">
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4].map(i => (
                <Skeleton key={i} className="h-24 w-full rounded-lg" />
              ))}
            </div>
          ) : getActivePredictions().length > 0 ? (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="space-y-2"
            >
              {getActivePredictions().map(prediction => (
                <motion.div key={prediction.id} variants={itemVariants}>
                  <PredictionCard
                    homeTeam={prediction.homeTeam}
                    awayTeam={prediction.awayTeam}
                    league={prediction.league}
                    date={prediction.startTime}
                    odds={prediction.odds}
                    prediction={prediction.prediction}
                    isSaved={true}
                    onToggleSave={() => handleUnsave(prediction.id)}
                  />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="text-center p-8 space-y-4">
              <div className="bg-muted inline-flex h-16 w-16 rounded-full items-center justify-center mx-auto">
                <BookmarkX className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold">No Saved Predictions</h3>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                Save predictions you're interested in to track them in one place.
              </p>
              <Button 
                className="mt-2" 
                onClick={() => window.location.href = '/explore'}
              >
                Browse Predictions
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      {/* Stats Summary */}
      {!isLoading && savedPredictions.length > 0 && (
        <div className="mt-8 pt-6 border-t">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="h-4 w-4" /> Performance Summary
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-green-500/10 p-3 rounded-lg text-center">
              <p className="text-xs text-muted-foreground mb-1">Won</p>
              <p className="text-xl font-bold text-green-600">{wonPredictions.length}</p>
            </div>
            <div className="bg-amber-500/10 p-3 rounded-lg text-center">
              <p className="text-xs text-muted-foreground mb-1">Pending</p>
              <p className="text-xl font-bold text-amber-600">{pendingPredictions.length}</p>
            </div>
            <div className="bg-red-500/10 p-3 rounded-lg text-center">
              <p className="text-xs text-muted-foreground mb-1">Lost</p>
              <p className="text-xl font-bold text-red-600">{lostPredictions.length}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}