import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import TopBar from "@/components/layout/top-bar";
import BottomNavigation from "@/components/layout/bottom-navigation";
import PremiumBanner from "@/components/predictions/premium-banner";
import SportsTabs from "@/components/predictions/sports-tabs";
import PredictionCard from "@/components/predictions/prediction-card";
import AccumulatorPanel from "@/components/predictions/accumulator-panel";
import { Loader2 } from "lucide-react";
import { Sport } from "@shared/schema";

type Prediction = {
  id: number;
  matchId: number;
  predictedOutcome: string;
  confidence: number;
  isPremium: boolean;
  isLocked?: boolean;
  additionalPredictions: any;
};

type Match = {
  id: number;
  leagueId: number;
  homeTeam: string;
  awayTeam: string;
  startTime: string;
  homeOdds: number;
  drawOdds: number | null;
  awayOdds: number;
  isCompleted: boolean;
};

type League = {
  id: number;
  sportId: number;
  name: string;
};

type PredictionItem = {
  prediction: Prediction;
  match: Match;
  league: League | null;
  sport: Sport | null;
};

type AccumulatorItem = {
  predictionId: number;
  match: Match;
  outcome: string;
  odds: number;
};

export default function HomePage() {
  const [selectedSportId, setSelectedSportId] = useState<number>(1); // Default to Soccer (sportId: 1)
  const [accumulatorItems, setAccumulatorItems] = useState<AccumulatorItem[]>([]);
  
  // Fetch sports
  const { data: sports, isLoading: isLoadingSports } = useQuery<Sport[]>({
    queryKey: ["/api/sports"],
  });
  
  // Fetch predictions
  const { data: predictions, isLoading: isLoadingPredictions } = useQuery<PredictionItem[]>({
    queryKey: ["/api/predictions/sport", selectedSportId],
    queryFn: async () => {
      const response = await fetch(`/api/predictions/sport/${selectedSportId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch predictions");
      }
      return response.json();
    },
  });
  
  // Calculate total odds for accumulator
  const totalOdds = accumulatorItems.reduce((total, item) => total * item.odds, 1);
  
  // Calculate confidence for accumulator (average confidence weighted by odds)
  const calculateConfidence = () => {
    if (accumulatorItems.length === 0) return 0;
    
    const totalWeight = accumulatorItems.reduce((sum, item) => sum + item.odds, 0);
    const weightedConfidence = accumulatorItems.reduce(
      (sum, item) => sum + (item.odds / totalWeight) * 0.7, // Multiplying by 0.7 to account for combination risk
      0
    );
    
    return Math.round(weightedConfidence * 100);
  };
  
  // Handle adding prediction to accumulator
  const handleAddToAccumulator = (predictionId: number, match: Match, outcome: string, odds: number) => {
    // Check if already in accumulator
    const existingIndex = accumulatorItems.findIndex(item => item.predictionId === predictionId);
    
    if (existingIndex >= 0) {
      // Remove if already exists
      setAccumulatorItems(prev => prev.filter(item => item.predictionId !== predictionId));
    } else {
      // Add new item
      setAccumulatorItems(prev => [
        ...prev, 
        { predictionId, match, outcome, odds }
      ]);
    }
  };
  
  // Handle clearing accumulator
  const handleClearAccumulator = () => {
    setAccumulatorItems([]);
  };
  
  // Handle removing item from accumulator
  const handleRemoveFromAccumulator = (predictionId: number) => {
    setAccumulatorItems(prev => prev.filter(item => item.predictionId !== predictionId));
  };
  
  return (
    <div className="flex flex-col h-screen bg-background">
      <TopBar />
      
      <main className="flex-1 overflow-y-auto">
        <PremiumBanner />
        
        <div className="px-4 mt-4">
          <h2 className="text-lg font-bold text-foreground mb-3">Today's Predictions</h2>
          
          {isLoadingSports ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <SportsTabs 
              sports={sports || []} 
              activeSportId={selectedSportId}
              onSelect={setSelectedSportId}
            />
          )}
        </div>
        
        <div className="px-4 mt-4 pb-4">
          {isLoadingPredictions ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
              <p className="text-muted-foreground">Loading predictions...</p>
            </div>
          ) : predictions && predictions.length > 0 ? (
            <div className="space-y-4">
              {predictions.map((item) => (
                <PredictionCard 
                  key={item.prediction.id}
                  prediction={item.prediction}
                  match={item.match}
                  league={item.league}
                  isInAccumulator={accumulatorItems.some(accItem => accItem.predictionId === item.prediction.id)}
                  onAddToAccumulator={(outcome, odds) => 
                    handleAddToAccumulator(item.prediction.id, item.match, outcome, odds)
                  }
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No predictions available for this sport</p>
            </div>
          )}
        </div>
        
        {accumulatorItems.length > 0 && (
          <div className="mx-4 mb-6">
            <AccumulatorPanel 
              items={accumulatorItems}
              totalOdds={totalOdds.toFixed(2)}
              confidence={calculateConfidence()}
              onClearAll={handleClearAccumulator}
              onRemoveItem={handleRemoveFromAccumulator}
            />
          </div>
        )}
      </main>
      
      <BottomNavigation activePage="predictions" />
    </div>
  );
}
