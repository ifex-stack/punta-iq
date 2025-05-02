import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { TierLevel } from '@/components/tiers/tier-badge';
import { Prediction } from './use-tiered-predictions';

export type AccumulatorSize = 'small' | 'medium' | 'large' | 'mega';
export type TierCategory = 'tier1' | 'tier2' | 'tier5' | 'tier10';

export interface Accumulator {
  id: string;
  matches: Prediction[];
  size: number;
  tier: TierLevel;
  totalOdds: number;
  confidence: number;
  selections: {
    match: {
      homeTeam: string;
      awayTeam: string;
      league: string;
      startTime: string;
    };
    prediction: string;
    odds: number;
    confidence: number;
  }[];
  createdAt: string;
  sport: string;
  isPremium: boolean;
}

export interface AccumulatorMetadata {
  tiers: Record<TierCategory, {
    name: string;
    description: string;
    isPremium: boolean;
  }>;
  timestamp: string;
  updateFrequency: string;
}

export interface AccumulatorsResponse {
  accumulators: Record<string, Accumulator[]>;
  count: number;
  metadata: AccumulatorMetadata;
  isPremiumUser: boolean;
  userTier: string;
}

export interface UseTieredAccumulatorsOptions {
  initialTier?: TierLevel | 'all';
  initialCategory?: TierCategory | 'all';
  initialSize?: number;
}

export function useTieredAccumulators(options: UseTieredAccumulatorsOptions = {}) {
  const {
    initialTier = 'all',
    initialCategory = 'all',
    initialSize
  } = options;

  const [selectedTier, setSelectedTier] = useState<TierLevel | 'all'>(initialTier);
  const [selectedCategory, setSelectedCategory] = useState<TierCategory | 'all'>(initialCategory);
  const [selectedSize, setSelectedSize] = useState<number | undefined>(initialSize);

  // Build query parameters
  const buildQueryKey = () => {
    const key = ['/api/microservice/predictions/accumulators'];
    const params: Record<string, string | number> = {};
    
    if (selectedTier !== 'all') {
      params.tier = selectedTier;
    }
    
    if (selectedCategory !== 'all') {
      params.tierCategory = selectedCategory;
    }
    
    if (selectedSize !== undefined) {
      params.size = selectedSize;
    }
    
    if (Object.keys(params).length > 0) {
      key.push(params);
    }
    
    return key;
  };

  // Get accumulators based on filters
  const { 
    data,
    isLoading,
    error,
    refetch
  } = useQuery<AccumulatorsResponse>({
    queryKey: buildQueryKey(),
  });

  // Get categories that are available
  const getAvailableCategories = (): TierCategory[] => {
    if (!data || !data.accumulators) return [];
    return Object.keys(data.accumulators) as TierCategory[];
  };
  
  // Get accumulators for a specific category
  const getAccumulatorsByCategory = (category: TierCategory): Accumulator[] => {
    if (!data || !data.accumulators) return [];
    return data.accumulators[category] || [];
  };
  
  // Get all accumulators across all categories
  const getAllAccumulators = (): Accumulator[] => {
    if (!data || !data.accumulators) return [];
    
    return Object.values(data.accumulators).flat();
  };
  
  // Check if user has premium access
  const isPremiumUser = data?.isPremiumUser || false;
  
  // User subscription tier
  const userTier = data?.userTier || 'free';
  
  // Check if a category has accumulators
  const hasCategoryAccumulators = (category: TierCategory): boolean => {
    if (!data || !data.accumulators) return false;
    return !!data.accumulators[category] && data.accumulators[category].length > 0;
  };

  return {
    accumulators: getAllAccumulators(),
    accumulatorsByCategory: {
      tier1: getAccumulatorsByCategory('tier1'),
      tier2: getAccumulatorsByCategory('tier2'),
      tier5: getAccumulatorsByCategory('tier5'),
      tier10: getAccumulatorsByCategory('tier10')
    },
    availableCategories: getAvailableCategories(),
    hasCategoryAccumulators,
    metadata: data?.metadata,
    isLoading,
    error,
    selectedTier,
    setSelectedTier,
    selectedCategory,
    setSelectedCategory,
    selectedSize,
    setSelectedSize,
    refreshData: refetch,
    isPremiumUser,
    userTier,
    totalCount: data?.count || 0
  };
}