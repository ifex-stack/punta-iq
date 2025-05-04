import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { logger, createContextLogger } from "./logger";
import { setupCatchAllRoutes } from "./catch-all-routes";
import { initializeFantasyData } from "./fantasy-data-init";
import { initializeDatabase } from "./db-init";
import { automationManager } from "./automation";
import { microserviceHealthMonitor } from "./microservice-health-check";
import { analytics, AnalyticsEventType } from "./analytics-service";
import aiProxyMiddleware from "./middleware/ai-proxy-middleware";
import spaMiddleware from "./spa-middleware";
import { setupStaticFileServing, setupSpaFallback } from "./static-file-middleware";
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import axios from 'axios';
import cors from 'cors';

const app = express();

// Standard Express middleware setup
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Add CORS middleware for development environment - helps with the port mismatch in development
app.use(cors({
  origin: process.env.NODE_ENV === 'development' ? '*' : false,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Setup debug routes first
import debugRoutes from './debug-routes';
app.use('/api/debug', debugRoutes);

// Important app routes handler
const handleAppRoute = (req: Request, res: Response, title: string) => {
  // Try to serve index.html from public directory first
  const indexPath = path.resolve(process.cwd(), 'public', 'index.html');
  if (fs.existsSync(indexPath)) {
    console.log(`Serving index.html directly from public directory for ${req.path}`);
    return res.sendFile(indexPath);
  }
  // If no index.html, send a basic HTML response
  console.log(`No index.html found, serving inline HTML for ${req.path}`);
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title} - PuntaIQ</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background: #f5f5f5;
            color: #333;
            margin: 0;
            padding: 20px;
            display: flex;
            flex-direction: column;
            align-items: center;
            min-height: 100vh;
          }
          .container {
            max-width: 800px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            padding: 2rem;
            margin-top: 2rem;
          }
          h1 { 
            color: #0066cc;
            background: linear-gradient(to right, #0066cc, #8a3ffc);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-top: 0;
          }
          p { line-height: 1.6; }
          .bottom-nav {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: white;
            display: flex;
            justify-content: space-around;
            padding: 0.75rem 0;
            box-shadow: 0 -1px 5px rgba(0,0,0,0.1);
          }
          .bottom-nav a {
            display: flex;
            flex-direction: column;
            align-items: center;
            text-decoration: none;
            color: #333;
            font-size: 0.75rem;
          }
          .nav-icon {
            width: 24px;
            height: 24px;
            margin-bottom: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .status {
            padding: 1rem;
            border-radius: 4px;
            background: #f0f0f0;
            margin: 1rem 0;
          }
          .indicator {
            display: inline-block;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: #24a148;
            margin-right: 8px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>PuntaIQ - ${title}</h1>
          <p>Welcome to PuntaIQ, the next-generation AI-powered sports prediction platform.</p>
          
          <div class="status">
            <div><span class="indicator"></span> Server Status: Online</div>
            <div>Node.js Version: ${process.version}</div>
            <div>Server Time: ${new Date().toISOString()}</div>
          </div>
          
          <h2>${title} Page</h2>
          <p>This is a placeholder for the ${title} page. The full web application will be available soon.</p>
          
          <h2>System Status</h2>
          <p>All systems operational. The server is running in ${app.get('env')} mode.</p>
        </div>
        
        <div class="bottom-nav">
          <a href="/">
            <div class="nav-icon">🏠</div>
            Home
          </a>
          <a href="/predictions">
            <div class="nav-icon">🎯</div>
            Predictions
          </a>
          <a href="/livescore">
            <div class="nav-icon">⚽</div>
            Live Score
          </a>
          <a href="/account">
            <div class="nav-icon">👤</div>
            Account
          </a>
          <a href="/ai-status">
            <div class="nav-icon">🤖</div>
            AI Status
          </a>
        </div>
      </body>
    </html>
  `);
};

// Special direct root route for the landing page
app.get('/', (req, res) => {
  handleAppRoute(req, res, 'Home');
});

// Add routes for other key app pages
app.get('/predictions', (req, res) => {
  handleAppRoute(req, res, 'Predictions');
});

app.get('/livescore', (req, res) => {
  handleAppRoute(req, res, 'Live Scores');
});

app.get('/account', (req, res) => {
  handleAppRoute(req, res, 'Account');
});

app.get('/ai-status', (req, res) => {
  handleAppRoute(req, res, 'AI Service Status');
});

// Status routes for API health
app.get('/status', (req, res) => {
  res.json({
    status: 'ok',
    server: 'express',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Set up AI service proxy middleware for requests to /ai-service/*
// This ensures requests to the AI microservice are properly forwarded
app.use(aiProxyMiddleware);

// Create a logger specific to HTTP requests
const httpLogger = createContextLogger('HTTP');

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  const method = req.method;
  const userId = req.user?.id;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  // Log basic request info at the start
  if (path.startsWith("/api")) {
    httpLogger.debug(`${method} ${path} started`, { 
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      userId
    });
  }

  // Capture the response body for logging
  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  // Log request completion
  res.on("finish", () => {
    const duration = Date.now() - start;
    
    if (path.startsWith("/api")) {
      const statusCode = res.statusCode;
      const logData = {
        method,
        path,
        statusCode,
        duration: `${duration}ms`,
        userId
      };
      
      // Don't log sensitive response data
      if (capturedJsonResponse && !path.includes('password') && !path.includes('/auth')) {
        const responseForLog = { ...capturedJsonResponse };
        // Sanitize any potentially sensitive fields
        if (responseForLog.token) responseForLog.token = '[REDACTED]';
        if (responseForLog.apiKey) responseForLog.apiKey = '[REDACTED]';
        
        logData['response'] = responseForLog;
      }
      
      // Track API performance for analytics
      if (!path.startsWith('/api/analytics')) { // Avoid recursive tracking
        analytics.trackApiPerformance(path, duration, statusCode, userId);
      }
      
      // Track errors via analytics system
      if (statusCode >= 400 && !path.startsWith('/api/analytics')) {
        analytics.trackError(
          `HTTP_${statusCode}`, 
          capturedJsonResponse?.message || `HTTP error ${statusCode}`,
          path,
          userId
        );
      }
      
      // Log with appropriate level based on status code
      if (statusCode >= 500) {
        httpLogger.error(`${method} ${path} ${statusCode} in ${duration}ms`, logData);
      } else if (statusCode >= 400) {
        httpLogger.warn(`${method} ${path} ${statusCode} in ${duration}ms`, logData);
      } else {
        // Keep old log format for compatibility
        let legacyLogLine = `${method} ${path} ${statusCode} in ${duration}ms`;
        if (capturedJsonResponse) {
          try {
            const jsonStr = JSON.stringify(capturedJsonResponse);
            if (jsonStr.length > 50) {
              legacyLogLine += ` :: ${jsonStr.slice(0, 49)}…`;
            } else {
              legacyLogLine += ` :: ${jsonStr}`;
            }
          } catch (e) {
            // Ignore serialization errors for legacy logging
          }
        }
        log(legacyLogLine);
        
        // Also log to new system
        httpLogger.info(`${method} ${path} ${statusCode} in ${duration}ms`, logData);
      }
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  // Create a logger for errors
  const errorLogger = createContextLogger('ERROR');
  
  // Global error handling middleware
  app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    const path = req.path;
    const method = req.method;
    const userId = req.user?.id;
    
    // Log the error with appropriate severity
    const errorData = {
      status,
      method,
      path,
      userId,
      stack: err.stack,
      body: req.body && !path.includes('password') ? req.body : '[REDACTED]'
    };
    
    if (status >= 500) {
      errorLogger.error(`${status} ${message}`, errorData);
    } else if (status >= 400) {
      errorLogger.error(`${status} ${message}`, errorData);
    } else {
      errorLogger.warn(`${status} ${message}`, errorData);
    }
    
    // Send structured error response
    const errorResponse = { 
      message,
      code: err.code || 'INTERNAL_ERROR',
      status
    };
    
    // Add validation errors if present (for form validation)
    if (err.errors) {
      errorResponse['errors'] = err.errors;
    }
    
    // Send the response
    res.status(status).json(errorResponse);
  });

  // First set up our API routes 
  logger.info("API routes already registered");
  
  if (app.get("env") === "development") {
    // In development, use Vite middleware for hot module reloading
    logger.info("Setting up Vite middleware for development");
    try {
      await setupVite(app, server);
      logger.info("Vite middleware setup successful");
    } catch (viteError) {
      logger.error(`Failed to setup Vite middleware: ${viteError instanceof Error ? viteError.message : String(viteError)}`, { error: viteError });
      
      // Fallback to static middleware if Vite fails
      logger.warn("Falling back to static middleware due to Vite setup failure");
      setupStaticFileServing(app);
    }
  } else {
    // In production, use the static file middleware
    logger.info("Setting up static file middleware for production");
    setupStaticFileServing(app);
  }
  
  // Add SPA middleware to handle frontend routes - the key part for fixing routing issues
  logger.info("Setting up SPA middleware to handle client-side routes");
  app.use(spaMiddleware);
  
  // Backup: set up the advanced SPA fallback middleware as a final safety net
  try {
    logger.info("Setting up advanced SPA fallback middleware as backup");
    setupSpaFallback(app);
    logger.info("Advanced SPA fallback middleware backup setup successful");
  } catch (error) {
    logger.error(`Failed to setup advanced SPA fallback: ${error instanceof Error ? error.message : String(error)}`, { error });
  }
  
  // Finally add catch-all routes for API 404s
  logger.info("Setting up API catch-all middleware");
  app.use('/api/*', (req: Request, res: Response) => {
    logger.warn(`API 404: ${req.originalUrl}`);
    res.status(404).json({
      message: 'API endpoint not found. Please check the URL and try again.',
      status: 404,
      path: req.originalUrl
    });
  });
  
  // Add fall-through catch-all route to handle SPA routes
  app.use('*', (req: Request, res: Response) => {
    const originalUrl = req.originalUrl;
    
    // Skip API, AI service, and asset requests to avoid infinite loops
    if (originalUrl.startsWith('/api/') || 
        originalUrl.startsWith('/ai-service/') ||
        originalUrl.includes('.') || 
        originalUrl.startsWith('/assets/')) {
      logger.warn(`Resource not found: ${originalUrl}`);
      return res.status(404).send('Not Found');
    }
    
    logger.info(`SPA fallback route handling: ${originalUrl}`);
    
    // For direct SPA routes like /predictions, /stats, etc. we'll serve the app.html file
    const serveClientIndexHtml = () => {
      // Try to serve app.html first
      const appHtmlPath = path.resolve(process.cwd(), 'public', 'app.html');
      if (fs.existsSync(appHtmlPath)) {
        try {
          logger.info(`Serving app.html for ${originalUrl}`);
          return res.sendFile(appHtmlPath);
        } catch (error) {
          logger.error(`Error serving app.html: ${error instanceof Error ? error.message : String(error)}`);
          // Fall through to try other paths
        }
      }
      
      // Try multiple possible locations for index.html as fallback
      const possiblePaths = [
        path.resolve(process.cwd(), 'client', 'index.html'),
        path.resolve(process.cwd(), 'public', 'index.html'),
        path.resolve(process.cwd(), 'client', 'dist', 'index.html'),
        path.resolve(process.cwd(), 'dist', 'client', 'index.html')
      ];
      
      // Find first existing index.html
      for (const indexPath of possiblePaths) {
        if (fs.existsSync(indexPath)) {
          try {
            logger.info(`Serving SPA index.html from ${indexPath} for ${originalUrl}`);
            return res.sendFile(indexPath);
          } catch (error) {
            logger.error(`Error serving index.html from ${indexPath}: ${error instanceof Error ? error.message : String(error)}`);
            // Continue to try next path
          }
        }
      }
      
      // If none of the index.html files were found or could be served,
      // serve the main route handler with appropriate title
      const routeTitle = originalUrl.substring(1).split('/')[0] || 'Home';
      handleAppRoute(req, res, routeTitle.charAt(0).toUpperCase() + routeTitle.slice(1));
    };
    
    // Serve the client-side HTML
    serveClientIndexHtml();
  });

  // Setup health monitoring for the AI microservice
  if (typeof microserviceHealthMonitor.startMonitoring === 'function') {
    microserviceHealthMonitor.startMonitoring();
  } else {
    logger.info("Microservice health monitoring initialized via import");
  }
  
  // Start any background automation tasks
  if (typeof automationManager.initScheduledTasks === 'function') {
    automationManager.initScheduledTasks();
  } else {
    logger.info("Automation manager initialized via import");
  }
  
  // Initialize database if needed
  try {
    initializeDatabase();
  } catch (error) {
    logger.error(`Failed to initialize database: ${error instanceof Error ? error.message : String(error)}`, { error });
  }
  
  // Initialize fantasy sports data
  try {
    initializeFantasyData();
  } catch (error) {
    logger.error(`Failed to initialize fantasy data: ${error instanceof Error ? error.message : String(error)}`, { error });
  }
  
  // Start the server - Using port 5000 for Replit compatibility
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, '0.0.0.0', () => {
    logger.info(`Server running on http://0.0.0.0:${PORT} in ${app.get('env')} mode`);
    logger.info(`API endpoints available at http://0.0.0.0:${PORT}/api/`);
    logger.info(`AI Microservice proxy available at http://0.0.0.0:${PORT}/ai-service/`);
  });
  
  // Export the server for testing
  module.exports = server;
})();