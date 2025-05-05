/**
 * API routes for betting success metrics
 */
import { Router, Request, Response } from 'express';
import { createContextLogger } from './logger';
import { db } from './db';

// Set up logging for this module
const logger = createContextLogger('BettingMetrics');

export const bettingMetricsRouter = Router();

// Get betting success metrics
bettingMetricsRouter.get('/', async (req: Request, res: Response) => {
  try {
    logger.info('Fetching betting success metrics');
    
    // In a real implementation, these would come from a database
    // For now, we're using realistic data to showcase the feature
    const metrics = {
      recentSuccessRate: 68.7, // Last 7 days
      monthlySuccessRate: 62.3, // Last 30 days  
      yearlySuccessRate: 59.8, // Last 365 days
      totalBets: 28451,
      streak: 5, // Current winning streak
      tier: 'Gold', // Performance tier
      // Historical data for charts (sample data)
      historical: {
        daily: [
          { date: '2025-04-29', successRate: 65.2, betsCount: 156 },
          { date: '2025-04-30', successRate: 61.7, betsCount: 162 },
          { date: '2025-05-01', successRate: 70.3, betsCount: 145 },
          { date: '2025-05-02', successRate: 72.1, betsCount: 158 },
          { date: '2025-05-03', successRate: 65.9, betsCount: 164 },
          { date: '2025-05-04', successRate: 67.4, betsCount: 152 },
          { date: '2025-05-05', successRate: 68.7, betsCount: 154 },
        ],
        categories: {
          football: 63.2,
          basketball: 66.8,
          tennis: 59.4,
          hockey: 61.2,
          baseball: 58.7,
        }
      }
    };
    
    res.json(metrics);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error fetching betting metrics', { error });
    
    res.status(500).json({
      error: 'Error fetching betting metrics',
      message: errorMessage
    });
  }
});

// Get detailed statistics for a specific sport
bettingMetricsRouter.get('/sport/:sport', async (req: Request, res: Response) => {
  try {
    const { sport } = req.params;
    logger.info(`Fetching betting metrics for sport: ${sport}`);
    
    // Sample data for sport-specific metrics
    const sportMetrics = {
      sport,
      overallSuccessRate: sport === 'football' ? 63.2 : 
                          sport === 'basketball' ? 66.8 : 
                          sport === 'tennis' ? 59.4 : 
                          sport === 'hockey' ? 61.2 : 
                          sport === 'baseball' ? 58.7 : 60.0,
      monthlyTrend: [
        { month: 'Dec', successRate: 58.4 },
        { month: 'Jan', successRate: 60.1 },
        { month: 'Feb', successRate: 62.7 },
        { month: 'Mar', successRate: 64.3 },
        { month: 'Apr', successRate: 63.9 },
        { month: 'May', successRate: sport === 'football' ? 63.2 : 
                         sport === 'basketball' ? 66.8 : 
                         sport === 'tennis' ? 59.4 : 
                         sport === 'hockey' ? 61.2 : 
                         sport === 'baseball' ? 58.7 : 60.0 },
      ],
      marketPerformance: {
        'Match Winner': 65.3,
        'Over/Under': 58.9,
        'Both Teams to Score': 62.1,
        'Handicap': 59.4,
        'Correct Score': 31.2,
      }
    };
    
    res.json(sportMetrics);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Error fetching betting metrics for sport: ${req.params.sport}`, { error });
    
    res.status(500).json({
      error: `Error fetching betting metrics for sport: ${req.params.sport}`,
      message: errorMessage
    });
  }
});

// Get historical performance data for charting
bettingMetricsRouter.get('/historical', async (req: Request, res: Response) => {
  try {
    const { period = '30d' } = req.query; // Default to 30 days
    logger.info(`Fetching historical betting metrics for period: ${period}`);
    
    // Sample historical data for different time periods
    const data = {
      period,
      timestamps: [] as string[],
      successRates: [] as number[],
      betCounts: [] as number[],
    };
    
    // Generate realistic data based on the period
    const now = new Date();
    let days = 0;
    
    switch(period) {
      case '7d':
        days = 7;
        break;
      case '30d':
        days = 30;
        break;
      case '90d':
        days = 90;
        break;
      case '365d':
        days = 365;
        break;
      default:
        days = 30;
    }
    
    // Generate data points
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      // Format date as ISO string without time
      const formattedDate = date.toISOString().split('T')[0];
      data.timestamps.push(formattedDate);
      
      // Generate realistic success rate with slight variations
      // Base success rate of ~60% with random variations
      const baseRate = 60;
      const variation = 15; // Maximum variation
      const successRate = baseRate + (Math.random() * variation * 2 - variation);
      data.successRates.push(Math.round(successRate * 10) / 10); // Round to 1 decimal place
      
      // Generate realistic bet counts (100-200 bets per day)
      data.betCounts.push(Math.floor(100 + Math.random() * 100));
    }
    
    res.json(data);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Error fetching historical betting metrics`, { error });
    
    res.status(500).json({
      error: 'Error fetching historical betting metrics',
      message: errorMessage
    });
  }
});

// Route to get tier descriptions and information
bettingMetricsRouter.get('/tiers', (req: Request, res: Response) => {
  const tiers = [
    {
      id: 'bronze',
      name: 'Bronze',
      successRateThreshold: 50,
      description: 'Entry level predictions with solid accuracy',
      features: ['Basic match outcome predictions', 'Daily top picks', 'Standard analytics']
    },
    {
      id: 'silver',
      name: 'Silver',
      successRateThreshold: 55,
      description: 'Enhanced predictions with better accuracy',
      features: ['All Bronze features', 'Advanced market predictions', 'Bet builder suggestions']
    },
    {
      id: 'gold',
      name: 'Gold',
      successRateThreshold: 60,
      description: 'Premium predictions with high accuracy',
      features: ['All Silver features', 'Value bet indicators', 'Comprehensive analytics', 'Historical trends']
    },
    {
      id: 'platinum',
      name: 'Platinum',
      successRateThreshold: 65,
      description: 'Elite predictions with maximum accuracy',
      features: ['All Gold features', 'Real-time odds monitoring', 'Personalized alerts', 'Expert insights']
    }
  ];
  
  res.json(tiers);
});