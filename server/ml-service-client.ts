import { logger } from './logger';
import fetch from 'node-fetch';

/**
 * Client for interacting with the ML-based prediction service
 */
export class MLServiceClient {
  private baseUrl: string;
  
  constructor() {
    // Get ML service URL from environment or use default
    this.baseUrl = process.env.ML_SERVICE_URL || 'http://localhost:5001';
    logger.info('ML service client initialized', { baseUrl: this.baseUrl });
  }
  
  /**
   * Check if the ML service is healthy
   * @returns Promise resolving to true if healthy
   */
  async isHealthy(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      const data = await response.json();
      return data.status === 'healthy';
    } catch (error) {
      logger.error('Error checking ML service health', { error });
      return false;
    }
  }
  
  /**
   * Generate predictions for upcoming matches
   * @param options Generation options
   * @returns Promise resolving to the prediction results
   */
  async generatePredictions(options: {
    daysAhead?: number;
    sports?: string[];
    storeResults?: boolean;
    notifyUsers?: boolean;
  } = {}) {
    try {
      const response = await fetch(`${this.baseUrl}/api/predictions/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          days_ahead: options.daysAhead || 3,
          sports: options.sports,
          store_results: options.storeResults !== false,
          notify_users: options.notifyUsers !== false,
        }),
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to generate predictions');
      }
      
      return data;
    } catch (error) {
      logger.error('Error generating predictions', { error, options });
      throw error;
    }
  }
  
  /**
   * Get predictions for a specific sport
   * @param sport Sport name (e.g., 'football', 'basketball')
   * @returns Promise resolving to the predictions
   */
  async getSportPredictions(sport: string) {
    try {
      const response = await fetch(`${this.baseUrl}/api/predictions/sports/${sport}`);
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || `Failed to get ${sport} predictions`);
      }
      
      return data;
    } catch (error) {
      logger.error(`Error getting ${sport} predictions`, { error });
      throw error;
    }
  }
  
  /**
   * Get accumulator predictions
   * @returns Promise resolving to the accumulator predictions
   */
  async getAccumulators() {
    try {
      const response = await fetch(`${this.baseUrl}/api/predictions/accumulators`);
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to get accumulator predictions');
      }
      
      return data;
    } catch (error) {
      logger.error('Error getting accumulator predictions', { error });
      throw error;
    }
  }
  
  /**
   * Train prediction models with historical data
   * @param options Training options
   * @returns Promise resolving to the training results
   */
  async trainModels(options: {
    sport: string;
    modelType?: string;
    useSyntheticData?: boolean;
  }) {
    try {
      if (!options.sport) {
        throw new Error('Sport is required');
      }
      
      const response = await fetch(`${this.baseUrl}/api/train`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sport: options.sport,
          model_type: options.modelType || 'xgboost',
          use_synthetic_data: options.useSyntheticData !== false,
        }),
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to train models');
      }
      
      return data;
    } catch (error) {
      logger.error('Error training models', { error, options });
      throw error;
    }
  }
  
  /**
   * Get list of supported sports and their configurations
   * @returns Promise resolving to the supported sports
   */
  async getSupportedSports() {
    try {
      const response = await fetch(`${this.baseUrl}/api/supported-sports`);
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to get supported sports');
      }
      
      return data;
    } catch (error) {
      logger.error('Error getting supported sports', { error });
      throw error;
    }
  }
}

// Export a singleton instance of the client
export const mlServiceClient = new MLServiceClient();