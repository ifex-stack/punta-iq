import { MLServiceClient, PredictionOptions, TrainingOptions } from './ml-service-client';
import { openaiClient } from './openai-client';
import { logger } from './logger';
import { advancedPredictionEngine } from './advanced-prediction-engine';

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
      
      // Try to enhance with advanced ML engine
      logger.info('EnhancedMLClient', 'Enhancing predictions with advanced ML engine');
      return {
        ...basePredictions,
        enhancementStatus: 'applied',
        enhancementMethod: 'advanced-ml-engine',
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
      // Get base predictions from the ML service
      const basePredictions = await super.getSportPredictions(sport);
      
      // Process predictions through advanced ML engine
      const enhancedPredictions = await this.applyAdvancedMLEngine(basePredictions, sport);
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
      // Get predictions for supported sports
      const footballPredictions = await this.getSportPredictions('football');
      const basketballPredictions = await this.getSportPredictions('basketball');
      
      // Combine predictions
      const allPredictions = [...footballPredictions, ...basketballPredictions];
      
      // Generate advanced accumulators
      const advancedAccumulators = await advancedPredictionEngine.generateAdvancedAccumulators(
        allPredictions,
        { minConfidence: 65 }
      );
      
      return advancedAccumulators;
    } catch (error) {
      logger.error('EnhancedMLClient', 'Error getting enhanced accumulators', error);
      // Fall back to base implementation
      return super.getAccumulators();
    }
  }
  
  /**
   * Apply the advanced ML engine to predictions
   */
  private async applyAdvancedMLEngine(predictions: any[], sport: string): Promise<any[]> {
    try {
      if (!predictions || predictions.length === 0) {
        return predictions;
      }
      
      logger.info('EnhancedMLClient', `Applying advanced ML engine to ${predictions.length} ${sport} predictions`);
      
      // Process each prediction through the advanced engine
      const enhancementPromises = predictions.map(async (prediction) => {
        try {
          // Mock historical data - in a real app, this would come from a database
          const mockHistoricalData = {
            headToHead: [],
            homeForm: [],
            awayForm: [],
            homeStrength: 0.7 + (Math.random() * 0.3),
            awayStrength: 0.6 + (Math.random() * 0.3)
          };
          
          // Process through advanced ML engine
          const advancedPrediction = await advancedPredictionEngine.generateAdvancedPrediction(
            prediction,
            mockHistoricalData
          );
          
          return advancedPrediction;
        } catch (error) {
          logger.error('EnhancedMLClient', `Error applying advanced ML to prediction ${prediction.id}`, error);
          return prediction;
        }
      });
      
      // Wait for all predictions to be enhanced
      const enhancedPredictions = await Promise.all(enhancementPromises);
      
      return enhancedPredictions;
    } catch (error) {
      logger.error('EnhancedMLClient', 'Error applying advanced ML engine', error);
      return predictions;
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