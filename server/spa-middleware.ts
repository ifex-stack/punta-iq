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
    logger.debug(`SPA middleware skipping route: ${req.path}`);
    return next();
  }

  logger.info(`SPA middleware handling route: ${req.path}`);
  
  // For all other routes, serve the index.html file to support SPA routing
  const indexPaths = [
    path.resolve(process.cwd(), 'client', 'dist', 'index.html'),
    path.resolve(process.cwd(), 'dist', 'client', 'index.html'),
    path.resolve(process.cwd(), 'public', 'index.html'),
    path.resolve(process.cwd(), 'client', 'index.html'),
    path.resolve(process.cwd(), 'index.html')
  ];
  
  // Find the first existing index.html file and inject route recovery code
  for (const indexPath of indexPaths) {
    if (fs.existsSync(indexPath)) {
      logger.info(`Found SPA index.html at ${indexPath} for ${req.path}`);
      
      try {
        // Read the file and inject route recovery code
        const originalUrl = req.originalUrl;
        const htmlContent = fs.readFileSync(indexPath, 'utf8');
        
        // Inject route recovery code
        const modifiedHtml = htmlContent
          .replace(
            '</head>',
            `<meta name="puntaiq-app-route" content="${originalUrl}" />
            <script>
              // Record the original URL to help with route recovery
              window.__PUNTAIQ_ORIGINAL_URL = "${originalUrl}";
              window.__PUNTAIQ_SERVER_PORT = "${req.socket.localPort}";
              
              // Store path for recovery if needed
              if (window.sessionStorage) {
                sessionStorage.setItem('puntaiq_recovery_path', "${originalUrl}");
              }
              
              // For direct access to SPA routes like /predictions, ensure client-side routing works
              document.addEventListener('DOMContentLoaded', function() {
                // Check for SPA framework initialization
                if (window.location.pathname !== '/' && 
                    window.location.pathname !== '/index.html' && 
                    !window.__PUNTAIQ_ROUTER_INITIALIZED) {
                  console.log('PuntaIQ - Initializing SPA routing for direct route access:', window.location.pathname);
                  
                  // Create a flag to avoid multiple initializations
                  window.__PUNTAIQ_ROUTER_INITIALIZED = true;
                }
              });
            </script>
            </head>`
          );
        
        // Send the modified HTML
        res.setHeader('Content-Type', 'text/html');
        return res.send(modifiedHtml);
      } catch (error) {
        logger.error(`Error injecting route recovery code: ${error instanceof Error ? error.message : String(error)}`);
        // Fall back to sending the file directly if modification fails
        return res.sendFile(indexPath);
      }
    }
  }
  
  // If no index.html file is found, pass to the next middleware
  logger.warn(`No index.html file found for SPA route: ${req.path}`);
  next();
}