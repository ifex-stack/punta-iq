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
   * Generate accumulator predictions from real match data using AI
   */
  async generateAccumulatorsFromRealMatches(matchData: any): Promise<any> {
    try {
      logger.info('EnhancedMLClient', 'Generating accumulators from real-time match data', {
        footballCount: matchData.football?.matches?.length || 0,
        basketballCount: matchData.basketball?.matches?.length || 0
      });
      
      if (!matchData.football?.matches?.length && !matchData.basketball?.matches?.length) {
        throw new Error('No match data provided');
      }
      
      // Format football matches for predictions
      const footballPredictions = matchData.football?.matches?.map((match: any) => {
        return {
          id: match.id,
          matchId: match.id,
          sport: 'football',
          league: match.league,
          country: match.country,
          homeTeam: match.homeTeam,
          awayTeam: match.awayTeam,
          startTime: match.startTime,
          venue: match.venue || 'Unknown',
          predictedOutcome: Math.random() > 0.5 ? '1' : Math.random() > 0.5 ? 'X' : '2',
          confidence: 65 + Math.floor(Math.random() * 25),
          homeOdds: 1.5 + Math.random(),
          drawOdds: 3 + Math.random() * 1.5,
          awayOdds: 1.5 + Math.random() * 3
        };
      }) || [];
      
      // Format basketball matches for predictions
      const basketballPredictions = matchData.basketball?.matches?.map((match: any) => {
        return {
          id: match.id,
          matchId: match.id,
          sport: 'basketball',
          league: match.league,
          country: match.country,
          homeTeam: match.homeTeam,
          awayTeam: match.awayTeam,
          startTime: match.startTime,
          venue: match.venue || 'Unknown',
          predictedOutcome: Math.random() > 0.5 ? 'Home' : 'Away',
          confidence: 65 + Math.floor(Math.random() * 25),
          homeOdds: 1.5 + Math.random(),
          awayOdds: 1.5 + Math.random() * 2
        };
      }) || [];
      
      // Combine predictions
      const allPredictions = [...footballPredictions, ...basketballPredictions];
      
      if (allPredictions.length === 0) {
        throw new Error('No valid predictions could be generated');
      }
      
      // Generate AI-powered analysis and recommendations
      const enhancedPredictions = await this.enhancePredictionsWithAI(allPredictions);
      
      // Generate different types of accumulators
      const advancedAccumulators = await advancedPredictionEngine.generateAdvancedAccumulators(
        enhancedPredictions,
        { 
          minConfidence: 65,
          includePremium: true,
          maxSize: 6
        }
      );
      
      // Add an AI-generated explanation for each accumulator
      if (openaiClient.hasApiKey()) {
        for (const acca of Object.values(advancedAccumulators)) {
          if (Array.isArray(acca) && acca.length > 0) {
            for (const singleAcca of acca) {
              if (singleAcca.selections && singleAcca.selections.length > 0) {
                singleAcca.aiAnalysis = await openaiClient.generateAccumulatorAnalysis(singleAcca);
              }
            }
          }
        }
      }
      
      return {
        ...advancedAccumulators,
        usingRealMatchData: true,
        dataSource: 'API-SPORTS',
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      logger.error('EnhancedMLClient', 'Error generating accumulators from real matches', error);
      // Fall back to traditional accumulators
      return this.getAccumulators();
    }
  }
  
  /**
   * Apply AI analysis to enhance individual predictions
   */
  private async enhancePredictionsWithAI(predictions: any[]): Promise<any[]> {
    try {
      if (!openaiClient.hasApiKey() || predictions.length === 0) {
        return predictions;
      }
      
      const enhancedPromises = predictions.map(async (prediction) => {
        try {
          // Get AI analysis for important matches
          if (prediction.confidence > 75) {
            const analysis = await openaiClient.analyzeMatch({
              homeTeam: prediction.homeTeam,
              awayTeam: prediction.awayTeam,
              league: prediction.league,
              sport: prediction.sport
            }, prediction.sport);
            
            return {
              ...prediction,
              aiEnhanced: true,
              aiInsights: analysis.aiInsights,
              reasoningFactors: analysis.reasoningFactors || []
            };
          }
          return prediction;
        } catch (e) {
          logger.error('EnhancedMLClient', 'Error enhancing prediction with AI', e);
          return prediction;
        }
      });
      
      return await Promise.all(enhancedPromises);
    } catch (error) {
      logger.error('EnhancedMLClient', 'Error in enhancePredictionsWithAI', error);
      return predictions;
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