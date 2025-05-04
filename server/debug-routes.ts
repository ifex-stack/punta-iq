/**
 * Debug routes for PuntaIQ application
 * These routes are used for testing and debugging purposes
 */

import express from 'express';
import { createContextLogger } from './logger';

const router = express.Router();
const logger = createContextLogger('DebugRoutes');

// Basic health check
router.get('/health', (req, res) => {
  logger.info('Health check requested');
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'puntaiq-api',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Server information
router.get('/info', (req, res) => {
  logger.info('Debug info requested');
  
  // Get basic information about the server
  const info = {
    nodeVersion: process.version,
    platform: process.platform,
    memoryUsage: process.memoryUsage(),
    uptime: process.uptime(),
    env: process.env.NODE_ENV,
    port: process.env.PORT || 5000,
    serverTime: new Date().toISOString()
  };
  
  res.json(info);
});

// Test error handling
router.get('/error-test', (req, res, next) => {
  logger.warn('Error test route accessed');
  
  try {
    const statusCode = parseInt(req.query.code as string) || 500;
    if (req.query.throw) {
      throw new Error('Test error from debug route');
    } else {
      res.status(statusCode).json({
        error: 'Test Error',
        message: 'This is a test error response',
        code: 'TEST_ERROR',
        requestedCode: statusCode
      });
    }
  } catch (err) {
    next(err);
  }
});

// Test page
router.get('/test-page', (req, res) => {
  logger.info('Test page requested');
  
  // Send a basic HTML page for testing
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>PuntaIQ Debug Page</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background: linear-gradient(135deg, #0066cc, #004080);
            color: #fff;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            padding: 20px;
          }
          .container {
            max-width: 800px;
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-radius: 12px;
            padding: 2rem;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
            text-align: center;
          }
          h1 {
            font-size: 2.5rem;
            margin: 0 0 1rem;
            background: linear-gradient(to right, #fff, #adf);
            -webkit-background-clip: text;
            background-clip: text;
            color: transparent;
          }
          .status {
            display: inline-block;
            padding: 0.5rem 1rem;
            border-radius: 50px;
            background: #00cc66;
            color: #fff;
            font-weight: bold;
            margin-bottom: 1.5rem;
          }
          .card {
            background: rgba(255, 255, 255, 0.05);
            padding: 1.5rem;
            border-radius: 8px;
            margin-bottom: 1.5rem;
            text-align: left;
          }
          h2 {
            margin-top: 0;
            font-size: 1.5rem;
            color: #adf;
          }
          button {
            background: #0066cc;
            color: white;
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 50px;
            cursor: pointer;
            font-size: 1rem;
            font-weight: bold;
            margin: 0.5rem;
            transition: all 0.2s;
          }
          button:hover {
            background: #0052a3;
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
          }
          pre {
            background: rgba(0, 0, 0, 0.2);
            padding: 1rem;
            border-radius: 4px;
            overflow: auto;
            white-space: pre-wrap;
            color: #ddd;
          }
          .buttons {
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            gap: 0.5rem;
            margin: 1.5rem 0;
          }
          .label {
            display: inline-block;
            width: 150px;
            font-weight: bold;
            color: #adf;
          }
          .value {
            color: #fff;
          }
          .api-status {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1rem;
            margin-top: 1.5rem;
          }
          .api-box {
            background: rgba(0, 0, 0, 0.2);
            padding: 1rem;
            border-radius: 8px;
            text-align: center;
          }
          .api-box.success {
            border: 1px solid #00cc66;
          }
          .api-box.error {
            border: 1px solid #cc0033;
          }
          .indicator {
            display: inline-block;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            margin-right: 8px;
          }
          .indicator.success {
            background: #00cc66;
          }
          .indicator.error {
            background: #cc0033;
          }
          .indicator.pending {
            background: #cccc00;
          }
          .routes {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
            gap: 1rem;
            margin-top: 1.5rem;
          }
          .route-link {
            display: block;
            padding: 1rem;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 8px;
            text-decoration: none;
            color: #fff;
            transition: all 0.2s;
          }
          .route-link:hover {
            background: rgba(255, 255, 255, 0.1);
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
          }
          @media (max-width: 768px) {
            h1 { font-size: 1.8rem; }
            .api-status {
              grid-template-columns: 1fr;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="status">Server Running</div>
          <h1>PuntaIQ Debug Console</h1>
          
          <div class="card">
            <h2>Server Status</h2>
            <div><span class="label">Server Time:</span> <span class="value" id="server-time">${new Date().toLocaleString()}</span></div>
            <div><span class="label">Environment:</span> <span class="value">${process.env.NODE_ENV || 'development'}</span></div>
            <div><span class="label">Node Version:</span> <span class="value">${process.version}</span></div>
            <div><span class="label">Platform:</span> <span class="value">${process.platform}</span></div>
            <div><span class="label">Uptime:</span> <span class="value" id="uptime">${Math.floor(process.uptime())} seconds</span></div>
            <div><span class="label">Memory Usage:</span> <span class="value">${Math.round(process.memoryUsage().rss / 1024 / 1024)} MB</span></div>
          </div>
          
          <div class="buttons">
            <button id="check-api">Check Express API</button>
            <button id="check-ai">Check AI Service</button>
            <button id="check-routes">Check System Routes</button>
          </div>
          
          <div class="api-status">
            <div class="api-box" id="api-status">
              <div><span class="indicator pending"></span> Express API Status</div>
              <div id="api-status-message">Waiting for check...</div>
            </div>
            <div class="api-box" id="ai-status">
              <div><span class="indicator pending"></span> AI Service Status</div>
              <div id="ai-status-message">Waiting for check...</div>
            </div>
          </div>
          
          <div id="results" style="margin-top: 1.5rem; display: none;">
            <h2>API Response</h2>
            <pre id="response-data"></pre>
          </div>
          
          <div class="routes" id="routes-container" style="display: none;">
            <h2 style="grid-column: 1 / -1;">Available Debug Routes</h2>
            <a href="/api/debug/health" class="route-link">/api/debug/health</a>
            <a href="/api/debug/info" class="route-link">/api/debug/info</a>
            <a href="/api/debug/error-test" class="route-link">/api/debug/error-test</a>
            <a href="/api/debug/test-page" class="route-link">/api/debug/test-page</a>
          </div>
        </div>
        
        <script>
          // Update server time and uptime periodically
          setInterval(() => {
            document.getElementById('server-time').textContent = new Date().toLocaleString();
            const uptimeEl = document.getElementById('uptime');
            const currentUptime = parseInt(uptimeEl.textContent.split(' ')[0]) + 1;
            uptimeEl.textContent = currentUptime + ' seconds';
          }, 1000);
          
          // Check Express API
          document.getElementById('check-api').addEventListener('click', async () => {
            const apiStatusBox = document.getElementById('api-status');
            const apiStatusMessage = document.getElementById('api-status-message');
            const indicator = apiStatusBox.querySelector('.indicator');
            
            indicator.className = 'indicator pending';
            apiStatusMessage.textContent = 'Checking...';
            
            try {
              const response = await fetch('/api/debug/health');
              const data = await response.json();
              
              indicator.className = 'indicator success';
              apiStatusMessage.textContent = 'Connected';
              apiStatusBox.className = 'api-box success';
              
              // Show the response data
              document.getElementById('results').style.display = 'block';
              document.getElementById('response-data').textContent = JSON.stringify(data, null, 2);
            } catch (error) {
              indicator.className = 'indicator error';
              apiStatusMessage.textContent = 'Connection failed';
              apiStatusBox.className = 'api-box error';
              
              document.getElementById('results').style.display = 'block';
              document.getElementById('response-data').textContent = 'Error: ' + error.message;
            }
          });
          
          // Check AI Service
          document.getElementById('check-ai').addEventListener('click', async () => {
            const aiStatusBox = document.getElementById('ai-status');
            const aiStatusMessage = document.getElementById('ai-status-message');
            const indicator = aiStatusBox.querySelector('.indicator');
            
            indicator.className = 'indicator pending';
            aiStatusMessage.textContent = 'Checking...';
            
            try {
              const response = await fetch('/ai-service/api/status');
              const data = await response.json();
              
              indicator.className = 'indicator success';
              aiStatusMessage.textContent = 'Connected';
              aiStatusBox.className = 'api-box success';
              
              // Show the response data
              document.getElementById('results').style.display = 'block';
              document.getElementById('response-data').textContent = JSON.stringify(data, null, 2);
            } catch (error) {
              indicator.className = 'indicator error';
              aiStatusMessage.textContent = 'Connection failed';
              aiStatusBox.className = 'api-box error';
              
              // Try direct connection
              try {
                const directResponse = await fetch('http://localhost:5000/api/status');
                const directData = await directResponse.json();
                
                document.getElementById('results').style.display = 'block';
                document.getElementById('response-data').textContent = 'Direct connection succeeded but proxy failed. AI service is running but not accessible through the proxy.\n\nDirect response:\n' + JSON.stringify(directData, null, 2);
              } catch (directError) {
                document.getElementById('results').style.display = 'block';
                document.getElementById('response-data').textContent = 'Error: ' + error.message + '\n\nDirect connection also failed: ' + directError.message;
              }
            }
          });
          
          // Show available routes
          document.getElementById('check-routes').addEventListener('click', () => {
            const routesContainer = document.getElementById('routes-container');
            routesContainer.style.display = 'grid';
          });
        </script>
      </body>
    </html>
  `);
});

export default router;