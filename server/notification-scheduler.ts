/**
 * Notification Scheduler - Manages daily prediction digest notifications
 * 
 * This module handles the scheduling and sending of notifications based on user preferences,
 * including daily prediction digests and other time-sensitive alerts.
 */

import cron from 'node-cron';
import { logger } from './logger';
import { storage } from './storage';
import { PushNotificationService } from './push-notification-service';
import { MicroserviceClient } from './microservice-client';
import { User } from '@shared/schema';

interface NotificationJob {
  id: string;
  userId: number;
  type: 'daily_digest' | 'match_alert' | 'prediction_result' | 'value_alert';
  scheduledFor: Date;
  timezone: string;
  status: 'pending' | 'delivered' | 'failed';
  data: any;
  sentAt?: Date;
  error?: string;
}

class NotificationScheduler {
  private jobs: NotificationJob[] = [];
  private isRunning: boolean = false;
  private schedules: cron.ScheduledTask[] = [];
  private pushService: PushNotificationService;
  
  constructor() {
    this.pushService = new PushNotificationService();
    logger.info('Notification scheduler initialized');
  }
  
  /**
   * Start the notification scheduler with predefined schedules
   */
  public start(): void {
    if (this.isRunning) {
      logger.warn('Notification scheduler is already running');
      return;
    }
    
    this.isRunning = true;
    logger.info('Starting notification scheduler');
    
    // Run every minute to process notifications that need to be sent
    const processorSchedule = cron.schedule('* * * * *', () => {
      this.processScheduledNotifications();
    });
    this.schedules.push(processorSchedule);
    
    // Schedule daily digest notifications (7 AM in each user's timezone)
    const dailyDigestSchedule = cron.schedule('0 7 * * *', () => {
      this.scheduleDailyDigests();
    });
    this.schedules.push(dailyDigestSchedule);
    
    // Schedule pre-match alerts (30 minutes before match start)
    const matchAlertSchedule = cron.schedule('*/10 * * * *', () => {
      this.scheduleMatchAlerts();
    });
    this.schedules.push(matchAlertSchedule);
    
    logger.info('Notification scheduler started successfully');
  }
  
  /**
   * Stop the notification scheduler
   */
  public stop(): void {
    if (!this.isRunning) {
      logger.warn('Notification scheduler is not running');
      return;
    }
    
    logger.info('Stopping notification scheduler');
    
    // Stop all scheduled tasks
    this.schedules.forEach(schedule => schedule.stop());
    this.schedules = [];
    this.isRunning = false;
    
    logger.info('Notification scheduler stopped successfully');
  }
  
  /**
   * Process notifications that are due to be sent
   */
  private async processScheduledNotifications(): Promise<void> {
    logger.debug('Running scheduled notification processor');
    
    const now = new Date();
    const pendingNotifications = this.jobs.filter(job => 
      job.status === 'pending' && job.scheduledFor <= now
    );
    
    logger.info(`Found ${pendingNotifications.length} notifications due for delivery`);
    
    let successCount = 0;
    
    for (const notification of pendingNotifications) {
      try {
        await this.sendNotification(notification);
        notification.status = 'delivered';
        notification.sentAt = new Date();
        successCount++;
      } catch (error: any) {
        notification.status = 'failed';
        notification.error = error.message;
        logger.error(`Failed to send notification ${notification.id}: ${error.message}`);
      }
    }
    
    logger.info(`Successfully delivered ${successCount} notifications`);
  }
  
  /**
   * Schedule daily digest notifications for all active users
   */
  private async scheduleDailyDigests(): Promise<void> {
    try {
      logger.info('Scheduling daily digest notifications');
      
      // Get all active users with notification preferences enabled
      // const activeUsers = await storage.getAllActiveUsers();
      // For now, we'll use a simple mock implementation
      const activeUsers = [
        { id: 1, username: 'user1', timezone: 'Europe/London', notificationPreferences: { dailyDigest: true } },
        { id: 2, username: 'user2', timezone: 'America/New_York', notificationPreferences: { dailyDigest: true } },
        { id: 3, username: 'user3', timezone: 'Asia/Tokyo', notificationPreferences: { dailyDigest: false } }
      ] as any[];
      
      const usersForDigest = activeUsers.filter(user => 
        user.notificationPreferences?.dailyDigest === true
      );
      
      logger.info(`Found ${usersForDigest.length} users for daily digest notifications`);
      
      for (const user of usersForDigest) {
        // Get user's local time to schedule for 7 AM in their timezone
        const userLocalTime = this.getUserLocalTime(user.timezone);
        const sevenAM = new Date(userLocalTime);
        sevenAM.setHours(7, 0, 0, 0);
        
        // If 7 AM today has already passed, schedule for tomorrow
        if (userLocalTime > sevenAM) {
          sevenAM.setDate(sevenAM.getDate() + 1);
        }
        
        // Schedule notification
        this.scheduleNotification({
          id: `daily-digest-${user.id}-${Date.now()}`,
          userId: user.id,
          type: 'daily_digest',
          scheduledFor: sevenAM,
          timezone: user.timezone,
          status: 'pending',
          data: {
            title: 'Your PuntaIQ Daily Prediction Digest',
            message: 'Today\'s top predictions are ready for you!'
          }
        });
      }
      
      logger.info('Daily digest notifications scheduled successfully');
    } catch (error: any) {
      logger.error(`Error scheduling daily digests: ${error.message}`);
    }
  }
  
  /**
   * Schedule match alert notifications for upcoming matches
   */
  private async scheduleMatchAlerts(): Promise<void> {
    try {
      logger.info('Scheduling match alert notifications');
      
      // Get users with match alert preferences enabled
      // const usersWithAlerts = await storage.getUsersWithMatchAlerts();
      // For now, we'll use a simple mock implementation
      const usersWithAlerts = [
        { id: 1, username: 'user1', timezone: 'Europe/London', notificationPreferences: { matchAlerts: true } },
        { id: 2, username: 'user2', timezone: 'America/New_York', notificationPreferences: { matchAlerts: true } }
      ] as any[];
      
      // Get upcoming matches in the next hour
      // const upcomingMatches = await storage.getUpcomingMatches(60);
      // For now, we'll use a simple mock implementation
      const upcomingMatches = [
        { id: 'm1', homeTeam: 'Arsenal', awayTeam: 'Chelsea', startTime: new Date(Date.now() + 30 * 60 * 1000) },
        { id: 'm2', homeTeam: 'Barcelona', awayTeam: 'Real Madrid', startTime: new Date(Date.now() + 45 * 60 * 1000) }
      ];
      
      logger.info(`Found ${upcomingMatches.length} upcoming matches for alerts`);
      
      for (const user of usersWithAlerts) {
        for (const match of upcomingMatches) {
          // Schedule alert for 30 minutes before match
          const alertTime = new Date(match.startTime.getTime() - 30 * 60 * 1000);
          
          // Only schedule if the alert time is in the future
          if (alertTime > new Date()) {
            this.scheduleNotification({
              id: `match-alert-${user.id}-${match.id}-${Date.now()}`,
              userId: user.id,
              type: 'match_alert',
              scheduledFor: alertTime,
              timezone: user.timezone,
              status: 'pending',
              data: {
                title: 'Upcoming Match Alert',
                message: `${match.homeTeam} vs ${match.awayTeam} starts in 30 minutes!`,
                matchId: match.id
              }
            });
          }
        }
      }
      
      logger.info('Match alert notifications scheduled successfully');
    } catch (error: any) {
      logger.error(`Error scheduling match alerts: ${error.message}`);
    }
  }
  
  /**
   * Schedule a new notification
   */
  public scheduleNotification(notification: NotificationJob): void {
    this.jobs.push(notification);
    logger.debug(`Scheduled notification ${notification.id} for ${notification.scheduledFor.toISOString()}`);
  }
  
  /**
   * Send a notification
   */
  private async sendNotification(notification: NotificationJob): Promise<void> {
    // Get user info
    // const user = await storage.getUser(notification.userId);
    // For now, we'll use a simple mock implementation
    const user = { id: notification.userId, pushToken: 'user-push-token' } as any;
    
    if (!user.pushToken) {
      throw new Error(`User ${notification.userId} does not have a push token`);
    }
    
    // Send notification based on type
    switch (notification.type) {
      case 'daily_digest':
        await this.sendDailyDigest(user, notification);
        break;
      case 'match_alert':
        await this.sendMatchAlert(user, notification);
        break;
      case 'prediction_result':
        await this.sendPredictionResult(user, notification);
        break;
      case 'value_alert':
        await this.sendValueAlert(user, notification);
        break;
      default:
        await this.sendGenericNotification(user, notification);
    }
  }
  
  /**
   * Send a daily digest notification
   */
  private async sendDailyDigest(user: any, notification: NotificationJob): Promise<void> {
    // Get today's predictions for the user based on preferences
    // const predictions = await storage.getTodaysPredictions(user.id);
    // For now, we'll use a simple mock implementation
    const predictions = [
      { id: 'p1', homeTeam: 'Arsenal', awayTeam: 'Chelsea', prediction: 'Home', confidence: 82 },
      { id: 'p2', homeTeam: 'Barcelona', awayTeam: 'Real Madrid', prediction: 'Draw', confidence: 75 }
    ];
    
    // Format the message
    const message = `Today's top picks: ${predictions.map(p => 
      `${p.homeTeam} vs ${p.awayTeam} (${p.prediction}, ${p.confidence}%)`
    ).join(', ')}`;
    
    // Send the push notification
    await this.pushService.sendPushNotification({
      userId: user.id,
      pushToken: user.pushToken,
      title: notification.data.title || 'Your PuntaIQ Daily Prediction Digest',
      body: message,
      data: {
        type: 'daily_digest',
        predictions: predictions.map(p => p.id)
      }
    });
  }
  
  /**
   * Send a match alert notification
   */
  private async sendMatchAlert(user: any, notification: NotificationJob): Promise<void> {
    await this.pushService.sendPushNotification({
      userId: user.id,
      pushToken: user.pushToken,
      title: notification.data.title || 'Upcoming Match Alert',
      body: notification.data.message,
      data: {
        type: 'match_alert',
        matchId: notification.data.matchId
      }
    });
  }
  
  /**
   * Send a prediction result notification
   */
  private async sendPredictionResult(user: any, notification: NotificationJob): Promise<void> {
    await this.pushService.sendPushNotification({
      userId: user.id,
      pushToken: user.pushToken,
      title: notification.data.title || 'Prediction Result',
      body: notification.data.message,
      data: {
        type: 'prediction_result',
        predictionId: notification.data.predictionId,
        result: notification.data.result
      }
    });
  }
  
  /**
   * Send a value alert notification
   */
  private async sendValueAlert(user: any, notification: NotificationJob): Promise<void> {
    await this.pushService.sendPushNotification({
      userId: user.id,
      pushToken: user.pushToken,
      title: notification.data.title || 'Value Bet Alert',
      body: notification.data.message,
      data: {
        type: 'value_alert',
        matchId: notification.data.matchId,
        marketType: notification.data.marketType,
        value: notification.data.value
      }
    });
  }
  
  /**
   * Send a generic notification
   */
  private async sendGenericNotification(user: any, notification: NotificationJob): Promise<void> {
    await this.pushService.sendPushNotification({
      userId: user.id,
      pushToken: user.pushToken,
      title: notification.data.title || 'PuntaIQ Notification',
      body: notification.data.message,
      data: notification.data
    });
  }
  
  /**
   * Get a user's local time based on their timezone
   */
  private getUserLocalTime(timezone: string): Date {
    const now = new Date();
    try {
      // Format as ISO string in user's timezone
      const userTime = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
      return userTime;
    } catch (error) {
      logger.error(`Error converting to timezone ${timezone}: ${error}`);
      return now; // Fallback to server time
    }
  }
  
  /**
   * Get the status of the notification scheduler
   */
  public getStatus(): { isRunning: boolean; pendingCount: number } {
    const pendingCount = this.jobs.filter(job => job.status === 'pending').length;
    
    return {
      isRunning: this.isRunning,
      pendingCount
    };
  }
  
  /**
   * Get all pending notifications
   */
  public getPendingNotifications(): NotificationJob[] {
    return this.jobs.filter(job => job.status === 'pending');
  }
  
  /**
   * Clear old notifications
   */
  public clearOldNotifications(olderThanDays: number = 7): number {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
    
    const initialCount = this.jobs.length;
    
    this.jobs = this.jobs.filter(job => {
      // Keep pending notifications
      if (job.status === 'pending') {
        return true;
      }
      
      // For delivered or failed notifications, check sentAt date
      if (job.sentAt) {
        return job.sentAt > cutoffDate;
      }
      
      // For jobs without sentAt, use scheduledFor
      return job.scheduledFor > cutoffDate;
    });
    
    const removedCount = initialCount - this.jobs.length;
    logger.info(`Cleared ${removedCount} old notifications`);
    
    return removedCount;
  }
}

// Export singleton instance
export const notificationScheduler = new NotificationScheduler();

// Export function to start the scheduler
export function startNotificationScheduler() {
  logger.info('Starting the notification scheduler');
  notificationScheduler.start();
}