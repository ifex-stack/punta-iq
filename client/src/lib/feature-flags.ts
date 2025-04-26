// Feature flags configuration system
// This allows gradual rollout of features and A/B testing

import { useEffect, useState } from 'react';

// Default feature flags
const DEFAULT_FLAGS = {
  // Core features
  chatbot: true,
  notifications: true,
  historicalDashboard: true,
  
  // Premium features
  accumulators: true,
  premiumPredictions: true,
  
  // User experience and onboarding
  onboarding: true,
  gettingStartedGuide: true,
  featureHighlights: true,
  demoNotifications: true,
  
  // New and experimental features  
  socialSharing: false,
  userCommunity: false,
  predictionComments: false,
  trendingPredictions: false,
  
  // Regional features
  nigeriaSpecificContent: true,
  ukSpecificContent: true,
  
  // Marketing and engagement
  referralProgram: false,
  achievementBadges: false,
  streakRewards: false,
};

// Feature flag types
export type FeatureFlags = typeof DEFAULT_FLAGS;
export type FeatureFlagKey = keyof FeatureFlags;

// Get a single feature flag 
export function getFeatureFlag(key: FeatureFlagKey): boolean {
  // First check localStorage for override
  const localOverride = localStorage.getItem(`feature_${key}`);
  if (localOverride !== null) {
    return localOverride === 'true';
  }
  
  // Then check for server-defined flags (if we've loaded them)
  const serverFlags = localStorage.getItem('server_feature_flags');
  if (serverFlags) {
    try {
      const parsed = JSON.parse(serverFlags);
      if (key in parsed) {
        return parsed[key];
      }
    } catch (e) {
      console.error('Failed to parse server feature flags', e);
    }
  }
  
  // Fall back to default
  return DEFAULT_FLAGS[key];
}

// Set a local feature flag (for testing/development)
export function setFeatureFlag(key: FeatureFlagKey, value: boolean): void {
  localStorage.setItem(`feature_${key}`, value.toString());
}

// Reset a local feature flag to use the default
export function resetFeatureFlag(key: FeatureFlagKey): void {
  localStorage.removeItem(`feature_${key}`);
}

// Hook for using feature flags in components
export function useFeatureFlag(key: FeatureFlagKey): boolean {
  const [isEnabled, setIsEnabled] = useState<boolean>(() => getFeatureFlag(key));
  
  useEffect(() => {
    // Update state when feature flag changes
    const checkFlag = () => {
      const currentValue = getFeatureFlag(key);
      setIsEnabled(currentValue);
    };
    
    // Check on window focus, in case flags were changed in another tab
    window.addEventListener('focus', checkFlag);
    
    // Clean up event listener
    return () => {
      window.removeEventListener('focus', checkFlag);
    };
  }, [key]);
  
  return isEnabled;
}

// Fetch server-side feature flags (to be called during app initialization)
export async function fetchFeatureFlags(): Promise<void> {
  try {
    const response = await fetch('/api/feature-flags');
    if (response.ok) {
      const flags = await response.json();
      localStorage.setItem('server_feature_flags', JSON.stringify(flags));
    }
  } catch (error) {
    console.error('Failed to fetch feature flags', error);
  }
}