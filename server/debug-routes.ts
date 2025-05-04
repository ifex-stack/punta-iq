/**
 * Debug routes for PuntaIQ
 * These routes help diagnose and fix issues with the application
 */

import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { spawn } from 'child_process';
import { logger } from './logger';

const router = express.Router();

// System information
router.get('/info', (req: Request, res: Response) => {
  // Gather system information
  const nodeVersion = process.version;
  const platform = process.platform;
  const arch = process.arch;
  const cwd = process.cwd();
  const env = process.env.NODE_ENV || 'development';
  
  // Gather project information
  const directories = [];
  try {
    const rootDir = fs.readdirSync(process.cwd());
    for (const item of rootDir) {
      const stats = fs.statSync(path.join(process.cwd(), item));
      directories.push({
        name: item,
        type: stats.isDirectory() ? 'directory' : 'file',
        size: stats.size,
      });
    }
  } catch (error) {
    logger.error('Failed to read project directories', { error });
  }
  
  // Check if we're running in a container
  let isContainer = false;
  try {
    // Simple check for /.dockerenv file (common in Docker containers)
    isContainer = fs.existsSync('/.dockerenv');
  } catch (error) {
    // Ignore errors
  }
  
  // Check for index.html files
  const indexHtmlLocations = [
    path.resolve(process.cwd(), 'client', 'index.html'),
    path.resolve(process.cwd(), 'public', 'index.html'),
    path.resolve(process.cwd(), 'client', 'dist', 'index.html'),
    path.resolve(process.cwd(), 'dist', 'client', 'index.html'),
    path.resolve(process.cwd(), 'index.html'),
  ];
  
  const indexHtmlFound = [];
  for (const location of indexHtmlLocations) {
    if (fs.existsSync(location)) {
      indexHtmlFound.push(location);
    }
  }
  
  // Check AI microservice status
  let aiServiceStatus = 'unknown';
  try {
    const response = require('http').get('http://localhost:5000/api/status', (resp: any) => {
      let data = '';
      resp.on('data', (chunk: string) => {
        data += chunk;
      });
      resp.on('end', () => {
        try {
          const statusData = JSON.parse(data);
          aiServiceStatus = statusData.status || 'running';
        } catch (error) {
          aiServiceStatus = 'error parsing response';
        }
        sendResponse();
      });
    }).on('error', (err: Error) => {
      aiServiceStatus = 'not running';
      sendResponse();
    });
  } catch (error) {
    aiServiceStatus = 'error checking status';
    sendResponse();
  }
  
  function sendResponse() {
    res.json({
      system: {
        nodeVersion,
        platform,
        arch,
        cwd,
        env,
        isContainer,
      },
      project: {
        directories,
        indexHtmlFound,
      },
      aiService: {
        status: aiServiceStatus,
      },
      server: {
        port: req.socket.localPort,
        uptime: process.uptime(),
      }
    });
  }
});

// Proxy fix route
router.post('/fix-proxy', (req: Request, res: Response) => {
  // Create a temporary file with proper CORS headers
  const corsFixPath = path.resolve(process.cwd(), 'cors-fix.js');
  const corsFixCode = `
const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const port = 3001;

// Setup CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Proxy all AI service requests
app.use('/ai-service', createProxyMiddleware({
  target: 'http://localhost:5000',
  pathRewrite: {
    '^/ai-service': '',
  },
  changeOrigin: true,
  logLevel: 'debug',
}));

// Proxy all API requests
app.use('/api', createProxyMiddleware({
  target: 'http://localhost:3000',
  changeOrigin: true,
  logLevel: 'debug',
}));

// Start server
app.listen(port, '0.0.0.0', () => {
  console.log(\`CORS Proxy fix running on port \${port}\`);
});
  `;
  
  try {
    fs.writeFileSync(corsFixPath, corsFixCode);
    
    // Start the proxy server
    const proxyProcess = spawn('node', [corsFixPath], {
      detached: true,
      stdio: 'ignore',
    });
    
    // Don't wait for child process
    proxyProcess.unref();
    
    res.json({
      success: true,
      message: 'CORS proxy fix started on port 3001',
      pid: proxyProcess.pid,
    });
  } catch (error) {
    logger.error('Failed to start CORS proxy fix', { error });
    res.status(500).json({
      success: false,
      message: 'Failed to start CORS proxy fix',
      error: String(error),
    });
  }
});

// Start standalone server
router.post('/start-standalone', (req: Request, res: Response) => {
  const standaloneScriptPath = path.resolve(process.cwd(), 'start-standalone.js');
  
  if (!fs.existsSync(standaloneScriptPath)) {
    return res.status(404).json({
      success: false,
      message: 'Standalone server script not found',
    });
  }
  
  try {
    const serverProcess = spawn('node', [standaloneScriptPath], {
      detached: true,
      stdio: 'ignore',
    });
    
    // Don't wait for child process
    serverProcess.unref();
    
    res.json({
      success: true,
      message: 'Standalone server starting',
      pid: serverProcess.pid,
    });
  } catch (error) {
    logger.error('Failed to start standalone server', { error });
    res.status(500).json({
      success: false,
      message: 'Failed to start standalone server',
      error: String(error),
    });
  }
});

// Test API to check if server is responding to basic requests
router.get('/ping', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'pong',
    timestamp: new Date().toISOString(),
  });
});

export default router;