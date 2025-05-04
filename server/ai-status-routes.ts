/**
 * API routes for AI service status monitoring and display
 */
import { Router, Request, Response } from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { createContextLogger } from './logger';
import fs from 'fs';

// Set up logging for this module
const logger = createContextLogger('AIStatus');

// Setup async exec function
const execAsync = promisify(exec);

// Path to the scripts directory
const scriptsDir = path.join(process.cwd(), 'scripts');

export const aiStatusRouter = Router();

// Route to get AI service status
aiStatusRouter.get('/', async (req: Request, res: Response) => {
  try {
    logger.info('Checking AI service status');
    
    const response = await fetch('http://localhost:5000/api/status');
    if (!response.ok) {
      throw new Error(`Service check failed with status: ${response.status}`);
    }
    
    const statusData = await response.json();
    logger.info('AI service status check successful', { status: statusData });
    
    return res.json({
      status: statusData.status === 'ok' ? 'online' : 'degraded',
      message: statusData.message || 'The AI sports prediction service is running.',
      uptime: statusData.uptime,
      lastRestartAt: statusData.lastRestartAt,
      detailed: statusData.detailed || undefined
    });
  } catch (error) {
    logger.error('Error checking AI service status', { error });
    
    // Check if error is due to the service being down
    if (error.message && (
      error.message.includes('ECONNREFUSED') || 
      error.message.includes('Failed to fetch') ||
      error.message.includes('Service check failed')
    )) {
      return res.json({
        status: 'offline',
        message: 'The AI sports prediction service is currently offline.',
        detailed: {
          overall: 'offline',
          services: {
            'ai-predictions': { status: 'error', lastCheck: new Date().toISOString() },
            'api-service': { status: 'error', lastCheck: new Date().toISOString() }
          },
          timestamp: new Date().toISOString()
        }
      });
    }
    
    return res.status(500).json({
      status: 'error',
      message: `Error checking service status: ${error.message}`,
    });
  }
});

// Route to start/restart the AI service
aiStatusRouter.post('/start', async (req: Request, res: Response) => {
  try {
    logger.info('User requested AI service restart');
    
    // Ensure the user is authorized (optional, depends on your auth setup)
    /* 
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const user = req.user;
    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    */
    
    const scriptPath = path.join(scriptsDir, 'start-ai-service.js');
    
    // Check if script exists
    if (!fs.existsSync(scriptPath)) {
      throw new Error(`Start script not found at: ${scriptPath}`);
    }
    
    logger.info(`Starting AI service using script: ${scriptPath}`);
    
    // Execute the script asynchronously
    const { stdout, stderr } = await execAsync(`node ${scriptPath}`);
    
    if (stderr) {
      logger.warn('Warnings during start script execution', { stderr });
    }
    
    logger.info('AI service restart initiated successfully', { stdout });
    
    return res.json({
      message: 'AI service restart initiated successfully. This may take a moment to complete.',
      success: true,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error starting AI service', { error });
    return res.status(500).json({
      message: `Error starting AI service: ${error.message}`,
      success: false
    });
  }
});