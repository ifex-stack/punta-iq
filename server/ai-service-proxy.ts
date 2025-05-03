/**
 * AI Service Proxy Router
 * Handles forwarding requests to the Python AI microservice
 */
import express from 'express';
import axios from 'axios';
import { createContextLogger } from './logger';

// Create a dedicated logger for the AI proxy
const logger = createContextLogger('AI-PROXY');

// Create a router for the AI service proxy
const aiServiceRouter = express.Router();

// Health check endpoint to check if we can reach the AI service
aiServiceRouter.get('/health', async (req, res) => {
  try {
    const response = await axios.get('http://localhost:5000/api/status', {
      timeout: 2000
    });
    res.json({
      status: 'ok',
      message: 'AI service is reachable',
      aiServiceStatus: response.data
    });
  } catch (error) {
    logger.error(`Health check failed: ${error.message}`);
    res.status(503).json({
      status: 'error',
      message: 'AI service is not reachable',
      error: error.message
    });
  }
});

// General proxy handler for all other routes
aiServiceRouter.all('*', async (req, res) => {
  // Get the path without the /ai-service prefix
  const path = req.path;
  const targetUrl = `http://localhost:5000${path}`;
  
  logger.info(`Proxying ${req.method} ${path} to ${targetUrl}`);
  
  try {
    // Make a request to the AI service
    const response = await axios({
      url: targetUrl,
      method: req.method as any,
      headers: {
        ...(req.headers as any),
        host: 'localhost:5000'
      },
      data: req.body,
      params: req.query,
      timeout: 10000,
      validateStatus: () => true // Accept any status code
    });
    
    // Set status code
    res.status(response.status);
    
    // Copy headers
    Object.entries(response.headers).forEach(([key, value]) => {
      if (value !== undefined) {
        res.setHeader(key, value);
      }
    });
    
    // Send response data
    logger.info(`Proxy response from AI service: ${response.status}`);
    res.send(response.data);
  } catch (error) {
    logger.error(`Proxy error: ${error.message}`);
    
    if (error.response) {
      // If we got a response from the AI service, forward it
      res.status(error.response.status).json({
        error: 'AI Service Error',
        message: error.message,
        status: error.response.status
      });
    } else {
      // General error (connection error, timeout, etc.)
      res.status(502).json({
        error: 'AI Service Unavailable',
        message: 'Error connecting to AI service',
        details: error.message,
        code: error.code
      });
    }
  }
});

export { aiServiceRouter };