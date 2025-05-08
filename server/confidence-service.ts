import { storage } from './storage';
import { Prediction } from '@shared/schema';

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
 * Generate confidence factors based on match and prediction data
 */
function generateConfidenceFactors(prediction: Prediction): ConfidenceFactor[] {
  // Extract factors from confidence factors JSON if available
  if (prediction.confidenceFactors && typeof prediction.confidenceFactors === 'object') {
    try {
      // Convert stored factors to the expected format
      const storedFactors = Object.entries(prediction.confidenceFactors as Record<string, any>)
        .map(([key, value]): ConfidenceFactor => {
          // Map the type to a valid confidence factor type
          const factorType = key as ConfidenceFactor['type'];
          
          // Format the name for display (capitalize, replace underscores with spaces)
          const name = key.replace(/_/g, ' ')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
            
          return {
            name,
            value: typeof value === 'number' ? value : 60, // Default to 60 if invalid
            type: factorType,
            description: getFactorDescription(factorType),
          };
        })
        .filter(factor => factor.value > 0); // Filter out zero factors
        
      if (storedFactors.length > 0) {
        return storedFactors;
      }
    } catch (error) {
      console.error('Error parsing confidence factors:', error);
    }
  }
  
  // Fallback factors if not available in the prediction
  const homeAdvantage: ConfidenceFactor = {
    name: 'Home Advantage',
    value: 65,
    type: 'home_advantage',
    description: getFactorDescription('home_advantage')
  };
  
  const marketValue: ConfidenceFactor = {
    name: 'Market Value',
    value: prediction.valueRating ? prediction.valueRating * 10 : 60,
    type: 'market_movement',
    description: getFactorDescription('market_movement')
  };
  
  const modelConsensus: ConfidenceFactor = {
    name: 'AI Model Consensus',
    value: prediction.confidence,
    type: 'model_consensus',
    description: getFactorDescription('model_consensus')
  };
  
  return [homeAdvantage, marketValue, modelConsensus];
}

/**
 * Get description for a confidence factor type
 */
function getFactorDescription(factorType: ConfidenceFactor['type']): string {
  switch (factorType) {
    case 'form':
      return 'Recent team performance and form evaluation.';
    case 'head_to_head':
      return 'Historical results between the two teams.';
    case 'home_advantage':
      return 'Statistical advantage for the home team based on historical data.';
    case 'injuries':
      return 'Impact of team injuries and player availability.';
    case 'motivation':
      return 'Team motivation factors such as importance of the match.';
    case 'weather':
      return 'Weather conditions and their expected impact on the match.';
    case 'fatigue':
      return 'Team fatigue based on recent schedule and travel.';
    case 'historical_odds':
      return 'Historical odds accuracy for similar matches.';
    case 'market_movement':
      return 'Recent movements in betting markets and implied probabilities.';
    case 'model_consensus':
      return 'Confidence level from multiple AI prediction models.';
    case 'expert_opinion':
      return 'Opinions from sports analysts and experts.';
    case 'user_preference':
      return 'Personalized factor based on your preferences and betting history.';
    default:
      return 'Confidence factor affecting the prediction outcome.';
  }
}

/**
 * Generate a baseline confidence breakdown for a prediction
 */
export async function generateBaseConfidenceBreakdown(
  predictionId: number
): Promise<ConfidenceBreakdown | null> {
  try {
    const prediction = await storage.getPredictionById(predictionId);
    if (!prediction) {
      return null;
    }
    
    // Generate confidence factors from prediction data
    const factors = generateConfidenceFactors(prediction);
    
    // Calculate base confidence (simple average of factor values)
    const baseConfidence = factors.reduce((sum, factor) => sum + factor.value, 0) / factors.length;
    
    // Either use stored base confidence or calculate it
    const baseValue = prediction.baseConfidence || baseConfidence;
    
    return {
      overall: prediction.confidence,
      base: baseValue,
      personal: prediction.confidence, // Same as overall for base case
      factors,
      algorithmVersion: prediction.personalizedConfidenceAlgorithm || "1.0"
    };
  } catch (error) {
    console.error('Error generating base confidence breakdown:', error);
    return null;
  }
}

/**
 * Generate personalized confidence breakdown for a user and prediction
 */
export async function generatePersonalizedConfidenceBreakdown(
  userId: number,
  predictionId: number
): Promise<ConfidenceBreakdown | null> {
  try {
    // Get base confidence breakdown
    const baseBreakdown = await generateBaseConfidenceBreakdown(predictionId);
    if (!baseBreakdown) {
      return null;
    }
    
    // Get prediction and user data
    const prediction = await storage.getPredictionById(predictionId);
    const user = await storage.getUser(userId);
    
    if (!prediction || !user) {
      return baseBreakdown; // Return base if either is missing
    }
    
    // Get user preferences
    const userPreferences = user.userPreferences || {};
    
    // Personal factors based on user preferences
    const personalFactors: ConfidenceFactor[] = [];
    
    // Check if sport is a favorite
    if (userPreferences.favoriteSports?.includes(prediction.sport)) {
      personalFactors.push({
        name: 'Favorite Sport',
        value: 75,
        type: 'user_preference',
        description: 'Confidence boost for predictions in your favorite sports.'
      });
    }
    
    // Check if league is a favorite
    if (userPreferences.favoriteLeagues?.includes(prediction.league)) {
      personalFactors.push({
        name: 'Favorite League',
        value: 80,
        type: 'user_preference',
        description: 'Confidence boost for predictions in your favorite leagues.'
      });
    }
    
    // Determine confidence adjustment based on risk tolerance
    let confidenceAdjustment = 0;
    if (userPreferences.riskTolerance === 'low') {
      confidenceAdjustment = -5; // More conservative for low risk
    } else if (userPreferences.riskTolerance === 'high') {
      confidenceAdjustment = 5; // More aggressive for high risk
    }
    
    // Combine all factors
    const allFactors = [...baseBreakdown.factors];
    
    // Add personal factors
    personalFactors.forEach(factor => {
      allFactors.push(factor);
    });
    
    // Add risk preference if there's an adjustment
    if (confidenceAdjustment !== 0) {
      allFactors.push({
        name: 'Risk Preference',
        value: 50 + confidenceAdjustment * 5, // Convert to 0-100 scale
        type: 'user_preference',
        description: `Confidence adjustment based on your ${userPreferences.riskTolerance || 'medium'} risk tolerance.`
      });
    }
    
    // Check if this prediction is in a market type the user prefers
    if (prediction.market && 
        userPreferences.predictionFilters?.marketTypes?.[prediction.market.toLowerCase()]) {
      personalFactors.push({
        name: 'Preferred Market',
        value: 70,
        type: 'user_preference',
        description: 'This is a market type you follow frequently.'
      });
    }
    
    // Calculate personalized confidence
    // Average the base confidence with personal factors if any exist
    let personalizedConfidence = baseBreakdown.base;
    
    if (personalFactors.length > 0) {
      const personalFactorsAvg = personalFactors.reduce((sum, factor) => sum + factor.value, 0) / 
                                personalFactors.length;
      
      // Weight base 70%, personal 30%
      personalizedConfidence = (baseBreakdown.base * 0.7) + (personalFactorsAvg * 0.3);
      
      // Apply risk adjustment
      personalizedConfidence += confidenceAdjustment;
      
      // Ensure within 0-100 range
      personalizedConfidence = Math.min(100, Math.max(0, personalizedConfidence));
    }
    
    return {
      overall: personalizedConfidence,
      base: baseBreakdown.base,
      personal: personalizedConfidence,
      factors: allFactors,
      algorithmVersion: baseBreakdown.algorithmVersion
    };
  } catch (error) {
    console.error('Error generating personalized confidence breakdown:', error);
    return null;
  }
}