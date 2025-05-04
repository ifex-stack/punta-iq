/**
 * Content Scheduler for PuntaIQ
 * 
 * Handles scheduling and delivery of content based on user timezone preferences
 * Works with predictions, notifications, news, and other time-sensitive content
 */

import { db } from './db';
import { notifications, users, predictions } from '@shared/schema';
import { eq, and, gte, lte } from 'drizzle-orm';
import { getLogger } from './logger';

const logger = getLogger('content-scheduler');

interface ScheduleOptions {
  contentType: 'predictions' | 'results' | 'news' | 'promotions';
  userId?: number; // If provided, schedules only for this user
  startDate?: Date; // Start date for scheduling window
  endDate?: Date; // End date for scheduling window
}

interface TimeWindow {
  start: Date;
  end: Date;
}

interface ContentItem {
  id: number;
  type: string;
  title: string;
  message: string;
  targetUserId: number;
  scheduledTime?: Date;
  data?: any;
}

/**
 * Schedule content delivery based on user timezone preferences
 */
export async function scheduleContent(options: ScheduleOptions): Promise<number> {
  try {
    const { contentType, userId, startDate, endDate } = options;
    const now = new Date();
    const scheduleWindow: TimeWindow = {
      start: startDate || now,
      end: endDate || new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000)) // Default to 7 days ahead
    };
    
    logger.info(`Scheduling ${contentType} content from ${scheduleWindow.start.toISOString()} to ${scheduleWindow.end.toISOString()}`);
    
    // Get list of target users (either specific user or all users)
    const targetUsers = await getTargetUsers(userId);
    logger.info(`Found ${targetUsers.length} target users for content scheduling`);
    
    // Get content to be scheduled
    const contentItems = await getContentForScheduling(contentType, scheduleWindow, targetUsers.map(u => u.id));
    logger.info(`Found ${contentItems.length} content items to schedule`);
    
    // Schedule each content item according to user preferences
    let scheduledCount = 0;
    for (const item of contentItems) {
      const user = targetUsers.find(u => u.id === item.targetUserId);
      
      if (!user) {
        logger.warn(`User ${item.targetUserId} not found for content item ${item.id}`);
        continue;
      }
      
      // Get user preferences
      const preferences = user.userPreferences as any;
      if (!preferences) {
        logger.warn(`No preferences found for user ${user.id}`);
        continue;
      }
      
      // Calculate delivery time based on user preferences
      const deliveryTime = calculateDeliveryTime(contentType, preferences, scheduleWindow);
      if (!deliveryTime) {
        logger.warn(`Failed to calculate delivery time for user ${user.id}`);
        continue;
      }
      
      // Create notification or schedule content delivery
      await createScheduledNotification(item, deliveryTime);
      scheduledCount++;
    }
    
    logger.info(`Successfully scheduled ${scheduledCount} content items`);
    return scheduledCount;
  } catch (error) {
    logger.error('Error scheduling content:', error);
    return 0;
  }
}

/**
 * Get list of target users for content scheduling
 */
async function getTargetUsers(specificUserId?: number): Promise<any[]> {
  try {
    if (specificUserId) {
      // Get specific user
      const user = await db.select().from(users).where(eq(users.id, specificUserId));
      return user;
    } else {
      // Get all active users
      const allUsers = await db.select().from(users).where(eq(users.isActive, true));
      return allUsers;
    }
  } catch (error) {
    logger.error('Error getting target users:', error);
    return [];
  }
}

/**
 * Get content items that need to be scheduled
 */
async function getContentForScheduling(
  contentType: string,
  timeWindow: TimeWindow,
  userIds: number[]
): Promise<ContentItem[]> {
  try {
    const contentItems: ContentItem[] = [];
    
    switch (contentType) {
      case 'predictions':
        // Get predictions that should be scheduled
        const predictionItems = await db.select().from(predictions).where(
          and(
            gte(predictions.startTime, timeWindow.start),
            lte(predictions.startTime, timeWindow.end)
          )
        );
        
        // For each prediction, create content items for relevant users
        for (const prediction of predictionItems) {
          for (const userId of userIds) {
            // Check if this prediction is relevant to the user (e.g., matches their sports preferences)
            if (await isRelevantToUser(prediction, userId)) {
              contentItems.push({
                id: prediction.id,
                type: 'prediction',
                title: `${prediction.homeTeam} vs ${prediction.awayTeam}`,
                message: `New prediction available for ${prediction.homeTeam} vs ${prediction.awayTeam}`,
                targetUserId: userId,
                data: {
                  matchId: prediction.matchId,
                  sport: prediction.sport,
                  league: prediction.league,
                  predictionType: prediction.predictedOutcome
                }
              });
            }
          }
        }
        break;
      
      case 'results':
        // Similar logic for results, fetch completed matches...
        break;
      
      case 'news':
        // Similar logic for news items...
        break;
      
      case 'promotions':
        // Logic for promotional content...
        break;
      
      default:
        logger.warn(`Unknown content type: ${contentType}`);
    }
    
    return contentItems;
  } catch (error) {
    logger.error('Error getting content for scheduling:', error);
    return [];
  }
}

/**
 * Check if a prediction is relevant to a user based on their preferences
 */
async function isRelevantToUser(prediction: any, userId: number): Promise<boolean> {
  try {
    // Get user preferences
    const user = await db.select().from(users).where(eq(users.id, userId));
    
    if (!user.length) {
      return false;
    }
    
    const preferences = user[0].userPreferences as any;
    
    // Check if this sport is in the user's favorite sports
    if (prediction.sport && 
        preferences?.favoriteSports && 
        Array.isArray(preferences.favoriteSports) && 
        preferences.favoriteSports.length > 0) {
      return preferences.favoriteSports.includes(prediction.sport.toLowerCase());
    }
    
    // If user has no sport preferences, consider it relevant
    return true;
  } catch (error) {
    logger.error('Error checking if prediction is relevant to user:', error);
    return false;
  }
}

/**
 * Calculate optimal delivery time based on user preferences
 */
function calculateDeliveryTime(
  contentType: string,
  userPreferences: any,
  timeWindow: TimeWindow
): Date | null {
  try {
    // Default delivery times if not specified in preferences
    const defaultTimes = {
      predictions: '08:00',
      results: '22:00',
      news: '12:00',
      promotions: '18:00'
    };
    
    // Get user's timezone or default to UTC
    const timezone = userPreferences.timezone || 'UTC';
    
    // Get preferred time for this content type
    const preferredTime = userPreferences.preferredContentDeliveryTimes?.[contentType] || 
                          defaultTimes[contentType as keyof typeof defaultTimes];
    
    // Parse hours and minutes
    const [hours, minutes] = preferredTime.split(':').map(Number);
    
    // Create delivery date in user's preferred time
    const deliveryDate = new Date(timeWindow.start);
    
    // Check scheduling preferences
    const isWeekend = deliveryDate.getDay() === 0 || deliveryDate.getDay() === 6;
    const allowWeekend = userPreferences.schedulingPreferences?.weekends !== false;
    const allowWeekday = userPreferences.schedulingPreferences?.weekdays !== false;
    
    // Skip delivery if not allowed on this day
    if ((isWeekend && !allowWeekend) || (!isWeekend && !allowWeekday)) {
      return null;
    }
    
    // Set hours and minutes
    deliveryDate.setHours(hours, minutes, 0, 0);
    
    // Check quiet hours
    const respectQuietHours = userPreferences.schedulingPreferences?.respectQuietHours !== false;
    if (respectQuietHours) {
      const quietHoursStart = userPreferences.schedulingPreferences?.quietHoursStart || '23:00';
      const quietHoursEnd = userPreferences.schedulingPreferences?.quietHoursEnd || '07:00';
      
      const [startHours, startMinutes] = quietHoursStart.split(':').map(Number);
      const [endHours, endMinutes] = quietHoursEnd.split(':').map(Number);
      
      const deliveryHours = deliveryDate.getHours();
      const deliveryMinutes = deliveryDate.getMinutes();
      
      const deliveryTime = deliveryHours * 60 + deliveryMinutes;
      const quietStartTime = startHours * 60 + startMinutes;
      const quietEndTime = endHours * 60 + endMinutes;
      
      // Check if delivery time is within quiet hours
      let isInQuietHours = false;
      if (quietStartTime > quietEndTime) {
        // Quiet hours span midnight
        isInQuietHours = deliveryTime >= quietStartTime || deliveryTime <= quietEndTime;
      } else {
        isInQuietHours = deliveryTime >= quietStartTime && deliveryTime <= quietEndTime;
      }
      
      // If in quiet hours, adjust to end of quiet hours
      if (isInQuietHours) {
        deliveryDate.setHours(endHours, endMinutes, 0, 0);
      }
    }
    
    return deliveryDate;
  } catch (error) {
    logger.error('Error calculating delivery time:', error);
    return null;
  }
}

/**
 * Create a scheduled notification for the content item
 */
async function createScheduledNotification(contentItem: ContentItem, deliveryTime: Date): Promise<void> {
  try {
    // Create notification with scheduled time
    await db.insert(notifications).values({
      userId: contentItem.targetUserId,
      title: contentItem.title,
      message: contentItem.message,
      type: contentItem.type,
      data: contentItem.data || null,
      createdAt: new Date(),
      scheduledFor: deliveryTime,
      isDelivered: false
    });
    
    logger.debug(`Created scheduled notification for user ${contentItem.targetUserId} at ${deliveryTime.toISOString()}`);
  } catch (error) {
    logger.error('Error creating scheduled notification:', error);
  }
}

/**
 * Process scheduled notifications that are due for delivery
 */
export async function processScheduledNotifications(): Promise<number> {
  try {
    const now = new Date();
    
    // Get notifications that are scheduled for now or earlier and not yet delivered
    const dueNotifications = await db.select().from(notifications).where(
      and(
        lte(notifications.scheduledFor as any, now),
        eq(notifications.isDelivered as any, false)
      )
    );
    
    logger.info(`Found ${dueNotifications.length} notifications due for delivery`);
    
    // Process each notification
    let deliveredCount = 0;
    for (const notification of dueNotifications) {
      // Deliver notification (implementation depends on notification system)
      const delivered = await deliverNotification(notification);
      
      if (delivered) {
        // Update notification as delivered
        await db.update(notifications)
          .set({ 
            isDelivered: true,
            deliveredAt: now
          })
          .where(eq(notifications.id, notification.id));
        
        deliveredCount++;
      }
    }
    
    logger.info(`Successfully delivered ${deliveredCount} notifications`);
    return deliveredCount;
  } catch (error) {
    logger.error('Error processing scheduled notifications:', error);
    return 0;
  }
}

/**
 * Deliver a notification through appropriate channels
 */
async function deliverNotification(notification: any): Promise<boolean> {
  try {
    // Implementation depends on notification system
    // This could include:
    // - Push notifications (Firebase, OneSignal, etc.)
    // - Email notifications
    // - In-app notifications
    // - SMS notifications
    
    // For now, just mark as delivered
    return true;
  } catch (error) {
    logger.error('Error delivering notification:', error);
    return false;
  }
}