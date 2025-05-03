/**
 * Catch-all routes for handling SPA routing and API 404s
 * This file defines middleware to handle all non-matched routes
 */

import type { Express, Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { createContextLogger } from './logger';

const logger = createContextLogger('SPA-Router');

/**
 * Set up catch-all routes for SPA and API requests
 * @param app Express application instance
 */
export function setupCatchAllRoutes(app: Express): void {
  // Handle API 404s with a more helpful message
  app.use('/api/*', (req: Request, res: Response) => {
    logger.warn(`API 404: ${req.originalUrl}`);
    res.status(404).json({
      message: 'API endpoint not found. Please check the URL and try again.',
      status: 404,
      path: req.originalUrl
    });
  });

  // Handle SPA routes with priority - this must come AFTER API routes, but take precedence over all others
  app.use('*', (req: Request, res: Response, next: NextFunction) => {
    // Skip if request is for an API route or includes a file extension (likely a static asset)
    if (req.originalUrl.startsWith('/api/') || req.originalUrl.includes('.')) {
      return next();
    }
    
    logger.info(`SPA route handling: ${req.originalUrl}`);
    
    // Try different paths for the index.html file
    const possiblePaths = [
      path.resolve(process.cwd(), 'client', 'index.html'),          // Development
      path.resolve(process.cwd(), 'client', 'dist', 'index.html'),  // Production build in /dist
      path.resolve(process.cwd(), 'dist', 'client', 'index.html'),  // Alternative production build
      path.resolve(process.cwd(), 'public', 'index.html')           // Public folder
    ];
    
    // Find first existing path
    const indexPath = possiblePaths.find(p => fs.existsSync(p));
    
    if (indexPath) {
      logger.debug(`Serving index.html from ${indexPath} for SPA route: ${req.originalUrl}`);
      
      // Get the HTML content
      try {
        // Read the file content
        const htmlContent = fs.readFileSync(indexPath, 'utf8');
        
        // Add debug info for diagnostics - helps track the issue
        const debugScript = `
        <script>
          console.log("Server-rendered SPA route:", ${JSON.stringify(req.originalUrl)});
          window.__DEBUG_ROUTE_INFO = {
            originalUrl: ${JSON.stringify(req.originalUrl)},
            servedAt: ${Date.now()},
            servedBy: "catch-all-routes.ts"
          };
        </script>
        `;
        
        // Insert debug script before closing head tag
        const enhancedHtml = htmlContent.replace('</head>', `${debugScript}</head>`);
        
        // Send the modified HTML
        res.setHeader('Content-Type', 'text/html');
        res.send(enhancedHtml);
      } catch (error) {
        logger.error(`Error reading/processing index.html: ${error}`);
        // Fallback to basic file sending if there's an error with the enhancement
        res.sendFile(indexPath);
      }
    } else {
      logger.error(`Could not find index.html in any expected location`);
      // Serve a basic HTML page as an absolute fallback
      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>PuntaIQ</title>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <script>
            // Force redirect to the base URL
            window.location.href = '/';
          </script>
        </head>
        <body>
          <h1>Loading PuntaIQ...</h1>
          <p>If you're not redirected automatically, <a href="/">click here</a>.</p>
        </body>
        </html>
      `);
    }
  });
}