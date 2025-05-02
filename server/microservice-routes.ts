import { Express } from 'express';
import { microserviceClient } from './microservice-client';
import { logger } from './logger';

/**
 * Register microservice API routes
 * @param app Express application
 */
export function registerMicroserviceRoutes(app: Express): void {
  // Route to get betting odds for a specific sport
  app.get('/api/sports/odds/:sport', async (req, res) => {
    try {
      const { sport } = req.params;
      const days = parseInt(req.query.days as string) || 3;
      const region = req.query.region as string || 'uk,eu,us';
      
      logger.info('MicroserviceRoutes', `Getting odds for ${sport} (${days} days, ${region})`);
      
      // Ensure the microservice is running
      await microserviceClient.startMicroservice();
      
      const data = await microserviceClient.getOdds(sport, days, region);
      res.json(data);
    } catch (error: any) {
      logger.error('MicroserviceRoutes', `Error getting odds: ${error.message}`);
      res.status(500).json({
        error: 'Failed to fetch odds data',
        message: error.message
      });
    }
  });
  
  // Route to get all available sports
  app.get('/api/sports/available', async (req, res) => {
    try {
      logger.info('MicroserviceRoutes', 'Getting available sports');
      
      // Ensure the microservice is running
      await microserviceClient.startMicroservice();
      
      const data = await microserviceClient.getSports();
      res.json(data);
    } catch (error: any) {
      logger.error('MicroserviceRoutes', `Error getting sports: ${error.message}`);
      res.status(500).json({
        error: 'Failed to fetch sports data',
        message: error.message
      });
    }
  });
  
  // Route to get live scores
  app.get('/api/sports/livescores', async (req, res) => {
    try {
      logger.info('MicroserviceRoutes', 'Getting live scores');
      
      // Ensure the microservice is running
      await microserviceClient.startMicroservice();
      
      const data = await microserviceClient.getLiveScores();
      res.json(data);
    } catch (error: any) {
      logger.error('MicroserviceRoutes', `Error getting live scores: ${error.message}`);
      res.status(500).json({
        error: 'Failed to fetch live scores',
        message: error.message
      });
    }
  });
  
  // Route to get fixtures for a specific league
  app.get('/api/sports/fixtures/league/:leagueId', async (req, res) => {
    try {
      const { leagueId } = req.params;
      
      logger.info('MicroserviceRoutes', `Getting fixtures for league ${leagueId}`);
      
      // Ensure the microservice is running
      await microserviceClient.startMicroservice();
      
      const data = await microserviceClient.getLeagueFixtures(leagueId);
      res.json(data);
    } catch (error: any) {
      logger.error('MicroserviceRoutes', `Error getting fixtures: ${error.message}`);
      res.status(500).json({
        error: 'Failed to fetch fixtures data',
        message: error.message
      });
    }
  });
  
  // Route to get teams for a specific league
  app.get('/api/sports/teams/:leagueId', async (req, res) => {
    try {
      const { leagueId } = req.params;
      
      logger.info('MicroserviceRoutes', `Getting teams for league ${leagueId}`);
      
      // Ensure the microservice is running
      await microserviceClient.startMicroservice();
      
      const data = await microserviceClient.getTeams(leagueId);
      res.json(data);
    } catch (error: any) {
      logger.error('MicroserviceRoutes', `Error getting teams: ${error.message}`);
      res.status(500).json({
        error: 'Failed to fetch teams data',
        message: error.message
      });
    }
  });
  
  // Route to get all available leagues
  app.get('/api/sports/leagues', async (req, res) => {
    try {
      logger.info('MicroserviceRoutes', 'Getting all leagues');
      
      // Ensure the microservice is running
      await microserviceClient.startMicroservice();
      
      const data = await microserviceClient.getLeagues();
      res.json(data);
    } catch (error: any) {
      logger.error('MicroserviceRoutes', `Error getting leagues: ${error.message}`);
      res.status(500).json({
        error: 'Failed to fetch leagues data',
        message: error.message
      });
    }
  });
  
  // Route to check microservice status
  app.get('/api/sports/status', async (req, res) => {
    try {
      logger.info('MicroserviceRoutes', 'Checking microservice status');
      
      // Try to start the microservice if it's not running
      const isRunning = await microserviceClient.startMicroservice();
      
      if (isRunning) {
        const status = await microserviceClient.getStatus();
        res.json(status);
      } else {
        res.status(503).json({
          timestamp: new Date().toISOString(),
          overall: 'error',
          message: 'Microservice is not running and could not be started',
          services: {
            odds_api: { status: 'error', message: 'Service unavailable' },
            sportsdb_api: { status: 'error', message: 'Service unavailable' }
          }
        });
      }
    } catch (error: any) {
      logger.error('MicroserviceRoutes', `Error checking microservice status: ${error.message}`);
      res.status(500).json({
        error: 'Failed to check microservice status',
        message: error.message
      });
    }
  });
  
  // Route to manually start the microservice
  app.post('/api/sports/microservice/start', async (req, res) => {
    try {
      logger.info('MicroserviceRoutes', 'Starting microservice');
      
      const isRunning = await microserviceClient.startMicroservice();
      
      if (isRunning) {
        res.json({
          success: true,
          message: 'Microservice started successfully'
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to start microservice'
        });
      }
    } catch (error: any) {
      logger.error('MicroserviceRoutes', `Error starting microservice: ${error.message}`);
      res.status(500).json({
        error: 'Failed to start microservice',
        message: error.message
      });
    }
  });
}