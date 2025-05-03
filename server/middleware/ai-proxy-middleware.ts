import { Request, Response, NextFunction } from "express";
import axios from "axios";
import { createContextLogger } from "../logger";

const logger = createContextLogger("AI-PROXY");

/**
 * Middleware function to proxy requests to the AI microservice
 */
export function aiProxyMiddleware(req: Request, res: Response, next: NextFunction) {
  const path = req.originalUrl.replace(/^\/ai-service/, "");
  const targetUrl = `http://localhost:5000${path}`;
  
  logger.info(`Proxying AI service request: ${req.method} ${path} to ${targetUrl}`);
  
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
      
      res.status(502).json({
        error: "AI Service Unavailable",
        message: "No response received from AI service",
        status: 502
      });
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
}