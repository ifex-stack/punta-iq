/**
 * AI Auto-Tuner Routes
 * 
 * API routes for managing the AI Auto-Tuner system
 */

import { Router } from 'express';
import { z } from 'zod';
import { aiAutoTuner } from './ai-auto-tuner';
import { logger } from './logger';

export const aiAutoTunerRouter = Router();

// Helper function to check if the user is an admin
const isAdmin = (req: any): boolean => {
  return req.isAuthenticated() && req.user?.role === 'admin';
};

// Get auto-tuner status
aiAutoTunerRouter.get('/api/ai-autotuner/status', (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  // Only admins can access this endpoint
  if (!isAdmin(req)) {
    return res.status(403).json({ error: 'Forbidden - Admin access required' });
  }
  
  try {
    const status = aiAutoTuner.getStatus();
    res.json(status);
  } catch (error) {
    logger.error('[AIAutoTunerRoutes]', 'Error getting auto-tuner status:', error);
    res.status(500).json({ error: 'Failed to get auto-tuner status' });
  }
});

// Start the auto-tuner
aiAutoTunerRouter.post('/api/ai-autotuner/start', (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  // Only admins can access this endpoint
  if (!isAdmin(req)) {
    return res.status(403).json({ error: 'Forbidden - Admin access required' });
  }
  
  try {
    aiAutoTuner.start();
    res.json({ success: true, message: 'AI Auto-Tuner started successfully' });
  } catch (error) {
    logger.error('[AIAutoTunerRoutes]', 'Error starting auto-tuner:', error);
    res.status(500).json({ error: 'Failed to start auto-tuner' });
  }
});

// Stop the auto-tuner
aiAutoTunerRouter.post('/api/ai-autotuner/stop', (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  // Only admins can access this endpoint
  if (!isAdmin(req)) {
    return res.status(403).json({ error: 'Forbidden - Admin access required' });
  }
  
  try {
    aiAutoTuner.stop();
    res.json({ success: true, message: 'AI Auto-Tuner stopped successfully' });
  } catch (error) {
    logger.error('[AIAutoTunerRoutes]', 'Error stopping auto-tuner:', error);
    res.status(500).json({ error: 'Failed to stop auto-tuner' });
  }
});

// Get all training jobs
aiAutoTunerRouter.get('/api/ai-autotuner/jobs', (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  // Only admins can access this endpoint
  if (!isAdmin(req)) {
    return res.status(403).json({ error: 'Forbidden - Admin access required' });
  }
  
  try {
    const jobs = aiAutoTuner.getJobs();
    res.json(jobs);
  } catch (error) {
    logger.error('[AIAutoTunerRoutes]', 'Error getting training jobs:', error);
    res.status(500).json({ error: 'Failed to get training jobs' });
  }
});

// Schedule a new training job
aiAutoTunerRouter.post('/api/ai-autotuner/jobs', (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  // Only admins can access this endpoint
  if (!isAdmin(req)) {
    return res.status(403).json({ error: 'Forbidden - Admin access required' });
  }
  
  try {
    const schema = z.object({
      sport: z.string(),
      modelType: z.string().optional(),
    });
    
    const parseResult = schema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: parseResult.error.message });
    }
    
    const { sport, modelType } = parseResult.data;
    
    const job = aiAutoTuner.scheduleTrainingJob(sport, modelType);
    
    res.status(201).json({ 
      success: true, 
      message: 'Training job scheduled successfully', 
      job 
    });
  } catch (error) {
    logger.error('[AIAutoTunerRoutes]', 'Error scheduling training job:', error);
    res.status(500).json({ error: 'Failed to schedule training job' });
  }
});

// Clear old training jobs
aiAutoTunerRouter.delete('/api/ai-autotuner/jobs', (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  // Only admins can access this endpoint
  if (!isAdmin(req)) {
    return res.status(403).json({ error: 'Forbidden - Admin access required' });
  }
  
  try {
    const schema = z.object({
      olderThanDays: z.number().int().positive().default(30),
    });
    
    const parseResult = schema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: parseResult.error.message });
    }
    
    const { olderThanDays } = parseResult.data;
    
    const removedCount = aiAutoTuner.clearOldJobs(olderThanDays);
    
    res.json({ 
      success: true, 
      message: `Cleared ${removedCount} old training jobs`, 
      removedCount 
    });
  } catch (error) {
    logger.error('[AIAutoTunerRoutes]', 'Error clearing old training jobs:', error);
    res.status(500).json({ error: 'Failed to clear old training jobs' });
  }
});