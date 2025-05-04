import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { TierLevel } from '@/components/tiers/tier-badge';
import { useAuth } from '@/hooks/use-auth';
import { Prediction } from './use-tiered-predictions';

// Define accumulator types
export type TierCategory = 'tier1' | 'tier2' | 'tier5' | 'tier10';

export interface AccumulatorSelection {
  match: {
    id: string;
    homeTeam: string;
    awayTeam: string;
    league: string;
    sport: string;
    startTime: string;
  };
  prediction: string;
  odds: number;
  confidence: number;
}

export interface Accumulator {
  id: string;
  tier: string;
  category: TierCategory;
  size: number;
  confidence: number;
  totalOdds: number;
  isPremium: boolean;
  createdAt: string;
  selections: AccumulatorSelection[];
}

// Define response format
export interface AccumulatorsResponse {
  accumulators: Accumulator[];
  accumulatorsByCategory: {
    tier1: Accumulator[];
    tier2: Accumulator[];
    tier5: Accumulator[];
    tier10: Accumulator[];
  };
  metadata: {
    totalCount: number;
    premiumCount: number;
    countByCategory: {
      tier1: number;
      tier2: number;
      tier5: number;
      tier10: number;
    };
  };
  isPremiumUser: boolean;
}

interface UseTieredAccumulatorsOptions {
  initialTier?: TierLevel | 'all';
  initialCategory?: TierCategory | 'all';
  initialSize?: number;
}

export function useTieredAccumulators({ 
  initialTier = 'all',
  initialCategory = 'all',
  initialSize
}: UseTieredAccumulatorsOptions = {}) {
  // State for current filters
  const [selectedTier, setSelectedTier] = useState<TierLevel | 'all'>(initialTier);
  const [selectedCategory, setSelectedCategory] = useState<TierCategory | 'all'>(initialCategory);
  const [selectedSize, setSelectedSize] = useState<number | undefined>(initialSize);
  const { user } = useAuth();
  
  // Fetch tiered accumulators
  const { 
    data, 
    isLoading, 
    error, 
    refetch 
  } = useQuery<AccumulatorsResponse, Error>({
    queryKey: ['/api/accumulators/tiered', selectedTier, selectedCategory, selectedSize, user?.id],
    queryFn: async () => {
      // URL with queryParams
      const params = new URLSearchParams();
      if (selectedTier !== 'all') params.append('tier', selectedTier);
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      if (selectedSize) params.append('size', selectedSize.toString());
      
      // Add the subscription tier if available
      if (user?.subscriptionTier) {
        params.append('subscriptionTier', user.subscriptionTier);
      }
      
      const response = await fetch(`/api/accumulators/tiered?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch tiered accumulators');
      }
      
      return await response.json();
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  // Default to empty arrays if data is not available
  const accumulators = data?.accumulators || [];
  const accumulatorsByCategory = data?.accumulatorsByCategory || {
    tier1: [],
    tier2: [],
    tier5: [],
    tier10: []
  };
  const metadata = data?.metadata || {
    totalCount: 0,
    premiumCount: 0,
    countByCategory: {
      tier1: 0,
      tier2: 0,
      tier5: 0,
      tier10: 0
    }
  };
  const isPremiumUser = data?.isPremiumUser || false;
  
  // Available categories (only those with accumulators)
  const availableCategories: TierCategory[] = Object.entries(metadata.countByCategory)
    .filter(([_, count]) => count > 0)
    .map(([category]) => category as TierCategory);
    
  // Helper to check if a category has accumulators
  const hasCategoryAccumulators = (category: TierCategory): boolean => {
    return metadata.countByCategory[category] > 0;
  };
  
  return {
    accumulators,
    accumulatorsByCategory,
    metadata,
    availableCategories,
    hasCategoryAccumulators,
    isLoading,
    error,
    selectedTier,
    setSelectedTier,
    selectedCategory,
    setSelectedCategory,
    selectedSize,
    setSelectedSize,
    refreshData: refetch,
    isPremiumUser
  };
}