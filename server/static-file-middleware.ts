/**
 * Static file middleware for PuntaIQ
 * This handles serving static files and providing SPA fallbacks
 */

import express, { Express, Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { logger } from './logger';

/**
 * Find the best index.html file to serve for the SPA
 */
function findIndexHtml(): string | null {
  // Try various possible locations for index.html
  const possiblePaths = [
    path.resolve(process.cwd(), 'client', 'index.html'),
    path.resolve(process.cwd(), 'public', 'index.html'),
    path.resolve(process.cwd(), 'client', 'dist', 'index.html'),
    path.resolve(process.cwd(), 'dist', 'client', 'index.html'),
    path.resolve(process.cwd(), 'index.html'),
  ];
  
  for (const indexPath of possiblePaths) {
    if (fs.existsSync(indexPath)) {
      logger.info(`Found index.html at ${indexPath}`);
      return indexPath;
    }
  }
  
  logger.warn('No index.html found in any of the expected locations');
  return null;
}

/**
 * Setup static file serving for the Express app
 */
export function setupStaticFileServing(app: Express): void {
  // Log which static directories we're going to try
  logger.info('Setting up static file serving middleware');
  
  // Match various key file access patterns
  app.get('/favicon.ico', (req: Request, res: Response) => {
    const faviconPaths = [
      path.resolve(process.cwd(), 'public', 'favicon.ico'),
      path.resolve(process.cwd(), 'client', 'public', 'favicon.ico'),
      path.resolve(process.cwd(), 'client', 'dist', 'favicon.ico'),
      path.resolve(process.cwd(), 'dist', 'client', 'favicon.ico'),
      path.resolve(process.cwd(), 'favicon.ico'),
    ];
    
    for (const faviconPath of faviconPaths) {
      if (fs.existsSync(faviconPath)) {
        return res.sendFile(faviconPath);
      }
    }
    
    // If no favicon found, return 404
    res.status(404).send('Not found');
  });
  
  // Root path handler for index.html
  app.get('/', (req: Request, res: Response) => {
    const indexHtmlPath = findIndexHtml();
    
    if (indexHtmlPath) {
      logger.info(`Serving index.html from ${indexHtmlPath} for root path`);
      return res.sendFile(indexHtmlPath);
    } else {
      // Generate a basic HTML page if no index.html is found
      logger.warn('No index.html found, generating fallback HTML');
      
      res.setHeader('Content-Type', 'text/html');
      return res.send(`<!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>PuntaIQ</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              background: #f5f5f5;
              color: #333;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
            }
            .container {
              text-align: center;
              max-width: 500px;
              padding: 2rem;
              background: white;
              border-radius: 8px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            h1 { color: #0066cc; margin-top: 0; }
            p { line-height: 1.5; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Welcome to PuntaIQ</h1>
            <p>The AI-powered sports prediction platform</p>
          </div>
        </body>
      </html>`);
    }
  });
  
  // Try multiple static directories
  const staticDirs = [
    { url: '/assets', dir: path.resolve(process.cwd(), 'client', 'dist', 'assets') },
    { url: '/assets', dir: path.resolve(process.cwd(), 'dist', 'client', 'assets') },
    { url: '/assets', dir: path.resolve(process.cwd(), 'public', 'assets') },
    { url: '/assets', dir: path.resolve(process.cwd(), 'client', 'public', 'assets') },
    { url: '/assets', dir: path.resolve(process.cwd(), 'assets') },
    { url: '/public', dir: path.resolve(process.cwd(), 'public') },
    { url: '/public', dir: path.resolve(process.cwd(), 'client', 'public') },
  ];
  
  for (const { url, dir } of staticDirs) {
    if (fs.existsSync(dir)) {
      logger.info(`Setting up static directory: ${url} -> ${dir}`);
      app.use(url, express.static(dir));
    }
  }
  
  // Handle direct asset requests to ensure they work
  app.get('/favicon.png', (req, res) => {
    const faviconPaths = [
      path.resolve(process.cwd(), 'public', 'favicon.png'),
      path.resolve(process.cwd(), 'client', 'public', 'favicon.png'),
      path.resolve(process.cwd(), 'client', 'dist', 'favicon.png'),
      path.resolve(process.cwd(), 'dist', 'client', 'favicon.png'),
      path.resolve(process.cwd(), 'favicon.png'),
    ];
    
    for (const iconPath of faviconPaths) {
      if (fs.existsSync(iconPath)) {
        return res.sendFile(iconPath);
      }
    }
    
    res.status(404).send('Not found');
  });
  
  // Serve all client-side routes from our SPA's index.html
  logger.info('Static file middleware setup complete');
}

/**
 * Set up SPA fallback middleware to handle client-side routes
 */
export function setupSpaFallback(app: Express): void {
  logger.info('Setting up SPA fallback middleware');
  
  // This middleware handles all frontend routes by serving the SPA
  app.use((req: Request, res: Response, next: NextFunction) => {
    // Skip API and AI service paths
    if (req.path.startsWith('/api/') || 
        req.path.startsWith('/ai-service/') ||
        req.path.includes('.')) {
      return next();
    }
    
    logger.info(`SPA fallback handling: ${req.originalUrl}`);
    
    // Get index.html path
    const indexHtmlPath = findIndexHtml();
    
    if (!indexHtmlPath) {
      logger.warn(`No index.html found for SPA fallback for ${req.originalUrl}`);
      return next();
    }
    
    // Serve the index.html with navigation recovery code
    try {
      const htmlContent = fs.readFileSync(indexHtmlPath, 'utf8');
      
      // Inject special meta tags and recovery script into the HTML
      const modifiedHtml = htmlContent
        .replace(
          '</head>',
          `<meta name="puntaiq-app-route" content="${req.originalUrl}" />
          <script>
            // Record the original URL to help with route recovery
            window.__PUNTAIQ_ORIGINAL_URL = "${req.originalUrl}";
            
            // Store path for recovery if needed
            if (window.sessionStorage) {
              sessionStorage.setItem('puntaiq_recovery_path', "${req.originalUrl}");
            }
          </script>
          </head>`
        );
      
      res.setHeader('Content-Type', 'text/html');
      res.send(modifiedHtml);
    } catch (error) {
      logger.error(`Error serving SPA fallback for ${req.originalUrl}: ${error instanceof Error ? error.message : String(error)}`);
      next();
    }
  });
  
  logger.info('SPA fallback middleware setup complete');
}