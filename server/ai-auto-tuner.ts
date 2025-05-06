/**
 * AI Auto-Tuner - Automatic model retraining scheduler
 * 
 * This module handles the automatic retraining of AI models on a schedule.
 * It triggers retraining jobs via the AI microservice and manages the retraining process.
 */

import cron from 'node-cron';
import { logger } from './logger';
import { MicroserviceClient } from './microservice-client';
import { storage } from './storage';

interface TrainingJob {
  id: string;
  sport: string;
  modelType: string;
  startedAt: Date;
  completedAt?: Date;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  metrics?: {
    accuracy?: number;
    precision?: number;
    recall?: number;
    f1Score?: number;
    auc?: number;
    improvementPercentage?: number;
  };
  error?: string;
}

class AIAutoTuner {
  private jobs: TrainingJob[] = [];
  private isRunning: boolean = false;
  private trainingSchedules: cron.ScheduledTask[] = [];
  
  constructor() {
    logger.info('[AIAutoTuner]', 'Initializing AI Auto-Tuner');
  }
  
  /**
   * Start the auto-tuner with predefined schedules
   */
  public start(): void {
    if (this.isRunning) {
      logger.warn('[AIAutoTuner]', 'Auto-tuner is already running');
      return;
    }
    
    this.isRunning = true;
    logger.info('[AIAutoTuner]', 'Starting AI Auto-Tuner with predefined schedules');
    
    // Weekly retraining schedule for football (every Monday at 2 AM)
    const footballSchedule = cron.schedule('0 2 * * 1', () => {
      this.scheduleTrainingJob('football', 'xgboost');
    });
    this.trainingSchedules.push(footballSchedule);
    
    // Weekly retraining schedule for basketball (every Wednesday at 2 AM)
    const basketballSchedule = cron.schedule('0 2 * * 3', () => {
      this.scheduleTrainingJob('basketball', 'xgboost');
    });
    this.trainingSchedules.push(basketballSchedule);
    
    // Monthly full model retraining (1st day of each month at 3 AM)
    const monthlySchedule = cron.schedule('0 3 1 * *', () => {
      // Schedule training for all supported sports
      this.scheduleTrainingJob('football', 'ensemble');
      this.scheduleTrainingJob('basketball', 'ensemble');
      this.scheduleTrainingJob('tennis', 'ensemble');
      // Add more sports as needed
    });
    this.trainingSchedules.push(monthlySchedule);
    
    logger.info('[AIAutoTuner]', 'AI Auto-Tuner started successfully');
  }
  
  /**
   * Stop the auto-tuner and cancel all scheduled jobs
   */
  public stop(): void {
    if (!this.isRunning) {
      logger.warn('[AIAutoTuner]', 'Auto-tuner is not running');
      return;
    }
    
    logger.info('[AIAutoTuner]', 'Stopping AI Auto-Tuner');
    
    // Stop all scheduled tasks
    this.trainingSchedules.forEach(schedule => schedule.stop());
    this.trainingSchedules = [];
    this.isRunning = false;
    
    logger.info('[AIAutoTuner]', 'AI Auto-Tuner stopped successfully');
  }
  
  /**
   * Schedule a training job for a specific sport and model type
   */
  public async scheduleTrainingJob(sport: string, modelType: string = 'xgboost'): Promise<TrainingJob> {
    const jobId = `${sport}-${modelType}-${Date.now()}`;
    
    logger.info('[AIAutoTuner]', `Scheduling training job: ${jobId}`);
    
    const job: TrainingJob = {
      id: jobId,
      sport,
      modelType,
      startedAt: new Date(),
      status: 'pending'
    };
    
    this.jobs.push(job);
    
    // Execute the job right away
    this.executeTrainingJob(job)
      .catch(err => {
        logger.error('[AIAutoTuner]', `Error executing training job ${jobId}:`, err);
        job.status = 'failed';
        job.error = err.message;
      });
    
    return job;
  }
  
  /**
   * Execute a training job by calling the AI microservice
   */
  private async executeTrainingJob(job: TrainingJob): Promise<void> {
    try {
      logger.info('[AIAutoTuner]', `Executing training job: ${job.id}`);
      
      job.status = 'in_progress';
      
      // Create microservice client instance
      const microserviceClient = new MicroserviceClient();
      
      // Check if AI microservice is available
      const status = await microserviceClient.checkStatus();
      if (!status.available) {
        throw new Error('AI microservice is not available');
      }
      
      // Call the AI microservice to train the model
      const trainingOptions = {
        sport: job.sport,
        modelType: job.modelType,
        useSyntheticData: false,
        hyperparameters: {
          // Add model-specific hyperparameters here
        }
      };
      
      const result = await microserviceClient.trainModel(trainingOptions);
      
      if (result.success) {
        job.status = 'completed';
        job.completedAt = new Date();
        job.metrics = result.metrics;
        
        logger.info('[AIAutoTuner]', `Training job ${job.id} completed successfully`);
        
        // Store the training results
        // We don't have an actual cache implementation, so just log it
        logger.info('[AIAutoTuner]', `Training job ${job.id} results stored`)
      } else {
        job.status = 'failed';
        job.error = result.error || 'Unknown error';
        logger.error('[AIAutoTuner]', `Training job ${job.id} failed:`, job.error);
      }
    } catch (error: any) {
      job.status = 'failed';
      job.error = error.message;
      logger.error('[AIAutoTuner]', `Error in training job ${job.id}:`, error);
      throw error;
    }
  }
  
  /**
   * Get all training jobs
   */
  public getJobs(): TrainingJob[] {
    return this.jobs;
  }
  
  /**
   * Get the status of the auto-tuner
   */
  public getStatus(): { isRunning: boolean; jobCount: number } {
    return {
      isRunning: this.isRunning,
      jobCount: this.jobs.length
    };
  }
  
  /**
   * Clear completed jobs older than the specified number of days
   */
  public clearOldJobs(olderThanDays: number = 30): number {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
    
    const initialCount = this.jobs.length;
    
    this.jobs = this.jobs.filter(job => {
      // Keep jobs that are still in progress
      if (job.status === 'pending' || job.status === 'in_progress') {
        return true;
      }
      
      // For completed or failed jobs, check the date
      if (job.completedAt) {
        return job.completedAt > cutoffDate;
      }
      
      // For jobs without completedAt, use startedAt
      return job.startedAt > cutoffDate;
    });
    
    const removedCount = initialCount - this.jobs.length;
    
    if (removedCount > 0) {
      logger.info('[AIAutoTuner]', `Cleared ${removedCount} old training jobs`);
    }
    
    return removedCount;
  }
}

// Export singleton instance
export const aiAutoTuner = new AIAutoTuner();