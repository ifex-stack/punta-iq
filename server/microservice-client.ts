import axios from 'axios';
import { logger } from './logger';

/**
 * Client service to communicate with the Flask microservice
 */
export class MicroserviceClient {
  private baseUrl: string;
  
  constructor() {
    // Default to localhost for development
    this.baseUrl = process.env.MICROSERVICE_URL || 'http://localhost:5000';
    logger.info('MicroserviceClient', `Initialized with base URL: ${this.baseUrl}`);
  }
  
  /**
   * Get betting odds for a specific sport
   * @param sport Sport key (e.g., soccer_epl, soccer_spain_la_liga)
   * @param days Number of days to look ahead
   * @param region Region for odds (e.g., uk, us, eu)
   */
  async getOdds(sport: string, days: number = 3, region: string = 'uk,eu,us'): Promise<any> {
    try {
      const url = `${this.baseUrl}/api/odds/${sport}`;
      const params = { days, region };
      
      logger.info('MicroserviceClient', `Fetching odds for ${sport} from ${url}`);
      
      const response = await axios.get(url, { params });
      
      logger.info('MicroserviceClient', `Received odds for ${sport}: ${response.data.count} events`);
      
      return response.data;
    } catch (error: any) {
      logger.error('MicroserviceClient', `Error fetching odds for ${sport}: ${error.message}`);
      if (error.response) {
        logger.error('MicroserviceClient', `Status: ${error.response.status}, Data: ${JSON.stringify(error.response.data)}`);
      }
      throw error;
    }
  }
  
  /**
   * Get all available sports from OddsAPI
   */
  async getSports(): Promise<any> {
    try {
      const url = `${this.baseUrl}/api/odds/sports`;
      
      logger.info('MicroserviceClient', `Fetching available sports from ${url}`);
      
      const response = await axios.get(url);
      
      logger.info('MicroserviceClient', `Received ${response.data.count} sports`);
      
      return response.data;
    } catch (error: any) {
      logger.error('MicroserviceClient', `Error fetching sports: ${error.message}`);
      if (error.response) {
        logger.error('MicroserviceClient', `Status: ${error.response.status}, Data: ${JSON.stringify(error.response.data)}`);
      }
      throw error;
    }
  }
  
  /**
   * Get live scores for matches
   */
  async getLiveScores(): Promise<any> {
    try {
      const url = `${this.baseUrl}/api/livescore`;
      
      logger.info('MicroserviceClient', `Fetching live scores from ${url}`);
      
      const response = await axios.get(url);
      
      logger.info('MicroserviceClient', `Received ${response.data.count} live events`);
      
      return response.data;
    } catch (error: any) {
      logger.error('MicroserviceClient', `Error fetching live scores: ${error.message}`);
      if (error.response) {
        logger.error('MicroserviceClient', `Status: ${error.response.status}, Data: ${JSON.stringify(error.response.data)}`);
      }
      throw error;
    }
  }
  
  /**
   * Get fixtures for a specific league
   * @param leagueId League ID
   */
  async getLeagueFixtures(leagueId: string): Promise<any> {
    try {
      const url = `${this.baseUrl}/api/fixtures/league/${leagueId}`;
      
      logger.info('MicroserviceClient', `Fetching fixtures for league ${leagueId} from ${url}`);
      
      const response = await axios.get(url);
      
      logger.info('MicroserviceClient', `Received ${response.data.count} fixtures for league ${leagueId}`);
      
      return response.data;
    } catch (error: any) {
      logger.error('MicroserviceClient', `Error fetching fixtures for league ${leagueId}: ${error.message}`);
      if (error.response) {
        logger.error('MicroserviceClient', `Status: ${error.response.status}, Data: ${JSON.stringify(error.response.data)}`);
      }
      throw error;
    }
  }
  
  /**
   * Get teams for a specific league
   * @param leagueId League ID
   */
  async getTeams(leagueId: string): Promise<any> {
    try {
      const url = `${this.baseUrl}/api/teams/${leagueId}`;
      
      logger.info('MicroserviceClient', `Fetching teams for league ${leagueId} from ${url}`);
      
      const response = await axios.get(url);
      
      logger.info('MicroserviceClient', `Received ${response.data.count} teams for league ${leagueId}`);
      
      return response.data;
    } catch (error: any) {
      logger.error('MicroserviceClient', `Error fetching teams for league ${leagueId}: ${error.message}`);
      if (error.response) {
        logger.error('MicroserviceClient', `Status: ${error.response.status}, Data: ${JSON.stringify(error.response.data)}`);
      }
      throw error;
    }
  }
  
  /**
   * Get all available leagues
   */
  async getLeagues(): Promise<any> {
    try {
      const url = `${this.baseUrl}/api/leagues`;
      
      logger.info('MicroserviceClient', `Fetching leagues from ${url}`);
      
      const response = await axios.get(url);
      
      logger.info('MicroserviceClient', `Received ${response.data.count} leagues`);
      
      return response.data;
    } catch (error: any) {
      logger.error('MicroserviceClient', `Error fetching leagues: ${error.message}`);
      if (error.response) {
        logger.error('MicroserviceClient', `Status: ${error.response.status}, Data: ${JSON.stringify(error.response.data)}`);
      }
      throw error;
    }
  }
  
  /**
   * Check the status of the microservice
   */
  async getStatus(): Promise<any> {
    try {
      const url = `${this.baseUrl}/api/status`;
      
      logger.info('MicroserviceClient', `Checking microservice status from ${url}`);
      
      const response = await axios.get(url);
      
      logger.info('MicroserviceClient', `Microservice status: ${response.data.overall}`);
      
      return response.data;
    } catch (error: any) {
      logger.error('MicroserviceClient', `Error checking microservice status: ${error.message}`);
      if (error.response) {
        logger.error('MicroserviceClient', `Status: ${error.response.status}, Data: ${JSON.stringify(error.response.data)}`);
      }
      
      return {
        timestamp: new Date().toISOString(),
        overall: 'error',
        services: {
          odds_api: {
            status: 'error',
            message: error.message
          },
          sportsdb_api: {
            status: 'error',
            message: error.message
          }
        }
      };
    }
  }
  
  /**
   * Start the microservice if it's not already running
   */
  async startMicroservice(): Promise<boolean> {
    try {
      // Check if the microservice is already running
      await this.getStatus();
      logger.info('MicroserviceClient', 'Microservice is already running');
      return true;
    } catch (error) {
      logger.warn('MicroserviceClient', 'Microservice is not running, attempting to start it');
      
      try {
        // We're in a Node.js environment so we use child_process to start the Python script
        const { spawn } = require('child_process');
        
        // Start the API service in a separate process
        const process = spawn('python', ['ai_service/start_api_service.py'], {
          detached: true,
          stdio: 'ignore'
        });
        
        // Unref the process to allow the Node.js process to exit independently
        process.unref();
        
        // Give it some time to start
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Check if it's running now
        try {
          await this.getStatus();
          logger.info('MicroserviceClient', 'Successfully started the microservice');
          return true;
        } catch (error) {
          logger.error('MicroserviceClient', 'Failed to start the microservice');
          return false;
        }
      } catch (error: any) {
        logger.error('MicroserviceClient', `Error starting microservice: ${error.message}`);
        return false;
      }
    }
  }
}

// Export a singleton instance
export const microserviceClient = new MicroserviceClient();