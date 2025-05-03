import { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { createContextLogger } from './logger';

const logger = createContextLogger('SPA-Middleware');

/**
 * SPA Middleware for handling frontend routes
 * This middleware serves the index.html file for any non-API routes
 * to support client-side routing in the React/Vue/Angular SPA
 */
export default function spaMiddleware(req: Request, res: Response, next: NextFunction) {
  // Skip middleware for API routes, AI service routes, and static files
  if (
    req.path.startsWith('/api/') ||
    req.path.startsWith('/ai-service/') ||
    req.path.includes('.') ||
    req.path.startsWith('/assets/') ||
    req.method !== 'GET'
  ) {
    return next();
  }

  logger.info(`SPA middleware handling route: ${req.path}`);
  
  // For all other routes, serve the index.html file to support SPA routing
  const indexPaths = [
    path.resolve(process.cwd(), 'public', 'index.html'),
    path.resolve(process.cwd(), 'client', 'index.html'),
    path.resolve(process.cwd(), 'index.html')
  ];
  
  // Find the first existing index.html file
  for (const indexPath of indexPaths) {
    if (fs.existsSync(indexPath)) {
      logger.info(`Serving SPA index.html from ${indexPath} for ${req.path}`);
      return res.sendFile(indexPath);
    }
  }
  
  // If no index.html file is found, pass to the next middleware
  logger.warn(`No index.html file found for SPA route: ${req.path}`);
  next();
}