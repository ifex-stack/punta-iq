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
import { aiProxyMiddleware } from "./middleware/ai-proxy-middleware";
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

// Set up AI service proxy middleware ONLY for specific AI service paths
// This ensures ONLY requests to /ai-service/* are forwarded to the microservice
app.use('/ai-service', aiProxyMiddleware);

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
      errorLogger.critical(`${status} ${message}`, errorData);
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

  // AI service proxy middleware is already registered at the top of the file
  logger.info("AI service proxy middleware already set up");
  
  // First, set up our enhanced Static File middleware to ensure root path works
  try {
    logger.info("Setting up enhanced static file middleware");
    setupStaticFileServing(app);
    logger.info("Enhanced static file middleware setup successful");
  } catch (error) {
    logger.error(`Failed to setup enhanced static file middleware: ${error.message}`, { error });
    
    // Fall back to Vite or standard static middleware if enhanced version fails
    if (app.get("env") === "development") {
      logger.info("Falling back to Vite middleware for development SPA serving");
      try {
        await setupVite(app, server);
        logger.info("Vite middleware fallback successful");
      } catch (viteError) {
        logger.error(`Failed to setup Vite middleware: ${viteError.message}`, { error: viteError });
        
        // Fallback to static serving if Vite middleware setup fails
        logger.warn("Falling back to basic static file serving");
        try {
          serveStatic(app);
          logger.info("Static file serving fallback successful");
        } catch (staticError) {
          logger.error(`Failed to setup static file serving fallback: ${staticError.message}`, { error: staticError });
        }
      }
    } else {
      logger.info("Falling back to standard static file serving for production");
      serveStatic(app);
    }
  }
  
  // Then add SPA middleware to handle frontend routes
  logger.info("Setting up advanced SPA fallback middleware");
  try {
    setupSpaFallback(app);
    logger.info("Advanced SPA fallback middleware setup successful");
  } catch (error) {
    logger.error(`Failed to setup advanced SPA fallback middleware: ${error.message}`, { error });
    
    // Fall back to original SPA middleware if enhanced version fails
    logger.warn("Falling back to original SPA middleware");
    app.use(spaMiddleware);
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
          logger.error(`Error serving app.html: ${error.message}`);
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
            
            // Read the file and inject special meta tags to help with SPA routing
            const htmlContent = fs.readFileSync(indexPath, 'utf8');
            const modifiedHtml = htmlContent
              .replace(
                '</head>',
                `<meta name="route-recovery" content="true" data-original-url="${originalUrl}" />
                <meta name="puntaiq-app-route" content="${originalUrl}" />
                <meta name="puntaiq-server-time" content="${new Date().toISOString()}" />
                <script>
                  // Record the original URL to help with route recovery
                  window.__PUNTAIQ_ORIGINAL_URL = "${originalUrl}";
                  window.__PUNTAIQ_SERVER_PORT = "${req.socket.localPort}";
                  
                  // Store path for recovery if needed
                  if (window.sessionStorage) {
                    sessionStorage.setItem('puntaiq_recovery_path', "${originalUrl}");
                  }

                  // Force reload if we detect a 404 in the DOM after a delay
                  setTimeout(function() {
                    const isNotFoundPage = 
                      (document.title && document.title.includes('404')) || 
                      (document.body && document.body.textContent && document.body.textContent.includes('Not Found'));
                    
                    if (isNotFoundPage) {
                      console.log('Detected 404 page, reloading app');
                      window.location.href = "/";
                    }
                  }, 1000);
                </script>
                </head>`
              );
            
            res.setHeader('Content-Type', 'text/html');
            return res.send(modifiedHtml);
          } catch (error) {
            logger.error(`Error serving index.html from ${indexPath}: ${error.message}`);
            // Continue to try next path
          }
        }
      }
      
      // If none of the index.html files were found or could be served,
      // use our redirect.html as a fallback
      const redirectPath = path.resolve(process.cwd(), 'public', 'redirect.html');
      if (fs.existsSync(redirectPath)) {
        try {
          logger.info(`Serving redirect.html for ${originalUrl} as fallback`);
          return res.sendFile(redirectPath);
        } catch (error) {
          logger.error(`Error serving redirect.html: ${error.message}`);
        }
      }
      
      // If all else fails, generate an emergency HTML response
      return serveEmergencyHtml();
    };
    
    // Last resort emergency HTML with recovery scripts
    const serveEmergencyHtml = () => {
      logger.warn(`Using emergency SPA recovery for ${originalUrl}`);
      const redirectScript = `
        <script>
          console.log("Emergency redirect for ${originalUrl}");
          
          // Store original path for recovery
          if (window.sessionStorage) {
            sessionStorage.setItem('puntaiq_recovery_path', "${originalUrl}");
          }
          
          // Determine the correct port for redirection
          const targetPort = "3000";  // Default to the main server port
          const targetPath = "/";     // First go to the root path
          
          // Redirect to the correct URL
          const redirectUrl = \`\${window.location.protocol}//\${window.location.hostname}:\${targetPort}\${targetPath}?recovery=true&from=\${encodeURIComponent("${originalUrl}")}\`;
          console.log("Redirecting to:", redirectUrl);
          
          // Force browser to go to application homepage
          window.location.href = redirectUrl;
        </script>
      `;
      
      res.setHeader('Content-Type', 'text/html');
      res.send(`<!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>PuntaIQ - Redirecting...</title>
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
            <h1>Redirecting to PuntaIQ</h1>
            <p>Please wait while we redirect you to the application...</p>
            <p><small>Original path: ${originalUrl}</small></p>
          </div>
          ${redirectScript}
        </body>
      </html>`);
    };
    
    // Execute the main index.html serving function
    return serveClientIndexHtml();
  });

  // Use port 3000 for the main server to avoid conflict with the AI microservice on port 5000
  // The AI microservice will be on port 5000
  const port = 3000;
  const appLogger = createContextLogger('APP');
  
  appLogger.info('Application starting up', {
    environment: app.get('env'),
    nodeVersion: process.version,
    timestamp: new Date().toISOString()
  });
  
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, async () => {
    appLogger.info(`PuntaIQ server running on port ${port}`, {
      port,
      host: '0.0.0.0',
      appVersion: process.env.npm_package_version || '1.0.0',
    });
    
    // Keep old log format for compatibility
    log(`serving on port ${port}`);
    
    // Initialize database tables with fallback mechanism
    try {
      appLogger.info('Initializing database tables');
      await initializeDatabase();
      appLogger.info('Database tables initialized successfully');
    } catch (error) {
      appLogger.error('Failed to initialize database tables', { error });
      appLogger.warn('Using in-memory storage as fallback');
    }
    
    // Initialize fantasy football data with fallback mechanism
    try {
      appLogger.info('Initializing fantasy football data');
      await initializeFantasyData();
      appLogger.info('Fantasy football data initialized successfully');
    } catch (error) {
      appLogger.error('Failed to initialize fantasy data', { error });
      appLogger.warn('Using default fantasy data as fallback');
    }
    
    // Initialize and start the automation system
    try {
      appLogger.info('Initializing PuntaIQ automation system');
      await automationManager.initialize();
      
      if (process.env.NODE_ENV === 'production') {
        await automationManager.startAll();
        appLogger.info('PuntaIQ automation system started successfully');
      } else {
        appLogger.info('PuntaIQ automation system initialized but not started in development mode');
      }
    } catch (error) {
      appLogger.error('Failed to initialize PuntaIQ automation system', { error });
    }
    
    // Start the AI microservice proactively
    try {
      appLogger.info('Starting the AI microservice');
      
      // Get the path to the start script
      const scriptPath = path.join(process.cwd(), 'scripts', 'start-ai-service.js');
      
      // Spawn the Node.js process to run the script with output capturing
      const childProcess = spawn('node', [scriptPath], {
        detached: true, 
        stdio: ['ignore', 'pipe', 'pipe'],
        env: {
          ...process.env,
          AI_SERVICE_PROACTIVE_START: 'true'
        }
      });
      
      // Capture output for better debugging
      childProcess.stdout.on('data', (data) => {
        appLogger.info(`[AI Service Starter] ${data.toString().trim()}`);
      });
      
      childProcess.stderr.on('data', (data) => {
        appLogger.error(`[AI Service Starter Error] ${data.toString().trim()}`);
      });
      
      // Detach the child process so it runs independently
      childProcess.unref();
      
      appLogger.info(`AI microservice startup initiated, process ID: ${childProcess.pid}`);
    } catch (error) {
      appLogger.error('Failed to start AI microservice', { error });
      appLogger.warn('Failed to start the AI microservice - will start on demand');
    }
    
    // Start the microservice health check system
    try {
      appLogger.info('Starting AI microservice health check system');
      microserviceHealthMonitor.start();
      appLogger.info('AI microservice health check system started successfully');
    } catch (error) {
      appLogger.error('Failed to start AI microservice health check system', { error });
    }
  });
})();
