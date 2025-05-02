import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { TierLevel } from '@/components/tiers/tier-badge';
import { ConfidenceLevel } from '@/components/tiers/confidence-indicator';
import { ValueBet } from '@/components/tiers/value-bet-indicator';

export interface Prediction {
  id: string;
  matchId: string;
  sport: string;
  createdAt: string;
  homeTeam: string;
  awayTeam: string;
  startTime: string;
  league: string;
  predictedOutcome: string;
  confidence: number;
  confidenceLevel: ConfidenceLevel;
  confidence_explanation?: string;
  tier: TierLevel;
  isPremium: boolean;
  valueBet?: ValueBet;
  predictions: Record<string, any>;
}

export interface PredictionMetadata {
  sport: {
    name: string;
    competitions: string[];
  };
  confidence_levels: Record<string, {
    range: string;
    description: string;
  }>;
  tiers: Record<string, {
    description: string;
    isPremium: boolean;
  }>;
}

export interface PredictionsResponse {
  predictions: Prediction[];
  metadata: PredictionMetadata;
  isPremiumUser: boolean;
  userTier: string;
}

export interface TieredPredictionsResponse {
  tier1: Prediction[];
  tier2: Prediction[];
  tier5: Prediction[];
  tier10: Prediction[];
  metadata: {
    tiers: Record<string, {
      description: string;
      isPremium: boolean;
    }>;
    timestamp: string;
  };
  isPremiumUser: boolean;
  userTier: string;
}

export interface UseTieredPredictionsOptions {
  initialTier?: TierLevel | 'all';
  initialSport?: string;
  minConfidence?: number;
}

export function useTieredPredictions(options: UseTieredPredictionsOptions = {}) {
  const {
    initialTier = 'all',
    initialSport = 'football',
    minConfidence
  } = options;

  const [selectedTier, setSelectedTier] = useState<TierLevel | 'all'>(initialTier);
  const [selectedSport, setSelectedSport] = useState<string>(initialSport);

  // Get all predictions organized by tier
  const {
    data: tieredData,
    isLoading: tieredLoading,
    error: tieredError,
    refetch: refetchTiered
  } = useQuery<TieredPredictionsResponse>({
    queryKey: ['/api/microservice/predictions/tiers'],
    enabled: selectedTier === 'all',
  });

  // Get sport-specific predictions with tier filtering
  const {
    data: sportData,
    isLoading: sportLoading,
    error: sportError,
    refetch: refetchSport
  } = useQuery<PredictionsResponse>({
    queryKey: [
      '/api/microservice/predictions/sports', 
      selectedSport, 
      selectedTier !== 'all' ? selectedTier : undefined,
      minConfidence
    ],
    enabled: selectedTier !== 'all',
  });

  // Combined loading state
  const isLoading = selectedTier === 'all' ? tieredLoading : sportLoading;
  
  // Combined error state
  const error = selectedTier === 'all' ? tieredError : sportError;
  
  // Get all predictions based on filter
  const getPredictions = (): Prediction[] => {
    if (selectedTier === 'all' && tieredData) {
      // Combine all tiers
      return [
        ...tieredData.tier1,
        ...tieredData.tier2,
        ...tieredData.tier5,
        ...tieredData.tier10
      ];
    } else if (sportData) {
      return sportData.predictions;
    }
    return [];
  };
  
  // Get predictions for a specific tier
  const getPredictionsByTier = (tier: TierLevel): Prediction[] => {
    if (selectedTier === 'all' && tieredData) {
      switch (tier) {
        case 'Tier 1': return tieredData.tier1;
        case 'Tier 2': return tieredData.tier2;
        case 'Tier 5': return tieredData.tier5;
        case 'Tier 10': return tieredData.tier10;
      }
    } else if (sportData) {
      return sportData.predictions.filter(p => p.tier === tier);
    }
    return [];
  };
  
  // Check if user has premium access
  const isPremiumUser = 
    (selectedTier === 'all' && tieredData?.isPremiumUser) || 
    (sportData?.isPremiumUser);
  
  // User subscription tier
  const userTier = 
    (selectedTier === 'all' && tieredData?.userTier) || 
    sportData?.userTier || 
    'free';
  
  // Refresh data
  const refreshData = () => {
    if (selectedTier === 'all') {
      refetchTiered();
    } else {
      refetchSport();
    }
  };

  return {
    predictions: getPredictions(),
    tierPredictions: {
      tier1: getPredictionsByTier('Tier 1'),
      tier2: getPredictionsByTier('Tier 2'),
      tier5: getPredictionsByTier('Tier 5'),
      tier10: getPredictionsByTier('Tier 10')
    },
    metadata: selectedTier === 'all' ? tieredData?.metadata : sportData?.metadata,
    isLoading,
    error,
    selectedTier,
    setSelectedTier,
    selectedSport,
    setSelectedSport,
    refreshData,
    isPremiumUser,
    userTier
  };
}