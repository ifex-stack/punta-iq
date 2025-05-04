/**
 * Simple standalone HTML server
 * Serves static files and the index.html for the application
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import { createContextLogger } from './logger';

const logger = createContextLogger('StandaloneHTMLServer');

/**
 * Start a simple static file server
 */
export function startStandaloneHtmlServer() {
  logger.info('Starting standalone HTML server');
  
  const app = express();
  const port = process.env.PORT || 3000;
  
  // Serve static files from public directory
  const publicDir = path.resolve(process.cwd(), 'public');
  if (fs.existsSync(publicDir)) {
    app.use(express.static(publicDir));
    logger.info(`Serving static files from ${publicDir}`);
  } else {
    logger.warn(`Public directory ${publicDir} does not exist, creating it`);
    try {
      fs.mkdirSync(publicDir, { recursive: true });
    } catch (error) {
      logger.error(`Failed to create public directory: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  // Serve the root index.html
  app.get('/', (req, res) => {
    const indexPath = path.resolve(process.cwd(), 'public', 'index.html');
    if (fs.existsSync(indexPath)) {
      logger.info(`Serving root index.html from ${indexPath}`);
      res.sendFile(indexPath);
    } else {
      // Generate a dynamic index.html
      logger.warn('No index.html found, generating temporary one');
      res.send(`
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>PuntaIQ - Loading...</title>
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
              .loading {
                display: inline-block;
                width: 30px;
                height: 30px;
                border: 3px solid rgba(0,102,204,0.3);
                border-radius: 50%;
                border-top-color: #0066cc;
                animation: spin 1s ease-in-out infinite;
              }
              @keyframes spin {
                to { transform: rotate(360deg); }
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="loading"></div>
              <h1>PuntaIQ Sports</h1>
              <p>Loading application...</p>
              <p><small>Server port: ${port}</small></p>
            </div>
            <script>
              console.log('Standalone HTML server running');
              setTimeout(() => {
                // Attempt to load the application
                fetch('/api/debug/info')
                  .then(response => {
                    if (response.ok) {
                      return response.json();
                    }
                    throw new Error('API not available');
                  })
                  .then(data => {
                    console.log('API connection successful:', data);
                    document.querySelector('p').textContent = 'Application ready - connecting to API...';
                    
                    // Redirect to application after a short delay
                    setTimeout(() => {
                      window.location.href = '/api/debug/test-page';
                    }, 1000);
                  })
                  .catch(error => {
                    console.error('API connection failed:', error);
                    document.querySelector('p').textContent = 'Error connecting to API. Please refresh to try again.';
                  });
              }, 1500);
            </script>
          </body>
        </html>
      `);
    }
  });
  
  // Catch-all route for other paths
  app.use('*', (req, res) => {
    // If path starts with /api or includes a file extension, return 404
    if (req.path.startsWith('/api/') || req.path.includes('.')) {
      return res.status(404).send('Not Found');
    }
    
    // Otherwise, serve the index.html
    res.redirect('/');
  });
  
  // Start the server
  app.listen(port, () => {
    logger.info(`Standalone HTML server running on port ${port}`);
  });
  
  return app;
}