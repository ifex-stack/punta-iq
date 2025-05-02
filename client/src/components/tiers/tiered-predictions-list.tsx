import React, { useState } from 'react';
import { TieredPredictionCard } from './tiered-prediction-card';
import { TierSelector } from './tier-selector';
import { TierInfoCard } from './tier-info-card';
import { TierLevel } from './tier-badge';
import { Prediction, useTieredPredictions } from '@/hooks/use-tiered-predictions';
import { 
  Select, 
  SelectContent, 
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useAuth } from '@/hooks/use-auth';
import { Loader2, AlertCircle, Lock, Filter } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface TieredPredictionsListProps {
  initialSport?: string;
  initialTier?: TierLevel | 'all';
  showFilter?: boolean;
  showTiers?: boolean;
  className?: string;
}

export function TieredPredictionsList({
  initialSport = 'football',
  initialTier = 'all',
  showFilter = true,
  showTiers = true,
  className
}: TieredPredictionsListProps) {
  const [savedPredictions, setSavedPredictions] = useState<string[]>([]);
  const [accumulatorSelections, setAccumulatorSelections] = useState<string[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();
  
  const isPremiumUser = user?.subscriptionTier && ['pro', 'elite'].includes(user.subscriptionTier);
  
  // Use the tiered predictions hook
  const { 
    predictions, 
    tierPredictions,
    isLoading, 
    error,
    selectedTier, 
    setSelectedTier,
    selectedSport, 
    setSelectedSport,
    refreshData,
    isPremiumUser: apiPremiumUser
  } = useTieredPredictions({
    initialTier,
    initialSport
  });
  
  // Function to determine if a prediction is accessible
  const isPredictionAccessible = (prediction: Prediction): boolean => {
    return !prediction.isPremium || (isPremiumUser === true);
  };
  
  // Handle saving a prediction
  const handleSavePrediction = (id: string) => {
    if (savedPredictions.includes(id)) {
      setSavedPredictions(savedPredictions.filter(predId => predId !== id));
      toast({
        title: "Prediction removed",
        description: "Prediction removed from saved list",
      });
    } else {
      setSavedPredictions([...savedPredictions, id]);
      toast({
        title: "Prediction saved",
        description: "Prediction added to your saved list",
      });
    }
  };
  
  // Handle adding a prediction to accumulator
  const handleAddToAccumulator = (id: string) => {
    if (accumulatorSelections.includes(id)) {
      setAccumulatorSelections(accumulatorSelections.filter(predId => predId !== id));
      toast({
        title: "Removed from accumulator",
        description: "Prediction removed from your accumulator",
      });
    } else {
      setAccumulatorSelections([...accumulatorSelections, id]);
      toast({
        title: "Added to accumulator",
        description: "Prediction added to your accumulator",
      });
    }
  };
  
  // Define available sports
  const sports = [
    { id: 'football', name: 'Football' },
    { id: 'basketball', name: 'Basketball' }
  ];
  
  // Render error state
  if (error) {
    return (
      <Alert variant="destructive" className="mb-8">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error loading predictions</AlertTitle>
        <AlertDescription>
          {error instanceof Error ? error.message : "Failed to load predictions. Please try again."}
        </AlertDescription>
      </Alert>
    );
  }
  
  // Render loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading predictions...</p>
      </div>
    );
  }
  
  // Render tier info cards
  const renderTierInfoCards = () => {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <TierInfoCard tier="Tier 1" compact={true} />
        <TierInfoCard tier="Tier 2" compact={true} />
        <TierInfoCard tier="Tier 5" compact={true} />
        <TierInfoCard tier="Tier 10" compact={true} />
      </div>
    );
  };

  // Get predictions to display based on selected tier
  const getDisplayPredictions = (): Prediction[] => {
    if (selectedTier === 'all') {
      return predictions;
    } else {
      const tierNumber = selectedTier.split(' ')[1];
      const tierKey = `tier${tierNumber}` as keyof typeof tierPredictions;
      return tierPredictions[tierKey] || [];
    }
  };
  
  // Count accessible and premium predictions
  const accessibleCount = predictions.filter(p => isPredictionAccessible(p)).length;
  const premiumCount = predictions.filter(p => p.isPremium).length;
  
  return (
    <div className={cn("space-y-6", className)}>
      {/* Tier info display */}
      {showTiers && renderTierInfoCards()}
      
      {/* Filters */}
      {showFilter && (
        <div className="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
          <TierSelector
            selectedTier={selectedTier}
            onTierChange={setSelectedTier}
            className="w-full sm:w-auto"
          />
          
          <div className="flex flex-col xs:flex-row gap-2 w-full sm:w-auto">
            <Select
              value={selectedSport}
              onValueChange={setSelectedSport}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Select sport" />
              </SelectTrigger>
              <SelectContent>
                {sports.map(sport => (
                  <SelectItem key={sport.id} value={sport.id}>
                    {sport.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button
              variant="outline"
              size="sm"
              className="h-10"
              onClick={() => refreshData()}
            >
              Refresh
            </Button>
          </div>
        </div>
      )}
      
      {/* Premium access alert */}
      {!isPremiumUser && premiumCount > 0 && (
        <Alert className="bg-primary/5 border-primary/20">
          <Lock className="h-4 w-4 text-primary" />
          <AlertTitle>Premium predictions available</AlertTitle>
          <AlertDescription className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <span>
              {premiumCount} premium predictions require a Pro or Elite subscription
            </span>
            <Button
              size="sm"
              onClick={() => window.location.href = "/subscription-page"}
            >
              Upgrade Now
            </Button>
          </AlertDescription>
        </Alert>
      )}
      
      {/* Empty state */}
      {getDisplayPredictions().length === 0 && (
        <div className="text-center py-12 border rounded-lg bg-muted/20">
          <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No predictions found</h3>
          <p className="text-muted-foreground mb-4">
            {selectedTier !== 'all' 
              ? `There are no ${selectedTier} predictions available for ${selectedSport}.`
              : `There are no predictions available for ${selectedSport}.`}
          </p>
          <Button
            variant="outline"
            onClick={() => {
              setSelectedTier('all');
              refreshData();
            }}
          >
            View all predictions
          </Button>
        </div>
      )}
      
      {/* Predictions list */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {getDisplayPredictions().map((prediction) => (
          <TieredPredictionCard
            key={prediction.id}
            prediction={prediction}
            isSaved={savedPredictions.includes(prediction.id)}
            isInAccumulator={accumulatorSelections.includes(prediction.id)}
            onSave={handleSavePrediction}
            onAddToAccumulator={handleAddToAccumulator}
            subscriptionStatus={user?.subscriptionTier || 'free'}
            isAccessible={isPredictionAccessible(prediction)}
          />
        ))}
      </div>
    </div>
  );
}