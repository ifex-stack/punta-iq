import { Prediction } from '@shared/schema';
import { apiRequest } from './queryClient';

export type ConfidenceFactor = {
  name: string;
  value: number; // 0-100
  type: 'form' | 'head_to_head' | 'home_advantage' | 'injuries' | 'motivation' | 
         'weather' | 'fatigue' | 'historical_odds' | 'market_movement' | 
         'model_consensus' | 'expert_opinion' | 'user_preference';
  description: string;
};

export type ConfidenceBreakdown = {
  overall: number;
  base: number;
  personal: number;
  factors: ConfidenceFactor[];
  algorithmVersion: string;
};

/**
 * Get personalized confidence for a prediction using the latest algorithm
 */
export async function getPersonalizedConfidence(predictionId: number): Promise<ConfidenceBreakdown> {
  try {
    const response = await apiRequest('GET', `/api/predictions/${predictionId}/confidence`);
    return await response.json();
  } catch (error) {
    console.error('Error fetching personalized confidence:', error);
    throw error;
  }
}

/**
 * Create a default confidence breakdown from a basic prediction
 * Used as a fallback when personalized confidence is not available
 */
export function createDefaultConfidenceBreakdown(prediction: Prediction): ConfidenceBreakdown {
  // Base factors that contribute to confidence
  const homeAdvantage: ConfidenceFactor = {
    name: 'Home Advantage',
    value: 65,
    type: 'home_advantage',
    description: 'Statistical advantage for the home team based on historical data.'
  };
  
  const marketBasedValue: ConfidenceFactor = {
    name: 'Market Value',
    value: prediction.valueRating ? prediction.valueRating * 10 : 60,
    type: 'market_movement',
    description: 'Confidence based on market odds and value assessment.'
  };
  
  const modelConsensus: ConfidenceFactor = {
    name: 'AI Model Consensus',
    value: prediction.confidence,
    type: 'model_consensus',
    description: 'Confidence level from multiple AI prediction models.'
  };
  
  // Default factors array - would be more complex in a real implementation
  const factors = [homeAdvantage, marketBasedValue, modelConsensus];
  
  // Simple average for the base confidence (in a real system this would be more sophisticated)
  const baseConfidence = factors.reduce((sum, factor) => sum + factor.value, 0) / factors.length;
  
  return {
    overall: prediction.confidence,
    base: baseConfidence,
    personal: prediction.confidence, // Same as overall for default case
    factors,
    algorithmVersion: "1.0"
  };
}

/**
 * Calculate personalized confidence based on user preferences and prediction data
 * This would normally call the AI service, but we're implementing a simplified version here
 */
export function calculatePersonalizedConfidence(
  prediction: Prediction, 
  userPreferences: any
): ConfidenceBreakdown {
  // Start with default breakdown
  const defaultBreakdown = createDefaultConfidenceBreakdown(prediction);
  
  // Personalization factors based on user preferences
  const personalFactors: ConfidenceFactor[] = [];
  
  // User's favorite sports and leagues should boost confidence
  if (userPreferences?.favoriteSports?.includes(prediction.sport)) {
    personalFactors.push({
      name: 'Favorite Sport',
      value: 75,
      type: 'user_preference',
      description: 'Confidence boost for predictions in your favorite sports.'
    });
  }
  
  if (userPreferences?.favoriteLeagues?.includes(prediction.league)) {
    personalFactors.push({
      name: 'Favorite League',
      value: 80,
      type: 'user_preference',
      description: 'Confidence boost for predictions in your favorite leagues.'
    });
  }
  
  // Risk tolerance affects confidence display
  let confidenceAdjustment = 0;
  if (userPreferences?.riskTolerance === 'low') {
    confidenceAdjustment = -5; // More conservative for low risk tolerance
  } else if (userPreferences?.riskTolerance === 'high') {
    confidenceAdjustment = 5; // More aggressive for high risk tolerance
  }
  
  // Combine all factors
  const allFactors = [...defaultBreakdown.factors];
  
  // Add personal factors if they exist
  if (personalFactors.length > 0) {
    allFactors.push(...personalFactors);
  }
  
  // Add user preference adjustment factor if non-zero
  if (confidenceAdjustment !== 0) {
    allFactors.push({
      name: 'Risk Preference',
      value: 50 + confidenceAdjustment * 5,
      type: 'user_preference',
      description: `Confidence adjustment based on your ${userPreferences?.riskTolerance || 'medium'} risk tolerance.`
    });
  }
  
  // Calculate new personal confidence with adjustments
  const personalConfidence = Math.min(
    100, 
    Math.max(
      0, 
      defaultBreakdown.base + confidenceAdjustment
    )
  );
  
  return {
    overall: personalConfidence,
    base: defaultBreakdown.base,
    personal: personalConfidence,
    factors: allFactors,
    algorithmVersion: "1.0"
  };
}