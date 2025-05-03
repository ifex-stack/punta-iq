import { Request, Response, NextFunction } from "express";
import axios from "axios";
import { createContextLogger } from "../logger";
import { MicroserviceClient } from "../microservice-client";

const logger = createContextLogger("AI-PROXY");
const microserviceClient = new MicroserviceClient();

/**
 * Function to discover the AI microservice port dynamically
 * This helps in case the standard port is not available
 */
async function getAIServiceUrl(path: string): Promise<string> {
  try {
    logger.info("Attempting to discover AI service port");
    
    // Check if standard port 5000 is available
    logger.debug("Testing port 5000");
    const standardPortAvailable = await microserviceClient.isRunning(5000);
    
    if (standardPortAvailable) {
      logger.info("Discovered AI service on port 5000");
      return `http://localhost:5000${path}`;
    }
    
    // If standard port isn't available, try alternatives
    for (const port of [8000, 8080, 3001]) {
      logger.debug(`Testing port ${port}`);
      const isAvailable = await microserviceClient.isRunning(port);
      
      if (isAvailable) {
        logger.info(`Discovered AI service on port ${port}`);
        return `http://localhost:${port}${path}`;
      }
    }
    
    // Fall back to standard port if no alternatives work
    logger.warn("Could not discover AI service port, falling back to default 5000");
    return `http://localhost:5000${path}`;
  } catch (error) {
    logger.error(`Error discovering AI service port: ${error.message}`);
    return `http://localhost:5000${path}`;
  }
}

/**
 * Middleware function to proxy requests to the AI microservice
 */
export function aiProxyMiddleware(req: Request, res: Response, next: NextFunction) {
  const path = req.originalUrl.replace(/^\/ai-service/, "");
  
  // Get the target URL dynamically
  getAIServiceUrl(path).then(targetUrl => {
    logger.info(`Proxying AI service request: ${req.method} ${path} to ${targetUrl}`);
    
    // Handle direct connections to status endpoint
    if (path === '/api/status') {
      logger.info("Direct status check requested, attempting to ensure AI service is running");
      
      // Try to ensure microservice is running before checking status
      microserviceClient.ensureRunning().catch(err => {
        logger.warn(`Failed to ensure AI service is running: ${err.message}`);
      });
    }
    
    axios({
      method: req.method as any,
      url: targetUrl,
      headers: {
        ...req.headers as any,
        host: "localhost:5000"
      },
      data: req.body,
      responseType: "stream",
      timeout: 10000 // 10 second timeout
    })
    .then(response => {
      // Forward response headers
      res.status(response.status);
      Object.entries(response.headers).forEach(([key, value]) => {
        if (value !== undefined) {
          res.set(key, value as string);
        }
      });
      
      // Stream the response data
      response.data.pipe(res);
    })
    .catch(error => {
      logger.error(`AI proxy error: ${error.message || "Unknown error"}`);
      
      // Handle different error types
      if (error.response) {
        // The request was made and the AI service responded with a status code
        // that falls out of the range of 2xx
        const status = error.response.status || 500;
        logger.error(`AI service returned error status: ${status}`);
        
        res.status(status).json({
          error: "AI Service Error",
          message: error.message || `AI service returned status ${status}`,
          status
        });
      } else if (error.request) {
        // The request was made but no response was received
        logger.error("No response received from AI service");
        
        // If the status endpoint is not responding, try to restart the service
        if (path === '/api/status' || path === '/') {
          logger.warn("Status endpoint not responding, attempting to start AI service");
          
          microserviceClient.startService().then(() => {
            res.status(503).json({
              error: "AI Service Starting",
              message: "AI service was not running but has been started. Please try again in a moment.",
              status: 503
            });
          }).catch(startError => {
            logger.error(`Failed to start AI service: ${startError.message}`);
            
            res.status(502).json({
              error: "AI Service Unavailable",
              message: "AI service is unavailable and could not be started automatically.",
              status: 502
            });
          });
        } else {
          res.status(502).json({
            error: "AI Service Unavailable",
            message: "No response received from AI service",
            status: 502
          });
        }
      } else {
        // Something happened in setting up the request that triggered an Error
        logger.error(`Error creating AI service request: ${error.message}`);
        
        res.status(500).json({
          error: "AI Service Request Failed",
          message: error.message || "Failed to create request to AI service",
          status: 500
        });
      }
    });
  }).catch(error => {
    logger.error(`Failed to get AI service URL: ${error.message}`);
    
    res.status(500).json({
      error: "AI Service Configuration Error",
      message: "Failed to determine AI service URL",
      status: 500
    });
  });
}