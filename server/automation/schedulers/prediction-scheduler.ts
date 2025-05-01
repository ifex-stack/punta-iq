import cron from 'node-cron';
import { MLServiceClient } from '../../ml-service-client';
import { advancedPredictionEngine } from '../../advanced-prediction-engine';
import { getMessagingInstance } from '../../firebase-admin';
import { db } from '../../db';
import { predictions } from '@shared/schema';
import { eq, and, lte, gte } from 'drizzle-orm';
import { logger } from '../../logger';
import { storage } from '../../storage';
import { OddsAPIService } from '../../odds-api-service';
import { SportsApiService } from '../../sports-api-service';

// Define supported sports
const SUPPORTED_SPORTS = [
  'football',
  'basketball',
  'american_football',
  'baseball',
  'hockey',
  'rugby',
  'tennis',
  'cricket',
  'formula1',
  'afl',
  'handball',
  'mma',
  'volleyball',
  'nba'
];

/**
 * Automated prediction scheduler that runs at specified intervals
 * to generate new predictions and notify users.
 */
export class PredictionScheduler {
  private mlServiceClient: MLServiceClient;
  private oddsService: OddsAPIService;
  private sportsApiService: SportsApiService;
  private dailyPredictionJob: any; // Daily prediction generation
  private accuracyUpdateJob: any; // Weekly accuracy update
  private notificationJob: any; // Daily notification for new predictions
  private accumulatorJob: any; // Daily accumulator generation
  
  constructor() {
    this.mlServiceClient = new MLServiceClient();
    this.oddsService = OddsAPIService.getInstance();
    this.sportsApiService = new SportsApiService();
    
    // Initialize all scheduled jobs
    this.setupJobs();
    
    logger.info('[PredictionScheduler]', 'Prediction scheduler initialized');
  }
  
  /**
   * Set up all scheduled jobs
   */
  private setupJobs() {
    // Generate predictions daily at 1 AM UTC
    this.dailyPredictionJob = cron.schedule('0 1 * * *', () => {
      this.generateDailyPredictions();
    });
    
    // Update prediction accuracy weekly on Sunday at 2 AM UTC
    this.accuracyUpdateJob = cron.schedule('0 2 * * 0', () => {
      this.updatePredictionAccuracy();
    });
    
    // Send notifications about new predictions at 8 AM UTC
    this.notificationJob = cron.schedule('0 8 * * *', () => {
      this.sendPredictionNotifications();
    });
    
    // Generate accumulators at 2 AM UTC after prediction generation
    this.accumulatorJob = cron.schedule('0 2 * * *', () => {
      this.generateDailyAccumulators();
    });
    
    logger.info('[PredictionScheduler]', 'All prediction jobs scheduled');
  }
  
  /**
   * Generate daily predictions for all supported sports
   */
  async generateDailyPredictions() {
    try {
      logger.info('[PredictionScheduler]', 'Starting daily prediction generation');
      
      // Generate predictions using ML service
      const options = {
        daysAhead: 3, // Generate predictions for next 3 days
        sports: SUPPORTED_SPORTS,
        storeResults: true,
        notifyUsers: false // We'll handle notifications separately
      };
      
      const result = await this.mlServiceClient.generatePredictions(options);
      
      if (result.success) {
        logger.info('[PredictionScheduler]', 'Daily predictions generated successfully', { 
          count: result.total_predictions,
          sports: Object.keys(result.predictions)
        });
        
        // Store generation stats
        await this.storePredictionGenerationStats(result);
      } else {
        logger.error('[PredictionScheduler]', 'Failed to generate daily predictions', { error: result.error });
      }
    } catch (error) {
      logger.error('[PredictionScheduler]', 'Error in daily prediction generation', { error });
    }
  }
  
  /**
   * Update prediction accuracy for completed matches
   */
  async updatePredictionAccuracy() {
    try {
      logger.info('[PredictionScheduler]', 'Starting prediction accuracy update');
      
      // Get date range for last week
      const today = new Date();
      const lastWeek = new Date(today);
      lastWeek.setDate(lastWeek.getDate() - 7);
      
      // Get all predictions from the last week that need accuracy update
      const pendingPredictions = await db.select()
        .from(predictions)
        .where(
          and(
            lte(predictions.startTime, today),
            gte(predictions.startTime, lastWeek),
            eq(predictions.isCorrect, null)
          )
        );
      
      logger.info('[PredictionScheduler]', `Found ${pendingPredictions.length} predictions to update`);
      
      let updatedCount = 0;
      
      // Process each prediction that needs accuracy update
      for (const prediction of pendingPredictions) {
        try {
          // Get actual match result
          const result = await this.getMatchResult(prediction);
          
          if (result) {
            // Update prediction accuracy
            const isCorrect = this.evaluatePredictionAccuracy(prediction, result);
            
            // Update in database
            await db.update(predictions)
              .set({ 
                isCorrect, 
                result: result.toString() 
              })
              .where(eq(predictions.id, prediction.id));
            
            updatedCount++;
          }
        } catch (error) {
          logger.error('[PredictionScheduler]', `Error updating prediction ${prediction.id}`, { error });
        }
      }
      
      logger.info('[PredictionScheduler]', `Prediction accuracy updated for ${updatedCount} predictions`);
    } catch (error) {
      logger.error('[PredictionScheduler]', 'Error updating prediction accuracy', { error });
    }
  }
  
  /**
   * Send notifications about new predictions
   */
  async sendPredictionNotifications() {
    try {
      logger.info('[PredictionScheduler]', 'Sending prediction notifications');
      
      // Get today's date at midnight UTC
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Get counts of today's predictions
      const todaysPredictions = await db.select()
        .from(predictions)
        .where(gte(predictions.createdAt, today));
      
      // Group by sport
      const sportCounts = {};
      todaysPredictions.forEach(prediction => {
        const sport = prediction.sport || 'unknown';
        sportCounts[sport] = (sportCounts[sport] || 0) + 1;
      });
      
      const totalCount = todaysPredictions.length;
      
      if (totalCount > 0) {
        // Prepare notification content
        const title = 'New AI Predictions Available';
        const sportsList = Object.keys(sportCounts).join(', ');
        const body = `${totalCount} new predictions for ${sportsList} are ready`;
        
        // Send to all users
        const messaging = getMessagingInstance();
        await messaging.sendMulticast({
          notification: {
            title,
            body,
          },
          data: {
            type: 'new_predictions',
            count: totalCount.toString(),
            sports: sportsList,
            timestamp: new Date().toISOString()
          },
          // In production, you would target specific user FCM tokens:
          // tokens: userFcmTokens,
        });
        
        logger.info('[PredictionScheduler]', 'Prediction notification sent successfully', { recipients: 'all users' });
      } else {
        logger.info('[PredictionScheduler]', 'No new predictions to notify about today');
      }
    } catch (error) {
      logger.error('[PredictionScheduler]', 'Error sending prediction notifications', { error });
    }
  }
  
  /**
   * Generate daily accumulators (2-odds, 5-odds, 10-odds)
   */
  async generateDailyAccumulators() {
    try {
      logger.info('[PredictionScheduler]', 'Generating daily accumulators');
      
      // Get recent predictions with high confidence
      const today = new Date();
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);
      
      const highConfidencePredictions = await db.select()
        .from(predictions)
        .where(
          and(
            gte(predictions.startTime, today),
            lte(predictions.startTime, nextWeek),
            gte(predictions.confidence, 70) // Only high confidence predictions
          )
        );
      
      logger.info('[PredictionScheduler]', `Found ${highConfidencePredictions.length} high confidence predictions`);
      
      if (highConfidencePredictions.length >= 2) {
        // Generate accumulators of different sizes using the advanced prediction engine
        const accumulatorOptions = {
          minConfidence: 70,
          diverseSports: true,
          timeWindow: 3, // 3 days
          riskLevels: ['low', 'medium', 'high'],
          predictionCount: {
            low: 2,    // 2-odds accumulator
            medium: 5, // 5-odds accumulator
            high: 10   // 10-odds accumulator
          }
        };
        
        const accumulators = await advancedPredictionEngine.generateAdvancedAccumulators(
          highConfidencePredictions,
          accumulatorOptions
        );
        
        // Store the generated accumulators
        for (const type in accumulators) {
          for (const accumulator of accumulators[type]) {
            await this.storeAccumulator(accumulator, type);
          }
        }
        
        logger.info('[PredictionScheduler]', 'Accumulators generated successfully', { 
          types: Object.keys(accumulators),
          count: Object.values(accumulators).flat().length
        });
      } else {
        logger.warn('[PredictionScheduler]', 'Not enough high confidence predictions to generate accumulators');
      }
    } catch (error) {
      logger.error('[PredictionScheduler]', 'Error generating daily accumulators', { error });
    }
  }
  
  /**
   * Get match result from sports data API
   */
  private async getMatchResult(prediction: any): Promise<any> {
    // This would call the sports API to get actual match results
    // Implementation depends on the specific sports API being used
    
    try {
      // Example implementation
      if (prediction.sport === 'football') {
        return await this.sportsApiService.getFootballMatchResult(prediction.matchId);
      } else if (prediction.sport === 'basketball') {
        return await this.sportsApiService.getBasketballGameResult(prediction.matchId);
      }
      // Add implementations for other sports
      
      return null;
    } catch (error) {
      logger.error('[PredictionScheduler]', `Error getting match result for ${prediction.id}`, { error });
      return null;
    }
  }
  
  /**
   * Evaluate if a prediction was correct based on actual result
   */
  private evaluatePredictionAccuracy(prediction: any, result: any): boolean {
    try {
      // This would compare prediction to actual result
      // Implementation depends on the specific prediction and result format
      
      // Example for 1X2 market in football
      if (prediction.market === '1X2' || prediction.market === 'Winner') {
        if (prediction.predictedOutcome === 'H' && result.homeScore > result.awayScore) {
          return true;
        } else if (prediction.predictedOutcome === 'A' && result.homeScore < result.awayScore) {
          return true;
        } else if (prediction.predictedOutcome === 'D' && result.homeScore === result.awayScore) {
          return true;
        }
        return false;
      }
      
      // Example for BTTS (Both Teams To Score) market
      if (prediction.market === 'BTTS') {
        const bothTeamsScored = result.homeScore > 0 && result.awayScore > 0;
        return (prediction.predictedOutcome === 'Yes' && bothTeamsScored) || 
               (prediction.predictedOutcome === 'No' && !bothTeamsScored);
      }
      
      // Example for Over/Under market
      if (prediction.market === 'Over_Under' || prediction.market.includes('Over') || prediction.market.includes('Under')) {
        const totalGoals = result.homeScore + result.awayScore;
        const line = prediction.additionalPredictions?.line || 2.5;
        
        return (prediction.predictedOutcome === 'Over' && totalGoals > line) || 
               (prediction.predictedOutcome === 'Under' && totalGoals < line);
      }
      
      return false;
    } catch (error) {
      logger.error('[PredictionScheduler]', `Error evaluating prediction ${prediction.id}`, { error });
      return false;
    }
  }
  
  /**
   * Store prediction generation statistics
   */
  private async storePredictionGenerationStats(result: any) {
    try {
      // Store stats about this prediction generation run
      // Implementation depends on storage needs
      
      // Example: store in database or send to analytics service
      const stats = {
        timestamp: new Date(),
        totalPredictions: result.total_predictions,
        sportsCounts: result.predictions,
        accumulators: result.accumulators,
        generationTimeMs: result.generation_time_ms || 0
      };
      
      // For simplicity, just log the stats
      logger.info('[PredictionScheduler]', 'Prediction generation stats', stats);
      
      // In a real implementation, you would store this in a database
      // await db.insert(predictionGenerationStats).values(stats);
    } catch (error) {
      logger.error('[PredictionScheduler]', 'Error storing prediction generation stats', { error });
    }
  }
  
  /**
   * Store a generated accumulator
   */
  private async storeAccumulator(accumulator: any, type: string) {
    try {
      // Create accumulator record
      const newAccumulator = {
        name: `${type.charAt(0).toUpperCase() + type.slice(1)} Accumulator`,
        totalOdds: accumulator.totalOdds,
        confidence: accumulator.confidence,
        userId: 0, // System generated
        isActive: true
      };
      
      // Store accumulator in database
      const storedAccumulator = await storage.createAccumulator(newAccumulator);
      
      // Store each selection as an accumulator item
      for (const selection of accumulator.selections) {
        await storage.addPredictionToAccumulator(storedAccumulator.id, selection.predictionId);
      }
      
      return storedAccumulator;
    } catch (error) {
      logger.error('[PredictionScheduler]', 'Error storing accumulator', { error, type });
      return null;
    }
  }
  
  /**
   * Start all scheduled jobs
   */
  start() {
    this.dailyPredictionJob.start();
    this.accuracyUpdateJob.start();
    this.notificationJob.start();
    this.accumulatorJob.start();
    logger.info('[PredictionScheduler]', 'All prediction scheduler jobs started');
  }
  
  /**
   * Stop all scheduled jobs
   */
  stop() {
    this.dailyPredictionJob.stop();
    this.accuracyUpdateJob.stop();
    this.notificationJob.stop();
    this.accumulatorJob.stop();
    logger.info('[PredictionScheduler]', 'All prediction scheduler jobs stopped');
  }
  
  /**
   * Manually trigger the prediction generation
   * Useful for testing or on-demand generation
   */
  async triggerPredictionGeneration() {
    logger.info('[PredictionScheduler]', 'Manually triggering prediction generation');
    await this.generateDailyPredictions();
    await this.generateDailyAccumulators();
  }
}

// Create a singleton instance
let schedulerInstance: PredictionScheduler | null = null;

/**
 * Get the prediction scheduler instance
 */
export function getPredictionScheduler(): PredictionScheduler {
  if (!schedulerInstance) {
    schedulerInstance = new PredictionScheduler();
  }
  return schedulerInstance;
}