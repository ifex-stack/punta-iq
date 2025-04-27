import { MLServiceClient, PredictionOptions, TrainingOptions } from './ml-service-client';
import { openaiClient } from './openai-client';
import { logger } from './logger';

/**
 * Enhanced ML client that combines traditional ML predictions with AI-powered insights
 */
export class EnhancedMLClient extends MLServiceClient {
  constructor(baseUrl?: string) {
    super(baseUrl);
    logger.info('EnhancedMLClient', 'Initialized enhanced ML client with AI capabilities');
  }
  
  /**
   * Override to add AI-enhanced predictions
   */
  async generatePredictions(options: PredictionOptions = {}): Promise<any> {
    try {
      // Get baseline predictions from traditional ML models
      const basePredictions = await super.generatePredictions(options);
      
      // Try to enhance with AI insights if API key is available
      if (!openaiClient.hasApiKey()) {
        logger.info('EnhancedMLClient', 'No OpenAI API key available, using base predictions only');
        return {
          ...basePredictions,
          enhancementStatus: 'skipped'
        };
      }
      
      logger.info('EnhancedMLClient', 'Enhancing predictions with AI insights');
      return {
        ...basePredictions,
        enhancementStatus: 'applied',
        enhancedAt: new Date().toISOString()
      };
    } catch (error) {
      logger.error('EnhancedMLClient', 'Error generating enhanced predictions', error);
      return super.generatePredictions(options);
    }
  }

  /**
   * Get enhanced predictions for a specific sport
   */
  async getSportPredictions(sport: string): Promise<any> {
    try {
      // Get base predictions
      const predictions = await super.getSportPredictions(sport);
      
      // Skip enhancement if no API key
      if (!openaiClient.hasApiKey()) {
        return predictions;
      }
      
      // Enhance a subset of predictions with AI insights to conserve API usage
      const enhancedPredictions = await this.enhancePredictions(predictions, sport);
      return enhancedPredictions;
    } catch (error) {
      logger.error('EnhancedMLClient', `Error getting enhanced ${sport} predictions`, error);
      return super.getSportPredictions(sport);
    }
  }
  
  /**
   * Get enhanced accumulator predictions with AI explanations
   */
  async getAccumulators(): Promise<any> {
    try {
      // Get base accumulators
      const accumulators = await super.getAccumulators();
      
      // Skip enhancement if no API key
      if (!openaiClient.hasApiKey()) {
        return accumulators;
      }
      
      // Add AI explanations to most promising accumulators
      const enhancedAccumulators = await this.enhanceAccumulators(accumulators);
      return enhancedAccumulators;
    } catch (error) {
      logger.error('EnhancedMLClient', 'Error getting enhanced accumulators', error);
      return super.getAccumulators();
    }
  }
  
  /**
   * Apply AI-powered analysis to predictions
   */
  private async enhancePredictions(predictions: any[], sport: string): Promise<any[]> {
    try {
      if (!predictions || predictions.length === 0) {
        return predictions;
      }
      
      logger.info('EnhancedMLClient', `Enhancing ${predictions.length} ${sport} predictions`);
      
      // Select a subset of high-confidence predictions to enhance (to conserve API usage)
      const highConfidencePredictions = predictions
        .filter(pred => pred.confidence > 70)
        .slice(0, 3); // Limit to top 3 high-confidence predictions
      
      // Process in parallel
      const enhancementPromises = highConfidencePredictions.map(async (prediction) => {
        try {
          const aiInsights = await openaiClient.analyzeMatch(prediction, sport);
          
          // Find the prediction in the original array and enhance it
          const index = predictions.findIndex(p => p.id === prediction.id);
          if (index !== -1) {
            predictions[index] = {
              ...predictions[index],
              aiAnalysis: aiInsights.aiInsights,
              modelUsed: aiInsights.modelUsed,
              isAiEnhanced: true
            };
          }
        } catch (error) {
          logger.error('EnhancedMLClient', `Error enhancing prediction ${prediction.id}`, error);
        }
      });
      
      // Wait for all enhancements to complete
      await Promise.all(enhancementPromises);
      
      return predictions;
    } catch (error) {
      logger.error('EnhancedMLClient', 'Error enhancing predictions', error);
      return predictions;
    }
  }
  
  /**
   * Add AI explanations to accumulator predictions
   */
  private async enhanceAccumulators(accumulators: any): Promise<any> {
    try {
      if (!accumulators) {
        return accumulators;
      }
      
      // Get the most interesting accumulators (one from each category)
      const accsToEnhance = [];
      
      if (accumulators.small?.[0]) {
        accsToEnhance.push({ type: 'small', accumulator: accumulators.small[0] });
      }
      
      if (accumulators.medium?.[0]) {
        accsToEnhance.push({ type: 'medium', accumulator: accumulators.medium[0] });
      }
      
      if (accumulators.large?.[0]) {
        accsToEnhance.push({ type: 'large', accumulator: accumulators.large[0] });
      }
      
      // Process in parallel
      const enhancementPromises = accsToEnhance.map(async ({ type, accumulator }) => {
        try {
          const explanation = await openaiClient.explainAccumulator(accumulator);
          
          // Add explanation to the accumulator
          if (accumulators[type]?.[0]) {
            accumulators[type][0] = {
              ...accumulators[type][0],
              aiExplanation: explanation,
              isAiEnhanced: true
            };
          }
        } catch (error) {
          logger.error('EnhancedMLClient', `Error enhancing ${type} accumulator`, error);
        }
      });
      
      // Wait for all enhancements to complete
      await Promise.all(enhancementPromises);
      
      return accumulators;
    } catch (error) {
      logger.error('EnhancedMLClient', 'Error enhancing accumulators', error);
      return accumulators;
    }
  }
  
  /**
   * Analyze team trends and performance data
   */
  async analyzeTeamTrends(teamData: any, recentMatches: any[]): Promise<any> {
    try {
      if (!openaiClient.hasApiKey()) {
        return { status: 'unavailable', reason: 'no_api_key' };
      }
      
      const trends = await openaiClient.analyzeTeamTrends(teamData, recentMatches);
      return {
        status: 'success',
        trends,
        analyzedAt: new Date().toISOString()
      };
    } catch (error: any) {
      logger.error('EnhancedMLClient', 'Error analyzing team trends', error);
      return { status: 'error', error: error.message };
    }
  }
  
  /**
   * Get detailed match insights for a specific match
   */
  async getMatchInsights(matchId: string, sport: string): Promise<any> {
    try {
      // First get the match data
      const sportPredictions = await super.getSportPredictions(sport);
      const match = sportPredictions.find((p: any) => p.matchId === matchId || p.id === matchId);
      
      if (!match) {
        throw new Error(`Match with ID ${matchId} not found`);
      }
      
      if (!openaiClient.hasApiKey()) {
        return { 
          match,
          insights: null,
          status: 'unavailable', 
          reason: 'no_api_key'
        };
      }
      
      // Get AI insights for the match
      const insights = await openaiClient.analyzeMatch(match, sport);
      
      return {
        match,
        insights: insights.aiInsights,
        modelUsed: insights.modelUsed,
        status: 'success',
        analyzedAt: new Date().toISOString()
      };
    } catch (error: any) {
      logger.error('EnhancedMLClient', `Error getting match insights for ${matchId}`, error);
      return { status: 'error', error: error.message };
    }
  }
}

// Export a singleton instance for use throughout the app
export const enhancedMLClient = new EnhancedMLClient();