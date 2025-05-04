/**
 * Launch script for the standalone PuntaIQ server
 * This will check for dependencies and launch the server
 */

import express from 'express';
import fs from 'fs';
import path from 'path';
import http from 'http';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function startServer() {
  console.log('Starting standalone PuntaIQ server...');
  
  const app = express();
  const port = process.env.PORT || 3001; // Use port 3001 to avoid conflict with main server
  
  // Basic logging middleware
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
  
  // Serve static files from the public directory
  const publicDir = path.join(__dirname, 'public');
  if (fs.existsSync(publicDir)) {
    console.log(`Serving static files from ${publicDir}`);
    app.use(express.static(publicDir, { 
      index: 'index.html'
    }));
  } else {
    console.warn(`Public directory ${publicDir} does not exist, creating it`);
    try {
      fs.mkdirSync(publicDir, { recursive: true });
    } catch (error) {
      console.error(`Failed to create public directory: ${error.message}`);
    }
  }
  
  // Proxy for AI microservice
  app.use('/ai-service', (req, res) => {
    console.log(`Proxying request to AI service: ${req.method} ${req.path}`);
    
    const targetPath = req.path;
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: targetPath,
      method: req.method,
      headers: req.headers
    };
    
    try {
      const proxyReq = http.request(options, (proxyRes) => {
        res.writeHead(proxyRes.statusCode, proxyRes.headers);
        proxyRes.pipe(res);
      });
      
      proxyReq.on('error', (error) => {
        console.error(`Proxy error: ${error.message}`);
        res.status(502).json({ 
          error: 'AI Service Unavailable',
          message: 'Could not connect to the AI microservice'
        });
      });
      
      if (req.body) {
        proxyReq.write(JSON.stringify(req.body));
      }
      
      proxyReq.end();
    } catch (error) {
      console.error(`Failed to create proxy request: ${error.message}`);
      res.status(502).json({
        error: 'AI Service Proxy Error',
        message: 'Failed to create proxy request to AI microservice'
      });
    }
  });
  
  // Basic API endpoint for testing
  app.get('/api/status', (req, res) => {
    res.json({
      status: 'ok',
      server: 'standalone',
      timestamp: new Date().toISOString()
    });
  });
  
  // SPA fallback for client-side routing
  app.get('*', (req, res) => {
    // Skip if this is an API route or has a file extension
    if (req.path.startsWith('/api/') || req.path.includes('.')) {
      return res.status(404).json({
        error: 'Not Found',
        message: `Endpoint ${req.path} does not exist`
      });
    }
    
    // Serve the index.html for all other routes
    const indexPath = path.join(publicDir, 'index.html');
    if (fs.existsSync(indexPath)) {
      console.log(`Serving index.html for SPA route: ${req.path}`);
      return res.sendFile(indexPath);
    }
    
    // If no index.html exists, return a basic HTML response
    console.warn(`No index.html found, serving basic HTML for ${req.path}`);
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>PuntaIQ</title>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
              background: #f5f5f5;
              color: #333;
              text-align: center;
              padding: 0 20px;
            }
            h1 {
              color: #0066cc;
              margin-bottom: 0.5rem;
            }
            p {
              margin-bottom: 2rem;
              max-width: 600px;
            }
            .card {
              background: white;
              padding: 2rem;
              border-radius: 8px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
              margin-bottom: 2rem;
              width: 100%;
              max-width: 500px;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>PuntaIQ</h1>
            <p>The standalone server is running, but no index.html was found in the public directory.</p>
            <p>Current route: ${req.path}</p>
          </div>
        </body>
      </html>
    `);
  });
  
  // Start the server
  app.listen(port, () => {
    console.log(`Standalone server listening at http://localhost:${port}`);
  });
}

// Start the server
startServer();