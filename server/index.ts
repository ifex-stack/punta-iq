import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { logger, createContextLogger } from "./logger";
import { initializeFantasyData } from "./fantasy-data-init";
import { initializeDatabase } from "./db-init";
import { automationManager } from "./automation";
import { startMicroserviceHealthCheck } from "./microservice-health-check";
import { startNotificationScheduler } from "./notification-scheduler";
import { analytics, AnalyticsEventType } from "./analytics-service";
import { spawn } from 'child_process';
import path from 'path';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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
      errorLogger.error(`CRITICAL: ${status} ${message}`, errorData);
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

  // Add middleware to serve static files from the root directory (before Vite middleware)
  app.use(express.static(process.cwd()));
  
  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Try to use port 5000 first, but fall back to 3001 if 5000 is in use
  // this serves both the API and the client.
  const port = process.env.PORT ? parseInt(process.env.PORT) : 3001;
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
      startMicroserviceHealthCheck();
      appLogger.info('AI microservice health check system started successfully');
    } catch (error) {
      appLogger.error('Failed to start AI microservice health check system', { error });
    }
    
    // Start the notification scheduler for timezone-based content delivery
    try {
      appLogger.info('Starting timezone-based notification scheduler');
      startNotificationScheduler();
      appLogger.info('Timezone-based notification scheduler started successfully');
    } catch (error) {
      appLogger.error('Failed to start timezone-based notification scheduler', { error });
    }
  });
})();
