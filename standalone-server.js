/**
 * Standalone Express server for PuntaIQ
 * This provides a dedicated server for frontend content
 * completely separate from the AI microservice
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import cors from 'cors';

// Get the directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

// Enable CORS to help with development and API calls
app.use(cors());

// Find the best index.html file to serve for the SPA
function findIndexHtml() {
  // Try various possible locations for index.html
  const possiblePaths = [
    path.resolve(__dirname, 'client', 'index.html'),
    path.resolve(__dirname, 'public', 'index.html'),
    path.resolve(__dirname, 'client', 'dist', 'index.html'),
    path.resolve(__dirname, 'dist', 'client', 'index.html'),
    path.resolve(__dirname, 'index.html'),
  ];
  
  for (const indexPath of possiblePaths) {
    if (fs.existsSync(indexPath)) {
      console.log(`Found index.html at ${indexPath}`);
      return indexPath;
    }
  }
  
  console.warn('No index.html found in any of the expected locations');
  return null;
}

// Setup static file serving for the Express app
function setupStaticFileServing() {
  // Log which static directories we're going to try
  console.log('Setting up static file serving middleware');
  
  // Match various key file access patterns
  app.get('/favicon.ico', (req, res) => {
    const faviconPaths = [
      path.resolve(__dirname, 'public', 'favicon.ico'),
      path.resolve(__dirname, 'client', 'public', 'favicon.ico'),
      path.resolve(__dirname, 'client', 'dist', 'favicon.ico'),
      path.resolve(__dirname, 'dist', 'client', 'favicon.ico'),
      path.resolve(__dirname, 'favicon.ico'),
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
  app.get('/', (req, res) => {
    const indexHtmlPath = findIndexHtml();
    
    if (indexHtmlPath) {
      console.log(`Serving index.html from ${indexHtmlPath} for root path`);
      return res.sendFile(indexHtmlPath);
    } else {
      // Generate a basic HTML page if no index.html is found
      console.warn('No index.html found, generating fallback HTML');
      
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
            <p>Running in standalone mode</p>
          </div>
        </body>
      </html>`);
    }
  });
  
  // Try multiple static directories
  const staticDirs = [
    { url: '/assets', dir: path.resolve(__dirname, 'client', 'dist', 'assets') },
    { url: '/assets', dir: path.resolve(__dirname, 'dist', 'client', 'assets') },
    { url: '/assets', dir: path.resolve(__dirname, 'public', 'assets') },
    { url: '/assets', dir: path.resolve(__dirname, 'client', 'public', 'assets') },
    { url: '/assets', dir: path.resolve(__dirname, 'assets') },
    { url: '/public', dir: path.resolve(__dirname, 'public') },
    { url: '/public', dir: path.resolve(__dirname, 'client', 'public') },
  ];
  
  for (const { url, dir } of staticDirs) {
    if (fs.existsSync(dir)) {
      console.log(`Setting up static directory: ${url} -> ${dir}`);
      app.use(url, express.static(dir));
    }
  }
  
  console.log('Static file middleware setup complete');
}

// Set up SPA fallback middleware to handle client-side routes
function setupSpaFallback() {
  console.log('Setting up SPA fallback middleware');
  
  // This middleware handles all frontend routes by serving the SPA
  app.use((req, res, next) => {
    // Skip API and AI service paths
    if (req.path.startsWith('/api/') || 
        req.path.startsWith('/ai-service/') ||
        req.path.includes('.')) {
      return next();
    }
    
    console.log(`SPA fallback handling: ${req.originalUrl}`);
    
    // Get index.html path
    const indexHtmlPath = findIndexHtml();
    
    if (!indexHtmlPath) {
      console.warn(`No index.html found for SPA fallback for ${req.originalUrl}`);
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
          <meta name="puntaiq-standalone-mode" content="true" />
          <script>
            // Record the original URL to help with route recovery
            window.__PUNTAIQ_ORIGINAL_URL = "${req.originalUrl}";
            window.__PUNTAIQ_STANDALONE_MODE = true;
            
            // Store path for recovery if needed
            if (window.sessionStorage) {
              sessionStorage.setItem('puntaiq_recovery_path', "${req.originalUrl}");
              sessionStorage.setItem('puntaiq_standalone_mode', "true");
            }
            
            console.log('PuntaIQ standalone mode active');
          </script>
          </head>`
        );
      
      res.setHeader('Content-Type', 'text/html');
      res.send(modifiedHtml);
    } catch (error) {
      console.error(`Error serving SPA fallback for ${req.originalUrl}: ${error instanceof Error ? error.message : String(error)}`);
      next();
    }
  });
  
  console.log('SPA fallback middleware setup complete');
}

// Setup fallback error handler
app.use((req, res) => {
  res.status(404).send(`
    <html>
      <head>
        <title>PuntaIQ - Page Not Found</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background: #f8f9fa;
          }
          .container {
            text-align: center;
            padding: 2rem;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            max-width: 500px;
          }
          h1 { color: #0066cc; }
          .not-found { font-size: 5rem; margin: 0; }
          a { color: #0066cc; text-decoration: none; }
          a:hover { text-decoration: underline; }
        </style>
      </head>
      <body>
        <div class="container">
          <p class="not-found">404</p>
          <h1>Page Not Found</h1>
          <p>The page you're looking for cannot be found in standalone mode.</p>
          <p>Path: ${req.originalUrl}</p>
          <p><a href="/">Return to Home</a></p>
        </div>
      </body>
    </html>
  `);
});

// Initialize the server
function initializeServer() {
  console.log('Initializing standalone PuntaIQ server');
  
  // Setup static file serving and SPA fallbacks
  setupStaticFileServing();
  setupSpaFallback();
  
  // Start the server
  app.listen(port, '0.0.0.0', () => {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║    PuntaIQ Standalone Server Running on Port ${port}        ║
║                                                            ║
║    Access the app at: http://localhost:${port}              ║
║                                                            ║
║    Note: This server serves the frontend only.             ║
║    API requests will be proxied to the main server if      ║
║    it is running, otherwise they will fail.                ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
`);
  });
}

// Start the server
initializeServer();