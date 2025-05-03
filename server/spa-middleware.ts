import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import { createContextLogger } from './logger';

// Create specialized logger for SPA middleware
const spaLogger = createContextLogger('SPA-Middleware');

// Middleware to handle SPA routing by serving index.html for all routes that don't match static assets or API endpoints
export function spaMiddleware(req: Request, res: Response, next: NextFunction) {
  // Skip if this is an API request or a static asset request
  const { originalUrl } = req;
  
  if (
    originalUrl.startsWith('/api/') || 
    originalUrl.startsWith('/ai-service/') ||
    originalUrl.includes('.') ||  // Simpler check for assets
    originalUrl.startsWith('/assets/') ||
    originalUrl.startsWith('/node_modules/')
  ) {
    // Let the next middleware handle API routes and static files
    return next();
  }
  
  spaLogger.info(`Processing SPA route: ${originalUrl}`);
  
  // First, check if we have a project root index.html (highest priority)
  const rootIndexPath = path.resolve(process.cwd(), 'index.html');
  
  if (fs.existsSync(rootIndexPath)) {
    // Serve the root index.html file directly
    spaLogger.info(`Serving root index.html for ${originalUrl}`);
    
    // Generate emergency fallback HTML
    try {
      // Create a simple HTML file with just the React root
      const simpleHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PuntaIQ - Sports Predictions</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 0;
      background-color: #f5f7fa;
    }
    #root {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    .loading {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      flex-direction: column;
    }
    .loading-spinner {
      width: 50px;
      height: 50px;
      border: 5px solid #f3f3f3;
      border-top: 5px solid #3498db;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  </style>
  <meta name="route-recovery" content="true" data-original-url="${originalUrl}" />
  <meta name="puntaiq-app-route" content="${originalUrl}" />
  <script>
    // Record the original URL to help with route recovery
    window.__PUNTAIQ_ORIGINAL_URL = "${originalUrl}";
    window.__PUNTAIQ_SERVER_PORT = "${req.socket.localPort}";
    
    // Store path for recovery if needed
    if (window.sessionStorage) {
      sessionStorage.setItem('puntaiq_recovery_path', "${originalUrl}");
    }
  </script>
</head>
<body>
  <div id="root">
    <div class="loading">
      <div class="loading-spinner"></div>
      <h2>Loading PuntaIQ...</h2>
    </div>
  </div>
  <script type="module" src="/client/src/main.tsx"></script>
</body>
</html>`;
      
      return res
        .status(200)
        .set({ 'Content-Type': 'text/html' })
        .send(simpleHtml);
    } catch (error) {
      spaLogger.error(`Error generating simple HTML: ${error}`);
    }
  }
  
  // Try to find index.html in the client directory
  const clientIndexPath = path.resolve(process.cwd(), 'client', 'index.html');
  
  if (fs.existsSync(clientIndexPath)) {
    spaLogger.info(`Serving client index.html for ${originalUrl}`);
    
    try {
      // Read and modify the HTML content
      const htmlContent = fs.readFileSync(clientIndexPath, 'utf8');
      const modifiedHtml = htmlContent
        .replace(
          '</head>',
          `<meta name="route-recovery" content="true" data-original-url="${originalUrl}" />
          <meta name="puntaiq-app-route" content="${originalUrl}" />
          <script>
            // Record the original URL to help with route recovery
            window.__PUNTAIQ_ORIGINAL_URL = "${originalUrl}";
            window.__PUNTAIQ_SERVER_PORT = "${req.socket.localPort}";
            
            // Store path for recovery if needed
            if (window.sessionStorage) {
              sessionStorage.setItem('puntaiq_recovery_path', "${originalUrl}");
            }
          </script>
          </head>`
        );
      
      return res
        .status(200)
        .set({ 'Content-Type': 'text/html' })
        .send(modifiedHtml);
    } catch (error) {
      spaLogger.error(`Error serving client index.html: ${error}`);
    }
  }
  
  // If we couldn't find or serve the client index.html, try alternatives
  
  // Try public/index.html next
  const publicIndexPath = path.resolve(process.cwd(), 'public', 'index.html');
  if (fs.existsSync(publicIndexPath)) {
    spaLogger.info(`Serving public index.html for ${originalUrl}`);
    return res.sendFile(publicIndexPath);
  }
  
  // Finally try public/redirect.html as last resort
  const redirectPath = path.resolve(process.cwd(), 'public', 'redirect.html');
  if (fs.existsSync(redirectPath)) {
    spaLogger.info(`Serving redirect.html for ${originalUrl}`);
    return res.sendFile(redirectPath);
  }
  
  // If all else fails, generate a minimal HTML file on the fly
  spaLogger.info(`Generating minimal HTML for ${originalUrl}`);
  const minimalHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PuntaIQ</title>
  <style>
    body { font-family: sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    h1 { color: #4f46e5; }
    .card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
  </style>
</head>
<body>
  <div class="card">
    <h1>PuntaIQ Sports Predictions</h1>
    <p>Loading application resources...</p>
    <p>Current path: ${originalUrl}</p>
    <p><a href="/">Go to Home Page</a></p>
    <script>
      // Auto-redirect to home after 2 seconds
      setTimeout(() => {
        window.location.href = "/";
      }, 2000);
    </script>
  </div>
</body>
</html>`;

  return res
    .status(200)
    .set({ 'Content-Type': 'text/html' })
    .send(minimalHtml);
}