/**
 * Simple test server script to verify the server is working correctly
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import http from 'http';

// Create server
const app = express();
const port = 3000;

// Serve static files
app.use(express.static('public'));

// Create simple API to verify the server is responding
app.get('/api/test', (req, res) => {
  res.json({
    status: 'ok',
    server: 'test-server',
    timestamp: new Date().toISOString(),
    port: port
  });
});

// Basic landing page
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>PuntaIQ Test Server</title>
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
          p { line-height: 1.5; margin: 1em 0; }
          button {
            background: #0066cc;
            color: white;
            border: none;
            padding: 0.5rem 1rem;
            border-radius: 4px;
            cursor: pointer;
            font-size: 1rem;
            margin: 0.5rem;
          }
          #result {
            margin-top: 1.5rem;
            padding: 1rem;
            background: #f1f1f1;
            border-radius: 4px;
            font-family: monospace;
            text-align: left;
            white-space: pre-wrap;
            display: none;
          }
          .nav {
            margin-top: 2rem;
            display: flex;
            gap: 1rem;
            justify-content: center;
            flex-wrap: wrap;
          }
          .nav a {
            color: #0066cc;
            text-decoration: none;
            padding: 0.5rem 1rem;
            border: 1px solid #0066cc;
            border-radius: 4px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>PuntaIQ Test Server</h1>
          <p>The test server is running correctly on port ${port}.</p>
          
          <div>
            <button id="testApi">Test API Connection</button>
            <button id="testAiService">Test AI Microservice</button>
          </div>
          
          <div id="result"></div>
          
          <div class="nav">
            <a href="/about">About</a>
            <a href="/predictions">Predictions</a>
            <a href="/livescore">Live Scores</a>
          </div>
        </div>
        
        <script>
          // Test API connection
          document.getElementById('testApi').addEventListener('click', async () => {
            const result = document.getElementById('result');
            result.style.display = 'block';
            result.textContent = 'Testing API connection...';
            
            try {
              const response = await fetch('/api/test');
              const data = await response.json();
              
              result.textContent = 'API connection successful:\\n' + JSON.stringify(data, null, 2);
            } catch (error) {
              result.textContent = 'API connection failed: ' + error.message;
            }
          });
          
          // Test AI Microservice connection
          document.getElementById('testAiService').addEventListener('click', async () => {
            const result = document.getElementById('result');
            result.style.display = 'block';
            result.textContent = 'Testing AI microservice connection...';
            
            try {
              // First test our own API proxy
              const response = await fetch('/ai-service/api/status');
              const data = await response.json();
              
              result.textContent = 'AI microservice connection successful:\\n' + JSON.stringify(data, null, 2);
            } catch (error) {
              result.textContent = 'AI microservice connection failed: ' + error.message;
              
              // Try direct connection as fallback
              try {
                result.textContent += '\\n\\nAttempting direct connection to AI service...';
                const directResponse = await fetch('http://localhost:5000/api/status');
                const directData = await directResponse.json();
                
                result.textContent += '\\nDirect AI connection successful:\\n' + JSON.stringify(directData, null, 2);
              } catch (directError) {
                result.textContent += '\\nDirect AI connection also failed: ' + directError.message;
              }
            }
          });
        </script>
      </body>
    </html>
  `);
});

// SPA fallback - serve the same page for all routes
app.get('*', (req, res) => {
  // Skip API routes
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({
      error: 'Not Found',
      message: `API endpoint ${req.path} does not exist`
    });
  }
  
  // Redirect to home page
  res.redirect('/');
});

// Forward requests to AI service
app.use('/ai-service', (req, res) => {
  const targetPath = req.url;
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: targetPath,
    method: req.method,
    headers: {
      ...req.headers,
      host: 'localhost:5000'
    }
  };
  
  console.log(`Proxying request to AI service: ${req.method} ${targetPath}`);
  
  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res, { end: true });
  });
  
  proxyReq.on('error', (error) => {
    console.error(`Error proxying to AI service: ${error.message}`);
    
    if (!res.headersSent) {
      res.status(502).json({
        error: 'AI Service Unavailable',
        message: 'Could not connect to the AI microservice',
        details: error.message
      });
    }
  });
  
  req.pipe(proxyReq, { end: true });
});

// Start server
app.listen(port, () => {
  console.log(`Test server listening at http://localhost:${port}`);
});