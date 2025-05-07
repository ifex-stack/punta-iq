// Subscription tiers in order of increasing access
export const SUBSCRIPTION_TIERS = ['free', 'basic', 'pro', 'elite'] as const;
export type SubscriptionTier = typeof SUBSCRIPTION_TIERS[number];

// Mock subscription tiers mapping to feature access levels
export interface FeatureAccess {
  dailyPredictionCount: number;
  premiumPredictions: boolean;
  vipPredictions: boolean;
  advancedStats: boolean;
  expertAnalysis: boolean;
  enhancedAccumulators: boolean;
  maxSelections: number;
  customNotifications: boolean;
  oddsComparison: boolean;
  bettingStrategyTools: boolean;
  historicalDataMonths: number;
  prioritySupport: boolean;
  phoneSupport: boolean;
  sportCount: number;
}

// Feature access map based on subscription tier
export const TIER_FEATURES: Record<SubscriptionTier, FeatureAccess> = {
  free: {
    dailyPredictionCount: 3,
    premiumPredictions: false,
    vipPredictions: false,
    advancedStats: false,
    expertAnalysis: false,
    enhancedAccumulators: false,
    maxSelections: 2,
    customNotifications: false,
    oddsComparison: false,
    bettingStrategyTools: false,
    historicalDataMonths: 1,
    prioritySupport: false,
    phoneSupport: false,
    sportCount: 2,
  },
  basic: {
    dailyPredictionCount: 10,
    premiumPredictions: false,
    vipPredictions: false,
    advancedStats: false,
    expertAnalysis: false,
    enhancedAccumulators: false,
    maxSelections: 4,
    customNotifications: false,
    oddsComparison: false,
    bettingStrategyTools: false,
    historicalDataMonths: 3,
    prioritySupport: false,
    phoneSupport: false,
    sportCount: 4,
  },
  pro: {
    dailyPredictionCount: 25,
    premiumPredictions: true,
    vipPredictions: false,
    advancedStats: true,
    expertAnalysis: false,
    enhancedAccumulators: true,
    maxSelections: 6,
    customNotifications: true,
    oddsComparison: true,
    bettingStrategyTools: false,
    historicalDataMonths: 12,
    prioritySupport: true,
    phoneSupport: false,
    sportCount: 8,
  },
  elite: {
    dailyPredictionCount: -1, // Unlimited
    premiumPredictions: true,
    vipPredictions: true,
    advancedStats: true,
    expertAnalysis: true,
    enhancedAccumulators: true,
    maxSelections: -1, // Unlimited
    customNotifications: true,
    oddsComparison: true,
    bettingStrategyTools: true,
    historicalDataMonths: -1, // All available
    prioritySupport: true,
    phoneSupport: true,
    sportCount: -1, // All available
  },
};

/**
 * Check if a user has access to a particular feature based on their subscription tier
 */
export function hasFeatureAccess(
  userTier: SubscriptionTier | undefined | null,
  feature: keyof FeatureAccess
): boolean {
  if (!userTier) return false;
  
  // For boolean features, just return the value
  const featureValue = TIER_FEATURES[userTier][feature];
  if (typeof featureValue === 'boolean') {
    return featureValue;
  }
  
  // For numeric features, check if they have a value greater than 0
  // Negative values mean unlimited access
  return featureValue !== 0;
}

/**
 * Get the feature value for a particular user tier
 */
export function getFeatureValue<K extends keyof FeatureAccess>(
  userTier: SubscriptionTier | undefined | null,
  feature: K
): FeatureAccess[K] | null {
  if (!userTier) return null;
  return TIER_FEATURES[userTier][feature];
}

/**
 * Convert a plan ID to a subscription tier
 */
export function planIdToTier(planId?: string | null): SubscriptionTier {
  if (!planId) return 'free';
  
  switch(planId) {
    case 'basic':
      return 'basic';
    case 'pro':
      return 'pro';
    case 'elite':
      return 'elite';
    default:
      return 'free';
  }
}

/**
 * Format a feature value for display
 */
export function formatFeatureValue(value: number): string {
  if (value < 0) return 'Unlimited';
  return value.toString();
}

/**
 * Get human-readable description of feature limit
 */
export function getFeatureDescription(tier: SubscriptionTier, feature: keyof FeatureAccess): string {
  const value = TIER_FEATURES[tier][feature];
  
  // Handle boolean values
  if (typeof value === 'boolean') {
    return value ? 'Available' : 'Not available';
  }
  
  // Handle numeric values - using type assertion since we've checked for boolean already
  const numericValue = value as number;
  
  switch(feature) {
    case 'dailyPredictionCount':
      return numericValue < 0 ? 'Unlimited predictions daily' : `${numericValue} predictions daily`;
    case 'historicalDataMonths':
      return numericValue < 0 ? 'Full historical data access' : `${numericValue} months of historical data`;
    case 'maxSelections':
      return numericValue < 0 ? 'Unlimited selections in accumulators' : `Up to ${numericValue} selections in accumulators`;
    case 'sportCount':
      return numericValue < 0 ? 'All sports covered' : `${numericValue} sports covered`;
    default:
      return `${numericValue}`;
  }
}