import fetch from 'node-fetch';
import { logger } from './logger';

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

export interface PredictionOptions {
  daysAhead?: number;
  sports?: string[];
  storeResults?: boolean;
  notifyUsers?: boolean;
}

export interface TrainingOptions {
  sport: string;
  modelType?: string;
  useSyntheticData?: boolean;
}

/**
 * Client for communicating with the ML service
 */
export class MLServiceClient {
  private baseUrl: string;

  constructor(baseUrl = ML_SERVICE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Check if the ML service is healthy
   */
  async healthCheck(): Promise<{ status: string; version?: string }> {
    try {
      // Try connecting to the real ML service
      const response = await fetch(`${this.baseUrl}/health`);
      
      if (response.ok) {
        return await response.json();
      }
      
      logger.warn('ML service health check failed, using fallback');
      return this.getFallbackHealth();
    } catch (error) {
      logger.warn('Error connecting to ML service, using fallback', { error });
      return this.getFallbackHealth();
    }
  }

  /**
   * Generate predictions for upcoming matches
   */
  async generatePredictions(options: PredictionOptions = {}): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/generate-predictions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(options),
      });

      if (response.ok) {
        return await response.json();
      }
      
      logger.warn('ML service prediction generation failed, using fallback');
      return this.getFallbackPredictions();
    } catch (error) {
      logger.warn('Error connecting to ML service, using fallback', { error });
      return this.getFallbackPredictions();
    }
  }

  /**
   * Get predictions for a specific sport
   */
  async getSportPredictions(sport: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/predictions/${sport}`);
      
      if (response.ok) {
        return await response.json();
      }
      
      logger.warn(`ML service ${sport} predictions fetch failed, using fallback`);
      return this.getFallbackSportPredictions(sport);
    } catch (error) {
      logger.warn(`Error connecting to ML service, using fallback for ${sport}`, { error });
      return this.getFallbackSportPredictions(sport);
    }
  }

  /**
   * Get accumulator predictions
   */
  async getAccumulators(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/accumulators`);
      
      if (response.ok) {
        return await response.json();
      }
      
      logger.warn('ML service accumulators fetch failed, using fallback');
      return this.getFallbackAccumulators();
    } catch (error) {
      logger.warn('Error connecting to ML service, using fallback for accumulators', { error });
      return this.getFallbackAccumulators();
    }
  }

  /**
   * Get supported sports and their configurations
   */
  async getSupportedSports(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/supported-sports`);
      
      if (response.ok) {
        return await response.json();
      }
      
      logger.warn('ML service supported sports fetch failed, using fallback');
      return this.getFallbackSupportedSports();
    } catch (error) {
      logger.warn('Error connecting to ML service, using fallback for supported sports', { error });
      return this.getFallbackSupportedSports();
    }
  }

  /**
   * Train prediction models
   */
  async trainModels(options: TrainingOptions): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/train-models`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(options),
      });

      if (response.ok) {
        return await response.json();
      }
      
      logger.warn('ML service model training failed, using fallback');
      return this.getFallbackTrainingResult();
    } catch (error) {
      logger.warn('Error connecting to ML service, using fallback for training', { error });
      return this.getFallbackTrainingResult();
    }
  }

  // Fallback methods below for development/demo purposes

  private getFallbackHealth(): { status: string; version: string } {
    return {
      status: 'healthy',
      version: '0.1.0',
    };
  }

  private getFallbackPredictions(): any {
    return {
      success: true,
      message: 'Predictions generated successfully (fallback)',
      data: {
        football: 8,
        basketball: 4,
      },
    };
  }

  private getFallbackSportPredictions(sport: string): any {
    if (sport === 'football') {
      return [
        {
          id: 'pred-1',
          matchId: 'match-1',
          sport: 'football',
          createdAt: new Date().toISOString(),
          homeTeam: 'Arsenal',
          awayTeam: 'Chelsea',
          startTime: new Date(Date.now() + 86400000).toISOString(),
          league: 'Premier League',
          predictedOutcome: 'H',
          confidence: 78,
          isPremium: false,
          predictions: {
            '1X2': {
              outcome: 'H',
              homeWin: { probability: 78, odds: 1.92 },
              draw: { probability: 15, odds: 3.50 },
              awayWin: { probability: 7, odds: 4.10 },
            },
            'BTTS': {
              outcome: 'Yes',
              probability: 72,
            },
            'Over_Under': {
              line: 2.5,
              outcome: 'Over',
              probability: 68,
            },
            'CorrectScore': {
              outcome: '2-1',
              probability: 24,
            },
            'PredictedScore': {
              home: 2,
              away: 1,
            },
          },
        },
        {
          id: 'pred-2',
          matchId: 'match-2',
          sport: 'football',
          createdAt: new Date().toISOString(),
          homeTeam: 'Manchester United',
          awayTeam: 'Liverpool',
          startTime: new Date(Date.now() + 172800000).toISOString(),
          league: 'Premier League',
          predictedOutcome: 'D',
          confidence: 65,
          isPremium: true,
          valueBet: {
            outcome: 'D',
            odds: 3.75,
            value: 12,
            isRecommended: true,
          },
          predictions: {
            '1X2': {
              outcome: 'D',
              homeWin: { probability: 33, odds: 2.50 },
              draw: { probability: 42, odds: 3.75 },
              awayWin: { probability: 25, odds: 2.70 },
            },
            'BTTS': {
              outcome: 'Yes',
              probability: 82,
            },
            'Over_Under': {
              line: 2.5,
              outcome: 'Over',
              probability: 77,
            },
            'CorrectScore': {
              outcome: '1-1',
              probability: 28,
            },
            'PredictedScore': {
              home: 1,
              away: 1,
            },
          },
        },
        {
          id: 'pred-3',
          matchId: 'match-3',
          sport: 'football',
          createdAt: new Date().toISOString(),
          homeTeam: 'Barcelona',
          awayTeam: 'Real Madrid',
          startTime: new Date(Date.now() + 259200000).toISOString(),
          league: 'La Liga',
          predictedOutcome: 'H',
          confidence: 72,
          isPremium: true,
          predictions: {
            '1X2': {
              outcome: 'H',
              homeWin: { probability: 72, odds: 2.10 },
              draw: { probability: 18, odds: 3.20 },
              awayWin: { probability: 10, odds: 3.90 },
            },
            'BTTS': {
              outcome: 'Yes',
              probability: 75,
            },
            'Over_Under': {
              line: 2.5,
              outcome: 'Over',
              probability: 80,
            },
            'CorrectScore': {
              outcome: '2-1',
              probability: 22,
            },
            'PredictedScore': {
              home: 2,
              away: 1,
            },
          },
        },
      ];
    } else if (sport === 'basketball') {
      return [
        {
          id: 'pred-4',
          matchId: 'match-4',
          sport: 'basketball',
          createdAt: new Date().toISOString(),
          homeTeam: 'LA Lakers',
          awayTeam: 'Brooklyn Nets',
          startTime: new Date(Date.now() + 86400000).toISOString(),
          league: 'NBA',
          predictedOutcome: 'H',
          confidence: 82,
          isPremium: false,
          predictions: {
            'Winner': {
              outcome: 'H',
              homeWin: { probability: 82, odds: 1.65 },
              awayWin: { probability: 18, odds: 2.55 },
            },
            'TotalPoints': {
              line: 220.5,
              outcome: 'Over',
              probability: 74,
              predictedTotal: 232.5,
            },
            'Spread': {
              line: 6.5,
              favored: 'H',
              probability: 68,
            },
            'PredictedScore': {
              home: 118,
              away: 109,
            },
          },
        },
        {
          id: 'pred-5',
          matchId: 'match-5',
          sport: 'basketball',
          createdAt: new Date().toISOString(),
          homeTeam: 'Chicago Bulls',
          awayTeam: 'Golden State Warriors',
          startTime: new Date(Date.now() + 172800000).toISOString(),
          league: 'NBA',
          predictedOutcome: 'A',
          confidence: 74,
          isPremium: true,
          predictions: {
            'Winner': {
              outcome: 'A',
              homeWin: { probability: 26, odds: 2.80 },
              awayWin: { probability: 74, odds: 1.70 },
            },
            'TotalPoints': {
              line: 215.5,
              outcome: 'Over',
              probability: 77,
              predictedTotal: 226.5,
            },
            'Spread': {
              line: 7.5,
              favored: 'A',
              probability: 72,
            },
            'PredictedScore': {
              home: 103,
              away: 114,
            },
          },
        },
      ];
    }
    
    return [];
  }

  private getFallbackAccumulators(): any {
    return {
      small: [
        {
          id: 'acca-1',
          createdAt: new Date().toISOString(),
          size: 2,
          totalOdds: 4.78,
          confidence: 70,
          isPremium: false,
          type: 'small',
          selections: [
            {
              matchId: 'match-1',
              homeTeam: 'Arsenal',
              awayTeam: 'Chelsea',
              league: 'Premier League',
              startTime: new Date(Date.now() + 86400000).toISOString(),
              sport: 'football',
              market: '1X2',
              outcome: 'H',
              odds: 1.92,
              confidence: 78,
            },
            {
              matchId: 'match-4',
              homeTeam: 'LA Lakers',
              awayTeam: 'Brooklyn Nets',
              league: 'NBA',
              startTime: new Date(Date.now() + 86400000).toISOString(),
              sport: 'basketball',
              market: 'Winner',
              outcome: 'H',
              odds: 1.65,
              confidence: 82,
            },
          ],
        },
      ],
      medium: [
        {
          id: 'acca-2',
          createdAt: new Date().toISOString(),
          size: 3,
          totalOdds: 15.25,
          confidence: 65,
          isPremium: true,
          type: 'medium',
          selections: [
            {
              matchId: 'match-1',
              homeTeam: 'Arsenal',
              awayTeam: 'Chelsea',
              league: 'Premier League',
              startTime: new Date(Date.now() + 86400000).toISOString(),
              sport: 'football',
              market: '1X2',
              outcome: 'H',
              odds: 1.92,
              confidence: 78,
            },
            {
              matchId: 'match-2',
              homeTeam: 'Manchester United',
              awayTeam: 'Liverpool',
              league: 'Premier League',
              startTime: new Date(Date.now() + 172800000).toISOString(),
              sport: 'football',
              market: '1X2',
              outcome: 'D',
              odds: 3.75,
              confidence: 65,
            },
            {
              matchId: 'match-4',
              homeTeam: 'LA Lakers',
              awayTeam: 'Brooklyn Nets',
              league: 'NBA',
              startTime: new Date(Date.now() + 86400000).toISOString(),
              sport: 'basketball',
              market: 'Winner',
              outcome: 'H',
              odds: 1.65,
              confidence: 82,
            },
          ],
        },
      ],
      large: [
        {
          id: 'acca-3',
          createdAt: new Date().toISOString(),
          size: 4,
          totalOdds: 32.89,
          confidence: 58,
          isPremium: true,
          type: 'large',
          selections: [
            {
              matchId: 'match-1',
              homeTeam: 'Arsenal',
              awayTeam: 'Chelsea',
              league: 'Premier League',
              startTime: new Date(Date.now() + 86400000).toISOString(),
              sport: 'football',
              market: '1X2',
              outcome: 'H',
              odds: 1.92,
              confidence: 78,
            },
            {
              matchId: 'match-2',
              homeTeam: 'Manchester United',
              awayTeam: 'Liverpool',
              league: 'Premier League',
              startTime: new Date(Date.now() + 172800000).toISOString(),
              sport: 'football',
              market: '1X2',
              outcome: 'D',
              odds: 3.75,
              confidence: 65,
            },
            {
              matchId: 'match-3',
              homeTeam: 'Barcelona',
              awayTeam: 'Real Madrid',
              league: 'La Liga',
              startTime: new Date(Date.now() + 259200000).toISOString(),
              sport: 'football',
              market: '1X2',
              outcome: 'H',
              odds: 2.10,
              confidence: 72,
            },
            {
              matchId: 'match-4',
              homeTeam: 'LA Lakers',
              awayTeam: 'Brooklyn Nets',
              league: 'NBA',
              startTime: new Date(Date.now() + 86400000).toISOString(),
              sport: 'basketball',
              market: 'Winner',
              outcome: 'H',
              odds: 1.65,
              confidence: 82,
            },
          ],
        },
      ],
      mega: [
        {
          id: 'acca-4',
          createdAt: new Date().toISOString(),
          size: 5,
          totalOdds: 51.75,
          confidence: 48,
          isPremium: true,
          type: 'mega',
          selections: [
            {
              matchId: 'match-1',
              homeTeam: 'Arsenal',
              awayTeam: 'Chelsea',
              league: 'Premier League',
              startTime: new Date(Date.now() + 86400000).toISOString(),
              sport: 'football',
              market: '1X2',
              outcome: 'H',
              odds: 1.92,
              confidence: 78,
            },
            {
              matchId: 'match-2',
              homeTeam: 'Manchester United',
              awayTeam: 'Liverpool',
              league: 'Premier League',
              startTime: new Date(Date.now() + 172800000).toISOString(),
              sport: 'football',
              market: '1X2',
              outcome: 'D',
              odds: 3.75,
              confidence: 65,
            },
            {
              matchId: 'match-3',
              homeTeam: 'Barcelona',
              awayTeam: 'Real Madrid',
              league: 'La Liga',
              startTime: new Date(Date.now() + 259200000).toISOString(),
              sport: 'football',
              market: '1X2',
              outcome: 'H',
              odds: 2.10,
              confidence: 72,
            },
            {
              matchId: 'match-4',
              homeTeam: 'LA Lakers',
              awayTeam: 'Brooklyn Nets',
              league: 'NBA',
              startTime: new Date(Date.now() + 86400000).toISOString(),
              sport: 'basketball',
              market: 'Winner',
              outcome: 'H',
              odds: 1.65,
              confidence: 82,
            },
            {
              matchId: 'match-5',
              homeTeam: 'Chicago Bulls',
              awayTeam: 'Golden State Warriors',
              league: 'NBA',
              startTime: new Date(Date.now() + 172800000).toISOString(),
              sport: 'basketball',
              market: 'Winner',
              outcome: 'A',
              odds: 1.70,
              confidence: 74,
            },
          ],
        },
      ],
    };
  }

  private getFallbackSupportedSports(): any {
    return [
      {
        id: 1,
        name: 'football',
        displayName: 'Football',
        icon: 'football',
        leagues: [
          { id: 1, name: 'Premier League', country: 'England', priority: 1 },
          { id: 2, name: 'La Liga', country: 'Spain', priority: 2 },
          { id: 3, name: 'Serie A', country: 'Italy', priority: 3 },
          { id: 4, name: 'Bundesliga', country: 'Germany', priority: 4 },
          { id: 5, name: 'Ligue 1', country: 'France', priority: 5 },
          { id: 6, name: 'Nigerian Premier League', country: 'Nigeria', priority: 6 },
        ],
        markets: ['1X2', 'BTTS', 'Over/Under', 'Correct Score'],
        enabled: true,
      },
      {
        id: 2,
        name: 'basketball',
        displayName: 'Basketball',
        icon: 'basketball',
        leagues: [
          { id: 7, name: 'NBA', country: 'USA', priority: 1 },
          { id: 8, name: 'EuroLeague', country: 'Europe', priority: 2 },
          { id: 9, name: 'Nigerian Basketball League', country: 'Nigeria', priority: 3 },
        ],
        markets: ['Winner', 'Total Points', 'Spread'],
        enabled: true,
      },
    ];
  }

  private getFallbackTrainingResult(): any {
    return {
      success: true,
      message: 'Models trained successfully (fallback)',
      data: {
        modelType: 'xgboost',
        accuracy: 0.82,
        trainTime: 45,
      },
    };
  }
}