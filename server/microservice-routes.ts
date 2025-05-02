/**
 * Routes for interacting with the AI microservice
 */

import { Express } from 'express';
import { microserviceClient } from './microservice-client';
import axios from 'axios';

// Type guard to check if an object has response data with a message
interface ErrorWithResponse {
  response?: {
    data?: {
      message?: string;
    };
    status?: number;
  };
}

// Helper function to safely get error details
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

// Helper function to check if an error is API key related
function isApiKeyError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) {
    return false;
  }
  
  const errWithResponse = error as ErrorWithResponse;
  return !!(
    errWithResponse.response?.data?.message &&
    typeof errWithResponse.response.data.message === 'string' &&
    errWithResponse.response.data.message.includes('API key')
  );
}

// Setup routes for microservice interaction
export function registerMicroserviceRoutes(app: Express) {
  // Get status of the AI microservice
  app.get('/api/sports/status', async (req, res) => {
    try {
      const status = await microserviceClient.getStatus();
      return res.json(status);
    } catch (error) {
      console.error('Error getting microservice status:', error);
      return res.status(500).json({
        message: 'Error checking microservice status',
        error: getErrorMessage(error)
      });
    }
  });

  // Start the AI microservice 
  app.post('/api/sports/microservice/start', async (req, res) => {
    try {
      const result = await microserviceClient.startService();
      
      if (result) {
        return res.json({ 
          success: true, 
          message: 'Microservice started successfully' 
        });
      } else {
        return res.status(500).json({ 
          success: false, 
          message: 'Failed to start microservice' 
        });
      }
    } catch (error) {
      console.error('Error starting microservice:', error);
      return res.status(500).json({
        success: false,
        message: 'Error starting microservice',
        error: getErrorMessage(error)
      });
    }
  });

  // Get odds from the AI microservice
  app.get('/api/sports/odds/:sport', async (req, res) => {
    try {
      const { sport } = req.params;
      
      // Check if the service is running first
      const isRunning = await microserviceClient.isServiceRunning();
      if (!isRunning) {
        // Try to start the service
        const started = await microserviceClient.startService();
        if (!started) {
          return res.status(503).json({ 
            message: 'AI service is not running and could not be started',
          });
        }
      }
      
      const odds = await microserviceClient.getOdds(sport);
      return res.json(odds);
    } catch (error) {
      console.error(`Error getting odds for ${req.params.sport}:`, error);
      
      // Check if it's an API key error
      if (isApiKeyError(error)) {
        const errWithResponse = error as ErrorWithResponse;
        return res.status(401).json({
          message: 'API key error: ' + errWithResponse.response?.data?.message,
        });
      }
      
      return res.status(500).json({
        message: 'Error fetching odds data',
        error: getErrorMessage(error)
      });
    }
  });

  // Get livescores from the AI microservice
  app.get('/api/sports/livescores', async (req, res) => {
    try {
      // Check if the service is running first
      const isRunning = await microserviceClient.isServiceRunning();
      if (!isRunning) {
        // Try to start the service
        const started = await microserviceClient.startService();
        if (!started) {
          return res.status(503).json({ 
            message: 'AI service is not running and could not be started',
          });
        }
      }
      
      const livescores = await microserviceClient.getLiveScores();
      return res.json(livescores);
    } catch (error) {
      console.error('Error getting livescores:', error);
      
      // Check if it's an API key error
      if (isApiKeyError(error)) {
        const errWithResponse = error as ErrorWithResponse;
        return res.status(401).json({
          message: 'API key error: ' + errWithResponse.response?.data?.message,
        });
      }
      
      return res.status(500).json({
        message: 'Error fetching livescore data',
        error: getErrorMessage(error)
      });
    }
  });
}