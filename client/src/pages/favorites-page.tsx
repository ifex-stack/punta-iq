import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { Helmet } from "react-helmet";
import { MobileAppLayout } from '@/components/layout/mobile-app-layout';
import { 
  Heart,
  RefreshCw,
  Clock,
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
  AlertTriangle
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import PredictionCard from '@/components/predictions/prediction-card';
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from '@/hooks/use-auth';

export default function FavoritesPage() {
  const [_, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState('upcoming');
  const { user } = useAuth();
  
  // Query for saved predictions
  const { 
    data: savedPredictions, 
    isLoading,
    isError,
    refetch,
    isRefetching
  } = useQuery({
    queryKey: ['/api/predictions/saved'],
    enabled: !!user,
  });
  
  // Filter predictions based on status
  const upcomingPredictions = savedPredictions?.filter(p => !p.isCorrect === undefined) || [];
  const completedPredictions = savedPredictions?.filter(p => p.isCorrect !== undefined) || [];
  
  // Grouping predictions by sport for better organization
  const groupPredictionsBySport = (predictions: any[]) => {
    return predictions.reduce((acc, prediction) => {
      const sport = prediction.sport;
      if (!acc[sport]) {
        acc[sport] = [];
      }
      acc[sport].push(prediction);
      return acc;
    }, {});
  };
  
  const upcomingBySport = groupPredictionsBySport(upcomingPredictions);
  const completedBySport = groupPredictionsBySport(completedPredictions);
  
  // Toggle saved prediction
  const handleToggleSave = (id: number) => {
    console.log(`Toggling saved state for prediction ${id}`);
    // Here you would call an API to save/unsave a prediction
  };
  
  // View prediction details
  const handleViewPrediction = (id: number) => {
    navigate(`/prediction/${id}`);
  };
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.05
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { type: "spring", stiffness: 300, damping: 24 }
    }
  };
  
  const renderPredictionGroups = (groupedPredictions: Record<string, any[]>) => {
    if (Object.keys(groupedPredictions).length === 0) {
      return (
        <div className="bg-muted rounded-xl p-6 text-center text-muted-foreground">
          <Heart className="h-12 w-12 mx-auto mb-3 text-muted-foreground/60" />
          <p className="mb-2">No saved predictions yet</p>
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
    
    return Object.entries(groupedPredictions).map(([sport, predictions]) => (
      <motion.div key={sport} variants={itemVariants} className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-base font-bold capitalize">{sport}</h3>
          <Badge variant="outline" className="text-xs">
            {predictions.length} picks
          </Badge>
        </div>
        
        <div className="space-y-3">
          {predictions.map(prediction => (
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
              showLeague={true}
              isPremium={false}
              isSaved={true}
              onToggleSave={() => handleToggleSave(prediction.id)}
              onSelect={() => handleViewPrediction(prediction.id)}
            />
          ))}
        </div>
      </motion.div>
    ));
  };
  
  return (
    <MobileAppLayout activeTab="favorites">
      <Helmet>
        <title>My Favorites - PuntaIQ</title>
      </Helmet>
      
      <div className="mb-16 pt-2">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold">Favorites</h1>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={() => refetch()}
          >
            <RefreshCw className={cn("h-4 w-4", isRefetching && "animate-spin")} />
          </Button>
        </div>
        
        {/* Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="upcoming" className="text-xs">
              <Clock className="h-3 w-3 mr-1" />
              Upcoming
            </TabsTrigger>
            <TabsTrigger value="completed" className="text-xs">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              Completed
            </TabsTrigger>
          </TabsList>
        </Tabs>
        
        {/* Favorites Content */}
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-28 w-full rounded-xl" />
            <Skeleton className="h-28 w-full rounded-xl" />
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-28 w-full rounded-xl" />
          </div>
        ) : isError ? (
          <div className="p-4 border border-red-300 bg-red-50 rounded-md text-red-600">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              <p className="font-medium">Failed to load favorites</p>
            </div>
            <p className="mt-2 text-sm">Please try again later or contact support if the issue persists.</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => refetch()}
            >
              Retry
            </Button>
          </div>
        ) : (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <TabsContent value="upcoming" className="mt-0">
              {renderPredictionGroups(upcomingBySport)}
            </TabsContent>
            
            <TabsContent value="completed" className="mt-0">
              {renderPredictionGroups(completedBySport)}
            </TabsContent>
          </motion.div>
        )}
      </div>
    </MobileAppLayout>
  );
}