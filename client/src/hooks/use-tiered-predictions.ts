import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { TierLevel } from '@/components/tiers/tier-badge';
import { useAuth } from '@/hooks/use-auth';

// Define prediction interface
export interface Prediction {
  id: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  sport: string;
  startTime: string;
  confidence: number;
  confidence_explanation: string;
  tier: string;
  isPremium: boolean;
  predictedOutcome: string;
  valueBet?: {
    market: string;
    outcome: string;
    edge: number;
    odds: number;
    bookmaker: string;
    explanation: string;
  };
  predictions: {
    '1X2'?: {
      outcome: 'HOME_WIN' | 'DRAW' | 'AWAY_WIN';
      probability: number;
      homeWin: { probability: number; odds: number };
      draw: { probability: number; odds: number };
      awayWin: { probability: number; odds: number };
    };
    'BTTS'?: {
      outcome: 'YES' | 'NO';
      probability: number;
      odds?: number;
      noOdds?: number;
    };
    'Over/Under'?: {
      outcome: 'OVER' | 'UNDER';
      probability: number;
      overOdds: number;
      underOdds: number;
    };
    'Winner'?: {
      outcome: 'HOME_WIN' | 'AWAY_WIN';
      probability: number;
      homeWin: { probability: number; odds: number };
      awayWin: { probability: number; odds: number };
    };
  };
}

// Define response format
interface PredictionsResponse {
  predictions: Prediction[];
  tierPredictions: {
    tier1: Prediction[];
    tier2: Prediction[];
    tier5: Prediction[];
    tier10: Prediction[];
  };
  isPremiumUser: boolean;
}

interface UseTieredPredictionsOptions {
  initialTier?: TierLevel | 'all';
  initialSport?: string;
}

export function useTieredPredictions({ 
  initialTier = 'all',
  initialSport = 'football'
}: UseTieredPredictionsOptions = {}) {
  // State for current filters
  const [selectedTier, setSelectedTier] = useState<TierLevel | 'all'>(initialTier);
  const [selectedSport, setSelectedSport] = useState<string>(initialSport);
  const { user } = useAuth();
  
  // Fetch tiered predictions
  const { 
    data, 
    isLoading, 
    error, 
    refetch 
  } = useQuery<PredictionsResponse, Error>({
    queryKey: ['/api/predictions/tiered', selectedSport, selectedTier, user?.id],
    queryFn: async () => {
      // URL with queryParams
      const params = new URLSearchParams();
      if (selectedSport !== 'all') params.append('sport', selectedSport);
      if (selectedTier !== 'all') params.append('tier', selectedTier);
      
      // Add the subscription tier if available
      if (user?.subscriptionTier) {
        params.append('subscriptionTier', user.subscriptionTier);
      }
      
      const response = await fetch(`/api/predictions/tiered?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch tiered predictions');
      }
      
      return await response.json();
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  // Default to empty arrays if data is not available
  const predictions = data?.predictions || [];
  const tierPredictions = data?.tierPredictions || {
    tier1: [],
    tier2: [],
    tier5: [],
    tier10: []
  };
  const isPremiumUser = data?.isPremiumUser || false;
  
  return {
    predictions,
    tierPredictions,
    isLoading,
    error,
    selectedTier,
    setSelectedTier,
    selectedSport,
    setSelectedSport,
    refreshData: refetch,
    isPremiumUser
  };
}