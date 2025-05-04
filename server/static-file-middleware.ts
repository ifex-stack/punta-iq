/**
 * Enhanced Static File Middleware
 * Custom middleware for serving static files and handling SPA requests
 */

import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { createContextLogger } from './logger';

const logger = createContextLogger('StaticMiddleware');

/**
 * Sets up enhanced static file serving middleware
 */
export function setupStaticFileServing(app: express.Express): void {
  // Serve static files from the public directory with highest priority
  console.log('Setting up static file middleware - public directory with highest priority');
  app.use(express.static('public', { 
    index: 'index.html', 
    extensions: ['html'], 
    maxAge: '1d'
  }));
  logger.info("Setting up enhanced static file middleware");

  // Setup different static directories to try in order
  const staticDirs = [
    { path: 'public', virtual: '/' },
    { path: 'client/public', virtual: '/' },
    { path: 'client/dist', virtual: '/' },
    { path: 'assets', virtual: '/assets' }
  ];

  // Iterate over and set up each static directory if it exists
  for (const dir of staticDirs) {
    const staticPath = path.resolve(process.cwd(), dir.path);
    
    if (fs.existsSync(staticPath)) {
      logger.info(`Setting up static file serving from ${staticPath} at ${dir.virtual}`);
      app.use(dir.virtual, express.static(staticPath, {
        index: ['index.html', 'app.html'],
        extensions: ['html', 'htm'],
        fallthrough: true // Allow requests to continue if file not found
      }));
    } else {
      logger.debug(`Static directory ${staticPath} does not exist, skipping`);
    }
  }

  // Configure special favicon serving
  const faviconPaths = [
    path.resolve(process.cwd(), 'public', 'favicon.png'),
    path.resolve(process.cwd(), 'public', 'favicon.ico'),
    path.resolve(process.cwd(), 'client', 'public', 'favicon.png'),
    path.resolve(process.cwd(), 'client', 'public', 'favicon.ico')
  ];

  // Serve the favicon specifically
  app.get('/favicon.ico', (req: Request, res: Response, next: NextFunction) => {
    for (const faviconPath of faviconPaths) {
      if (fs.existsSync(faviconPath)) {
        return res.sendFile(faviconPath);
      }
    }
    next();
  });

  // Serve the root index.html file if it exists
  app.get('/', (req: Request, res: Response, next: NextFunction) => {
    const indexPaths = [
      path.resolve(process.cwd(), 'public', 'index.html'),
      path.resolve(process.cwd(), 'client', 'dist', 'index.html'),
      path.resolve(process.cwd(), 'client', 'public', 'index.html'),
      path.resolve(process.cwd(), 'index.html')
    ];

    for (const indexPath of indexPaths) {
      if (fs.existsSync(indexPath)) {
        logger.info(`Serving root index.html from ${indexPath}`);
        return res.sendFile(indexPath);
      }
    }

    logger.warn('No index.html found for root path, falling through to next middleware');
    next();
  });
}

/**
 * Sets up SPA fallback middleware for client-side routing
 */
export function setupSpaFallback(app: express.Express): void {
  logger.info("Setting up SPA fallback middleware");

  app.use('*', (req: Request, res: Response, next: NextFunction) => {
    // Skip if this is not a GET request or is an API route or has a file extension
    if (
      req.method !== 'GET' ||
      req.path.startsWith('/api/') ||
      req.path.startsWith('/ai-service/') ||
      req.path.includes('.') ||
      req.path.startsWith('/assets/')
    ) {
      return next();
    }

    logger.info(`SPA catch-all handling route: ${req.path}`);

    // Try to find index.html
    const indexPaths = [
      path.resolve(process.cwd(), 'public', 'index.html'),
      path.resolve(process.cwd(), 'client', 'dist', 'index.html'),
      path.resolve(process.cwd(), 'client', 'public', 'index.html'),
      path.resolve(process.cwd(), 'index.html')
    ];

    // Find and serve the first available index.html
    for (const indexPath of indexPaths) {
      if (fs.existsSync(indexPath)) {
        logger.info(`Serving SPA index.html from ${indexPath} for path ${req.path}`);
        return res.sendFile(indexPath);
      }
    }

    // If we get here, no index.html was found
    logger.warn(`No index.html found for SPA route: ${req.path}, continuing to next middleware`);
    next();
  });
}

/**
 * Simple Express static middleware setup
 */
export function serveStatic(app: express.Express): void {
  logger.info("Setting up basic static file serving middleware");

  // Set up standard public directory static serving
  const publicDir = path.resolve(process.cwd(), 'public');
  if (fs.existsSync(publicDir)) {
    app.use(express.static(publicDir));
    logger.info(`Serving static files from ${publicDir}`);
  } else {
    logger.warn(`Public directory ${publicDir} does not exist`);
  }

  // Fallback to client/public if it exists
  const clientPublicDir = path.resolve(process.cwd(), 'client', 'public');
  if (fs.existsSync(clientPublicDir)) {
    app.use(express.static(clientPublicDir));
    logger.info(`Serving static files from ${clientPublicDir}`);
  }

  // Fallback to client/dist if it exists (for production builds)
  const clientDistDir = path.resolve(process.cwd(), 'client', 'dist');
  if (fs.existsSync(clientDistDir)) {
    app.use(express.static(clientDistDir));
    logger.info(`Serving static files from ${clientDistDir}`);
  }
}