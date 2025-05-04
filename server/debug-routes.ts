/**
 * Debug Routes for PuntaIQ
 * These routes provide information about the application's configuration and serve as test endpoints
 */

import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { logger } from './logger';

const router = express.Router();

/**
 * GET /api/debug/server-info
 * Returns information about the server configuration
 */
router.get('/server-info', (req: Request, res: Response) => {
  // Scan for important directories and files
  logger.info('Serving /api/debug/server-info');
  
  // Find all directories in the root directory
  const rootPath = process.cwd();
  const directories = [];
  
  try {
    const items = fs.readdirSync(rootPath);
    for (const item of items) {
      const itemPath = path.join(rootPath, item);
      try {
        if (fs.statSync(itemPath).isDirectory()) {
          directories.push(item);
        }
      } catch (err) {
        // Skip items with access issues
      }
    }
  } catch (err) {
    logger.error(`Error reading root directory: ${err.message}`);
  }
  
  // Check for index.html files
  const indexHtmlFound = [];
  const indexHtmlPaths = [
    path.resolve(rootPath, 'client', 'index.html'),
    path.resolve(rootPath, 'public', 'index.html'),
    path.resolve(rootPath, 'client', 'dist', 'index.html'),
    path.resolve(rootPath, 'dist', 'client', 'index.html'),
    path.resolve(rootPath, 'index.html')
  ];
  
  for (const indexPath of indexHtmlPaths) {
    if (fs.existsSync(indexPath)) {
      indexHtmlFound.push(indexPath);
    }
  }
  
  // Return server information
  res.json({
    success: true,
    server: {
      nodeVersion: process.version,
      environment: process.env.NODE_ENV || 'unknown',
      pid: process.pid,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      mainPort: process.env.PORT || 3000,
      aiServicePort: 5000,
    },
    filesystem: {
      rootPath,
      directories,
      indexHtmlFound,
      clientDir: fs.existsSync(path.join(rootPath, 'client')),
      serverDir: fs.existsSync(path.join(rootPath, 'server')),
      publicDir: fs.existsSync(path.join(rootPath, 'public')),
    },
    request: {
      hostname: req.hostname,
      ip: req.ip,
      protocol: req.protocol,
      secure: req.secure,
      originalUrl: req.originalUrl,
      xhr: req.xhr,
      userAgent: req.headers['user-agent'],
      port: req.socket.localPort
    }
  });
});

/**
 * GET /api/debug/static-check
 * Returns status of static file serving
 */
router.get('/static-check', (req: Request, res: Response) => {
  logger.info('Serving /api/debug/static-check');
  
  // Check for important static files and directories
  const rootPath = process.cwd();
  const directories = [];
  const indexHtmlFound = [];
  
  // Check various client asset directories
  const assetDirs = [
    path.join(rootPath, 'client', 'public'),
    path.join(rootPath, 'public'),
    path.join(rootPath, 'client', 'assets'),
    path.join(rootPath, 'public', 'assets'),
    path.join(rootPath, 'assets')
  ];
  
  const assetDirsFound = assetDirs.filter(dir => fs.existsSync(dir));
  
  // Check for index.html files
  const indexHtmlPaths = [
    path.join(rootPath, 'client', 'index.html'),
    path.join(rootPath, 'public', 'index.html'),
    path.join(rootPath, 'index.html')
  ];
  
  const indexFilesFound = indexHtmlPaths.filter(file => fs.existsSync(file));
  
  res.json({
    success: true,
    staticFilesCheck: {
      assetDirsFound,
      indexFilesFound,
      publicDir: fs.existsSync(path.join(rootPath, 'public')),
      clientDir: fs.existsSync(path.join(rootPath, 'client')),
    },
    request: {
      hostname: req.hostname,
      baseUrl: req.baseUrl,
      originalUrl: req.originalUrl,
      port: req.socket.localPort
    }
  });
});

/**
 * GET /api/debug/port-check
 * Checks if we're on the correct port (3000)
 */
router.get('/port-check', (req: Request, res: Response) => {
  logger.info('Serving /api/debug/port-check');
  
  const serverPort = 3000; // Expected port for the main server
  const currentPort = req.socket.localPort;
  const isCorrectPort = currentPort === serverPort;
  
  res.json({
    success: true,
    portCheck: {
      expectedPort: serverPort,
      currentPort,
      isCorrectPort,
      hostname: req.hostname,
      protocol: req.protocol,
      originalUrl: req.originalUrl
    }
  });
});

// HTML test page for debugging
router.get('/test-page', (req: Request, res: Response) => {
  logger.info('Serving /api/debug/test-page');
  
  res.setHeader('Content-Type', 'text/html');
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>PuntaIQ Debug Test Page</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background: #f5f5f5;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 2rem;
          }
          h1 { color: #0066cc; }
          .info-block {
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            padding: 1rem;
            margin-bottom: 1rem;
          }
          .success { color: green; }
          .error { color: red; }
          button {
            background: #0066cc;
            color: white;
            border: none;
            padding: 0.5rem 1rem;
            border-radius: 4px;
            cursor: pointer;
            margin-right: 0.5rem;
            margin-bottom: 0.5rem;
          }
          #results {
            white-space: pre-wrap;
            font-family: monospace;
            font-size: 0.9rem;
            background: #f1f1f1;
            padding: 1rem;
            border-radius: 4px;
            margin-top: 1rem;
            max-height: 300px;
            overflow-y: auto;
          }
        </style>
      </head>
      <body>
        <h1>PuntaIQ Debug Test Page</h1>
        <div class="info-block">
          <p>Current Server: <strong>${req.hostname}:${req.socket.localPort}</strong></p>
          <p>Request URL: <strong>${req.originalUrl}</strong></p>
          <p>Request Protocol: <strong>${req.protocol}</strong></p>
        </div>
        
        <div class="info-block">
          <h2>API Tests</h2>
          <button onclick="testApi('/api/debug/server-info')">Test Server Info</button>
          <button onclick="testApi('/api/debug/static-check')">Test Static Files</button>
          <button onclick="testApi('/api/debug/port-check')">Test Port</button>
          <button onclick="testApi('/api/status')">Test API Status</button>
          
          <h3>Results:</h3>
          <div id="results">Test results will appear here...</div>
        </div>
        
        <div class="info-block">
          <h2>Navigation Tests</h2>
          <p>Click these links to test navigation to various parts of the app</p>
          <button onclick="window.location.href='/'">Home</button>
          <button onclick="window.location.href='/predictions'">Predictions</button>
          <button onclick="window.location.href='/livescore'">Live Scores</button>
          <button onclick="window.location.href='/accumulators'">Accumulators</button>
          <button onclick="window.location.href='/profile'">Profile</button>
        </div>
        
        <script>
          // Function to test API endpoints
          async function testApi(endpoint) {
            const resultsEl = document.getElementById('results');
            resultsEl.textContent = 'Loading...';
            
            try {
              const response = await fetch(endpoint);
              const data = await response.json();
              resultsEl.textContent = JSON.stringify(data, null, 2);
            } catch (error) {
              resultsEl.textContent = 'Error: ' + error.message;
            }
          }
          
          // Check the server info on page load
          window.addEventListener('DOMContentLoaded', function() {
            testApi('/api/debug/server-info');
          });
        </script>
      </body>
    </html>
  `);
});

/**
 * Export the router
 */
export default router;