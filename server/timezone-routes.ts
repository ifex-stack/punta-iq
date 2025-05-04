import express from 'express';
import { createContextLogger } from './logger';
import { db } from './db';
import { format, addHours, subHours, parseISO } from 'date-fns';
import { utcToZonedTime, zonedTimeToUtc } from 'date-fns-tz';
import { predictions } from '@shared/schema';
import { and, eq, gt, lt, desc, asc } from 'drizzle-orm';

const router = express.Router();
const logger = createContextLogger('TimezoneRouter');

/**
 * Get timezone-optimized predictions
 * 
 * This endpoint returns predictions optimized for the user's timezone.
 * It prioritizes matches that are happening today or soon based on
 * the user's local time.
 */
router.get('/api/timezones/predictions', async (req, res) => {
  try {
    // Get timezone from query params or use UTC as default
    const timezone = req.query.timezone as string || 'UTC';
    const timeWindow = req.query.timeWindow ? parseInt(req.query.timeWindow as string) : 24; // hours
    const preferredTimeOfDay = req.query.preferredTime as string || 'auto';
    
    logger.info(`Getting timezone-optimized predictions for timezone: ${timezone}`);
    
    // Get current time in the user's timezone
    const nowUtc = new Date();
    const userLocalNow = utcToZonedTime(nowUtc, timezone);
    
    // Convert to UTC for database query (startTime is stored in UTC)
    const startTime = zonedTimeToUtc(userLocalNow, timezone);
    const endTime = addHours(startTime, timeWindow);
    
    // Query predictions happening within the time window
    const timeRelevantPredictions = await db
      .select()
      .from(predictions)
      .where(
        and(
          gt(predictions.startTime, startTime),
          lt(predictions.startTime, endTime)
        )
      )
      .orderBy(asc(predictions.startTime));
    
    // If no time preference is specified, return time-relevant predictions
    if (preferredTimeOfDay === 'auto') {
      logger.info(`Returning ${timeRelevantPredictions.length} time-relevant predictions`);
      
      res.json({
        timezone,
        userLocalTime: format(userLocalNow, 'yyyy-MM-dd HH:mm:ss'),
        timeWindow,
        predictions: timeRelevantPredictions
      });
      return;
    }
    
    // Get time ranges based on preferred time of day
    let startHour = 0;
    let endHour = 24;
    
    switch (preferredTimeOfDay) {
      case 'morning':
        startHour = 5;
        endHour = 12;
        break;
      case 'afternoon':
        startHour = 12;
        endHour = 17;
        break;
      case 'evening':
        startHour = 17;
        endHour = 21;
        break;
      case 'night':
        startHour = 21;
        endHour = 5; // Overnight
        break;
    }
    
    // Filter predictions to those happening during preferred time of day
    // This requires transforming UTC times to user local time for comparison
    const filteredPredictions = timeRelevantPredictions.filter(prediction => {
      // Convert UTC startTime to user's local timezone
      const localStartTime = utcToZonedTime(new Date(prediction.startTime), timezone);
      const hour = localStartTime.getHours();
      
      if (preferredTimeOfDay === 'night') {
        // Handle overnight case (21:00 - 05:00)
        return hour >= startHour || hour < endHour;
      }
      
      return hour >= startHour && hour < endHour;
    });
    
    logger.info(`Returning ${filteredPredictions.length} predictions for preferred time: ${preferredTimeOfDay}`);
    
    res.json({
      timezone,
      userLocalTime: format(userLocalNow, 'yyyy-MM-dd HH:mm:ss'),
      timeWindow,
      preferredTimeOfDay,
      predictions: filteredPredictions
    });
  } catch (error) {
    logger.error('Error getting timezone-optimized predictions', { error });
    res.status(500).json({ error: 'Failed to get timezone-optimized predictions' });
  }
});

/**
 * Get recommendations for user's current time window
 */
router.get('/api/timezones/recommendations', async (req, res) => {
  try {
    // Get timezone from query params or use UTC as default
    const timezone = req.query.timezone as string || 'UTC';
    
    // Get current time in the user's timezone
    const nowUtc = new Date();
    const userLocalNow = utcToZonedTime(nowUtc, timezone);
    const hour = userLocalNow.getHours();
    
    // Determine the current time window
    let timeWindow: 'morning' | 'afternoon' | 'evening' | 'night';
    
    if (hour >= 5 && hour < 12) {
      timeWindow = 'morning';
    } else if (hour >= 12 && hour < 17) {
      timeWindow = 'afternoon';
    } else if (hour >= 17 && hour < 21) {
      timeWindow = 'evening';
    } else {
      timeWindow = 'night';
    }
    
    // Customize recommendations based on time window
    const recommendations = {
      timeWindow,
      contentTypes: [] as string[],
      userLocalTime: format(userLocalNow, 'yyyy-MM-dd HH:mm:ss')
    };
    
    // Recommend different content based on time of day
    switch (timeWindow) {
      case 'morning':
        recommendations.contentTypes = ['news', 'predictions'];
        break;
      case 'afternoon':
        recommendations.contentTypes = ['predictions', 'accumulators'];
        break;
      case 'evening':
        recommendations.contentTypes = ['livescores', 'accumulators'];
        break;
      case 'night':
        recommendations.contentTypes = ['livescores', 'news'];
        break;
    }
    
    logger.info(`Generated time-based recommendations for ${timeWindow}`, { timezone });
    
    res.json(recommendations);
  } catch (error) {
    logger.error('Error getting time-based recommendations', { error });
    res.status(500).json({ error: 'Failed to get time-based recommendations' });
  }
});

/**
 * Get currently active content types based on user's timezone
 */
router.get('/api/timezones/active-content', async (req, res) => {
  try {
    const timezone = req.query.timezone as string || 'UTC';
    
    // Get current time in the user's timezone
    const nowUtc = new Date();
    const userLocalNow = utcToZonedTime(nowUtc, timezone);
    const hour = userLocalNow.getHours();
    const minute = userLocalNow.getMinutes();
    
    // Calculate content schedules
    const contentSchedules = {
      predictions: { start: '10:00', end: '22:00' },
      accumulators: { start: '12:00', end: '20:00' },
      news: { start: '08:00', end: '22:00' },
      livescores: { start: '12:00', end: '23:59' }
    };
    
    // Calculate time as minutes since midnight
    const currentMinutes = hour * 60 + minute;
    
    // Check which content types are active
    const activeContent = Object.entries(contentSchedules).filter(([type, schedule]) => {
      const [startHour, startMinute] = schedule.start.split(':').map(Number);
      const [endHour, endMinute] = schedule.end.split(':').map(Number);
      
      const startMinutes = startHour * 60 + startMinute;
      const endMinutes = endHour * 60 + endMinute;
      
      if (endMinutes < startMinutes) {
        // Overnight schedule (e.g., 22:00 - 04:00)
        return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
      } else {
        // Same day schedule (e.g., 10:00 - 16:00)
        return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
      }
    }).map(([type]) => type);
    
    logger.info(`Active content types: ${activeContent.join(', ')}`, { timezone });
    
    res.json({
      timezone,
      userLocalTime: format(userLocalNow, 'yyyy-MM-dd HH:mm:ss'),
      activeContent,
      contentSchedules
    });
  } catch (error) {
    logger.error('Error getting active content types', { error });
    res.status(500).json({ error: 'Failed to get active content types' });
  }
});

/**
 * Get user's current time information
 */
router.get('/api/timezones/user-time', (req, res) => {
  try {
    const timezone = req.query.timezone as string || 'UTC';
    
    // Get current time in the user's timezone
    const nowUtc = new Date();
    const userLocalNow = utcToZonedTime(nowUtc, timezone);
    
    // Get time window
    const hour = userLocalNow.getHours();
    let timeWindow: string;
    
    if (hour >= 5 && hour < 12) {
      timeWindow = 'morning';
    } else if (hour >= 12 && hour < 17) {
      timeWindow = 'afternoon';
    } else if (hour >= 17 && hour < 21) {
      timeWindow = 'evening';
    } else {
      timeWindow = 'night';
    }
    
    // Get day of week (0 = Sunday, 6 = Saturday)
    const dayOfWeek = userLocalNow.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    res.json({
      timezone,
      userLocalTime: format(userLocalNow, 'yyyy-MM-dd HH:mm:ss'),
      timeWindow,
      dayOfWeek,
      isWeekend,
      hour,
      minute: userLocalNow.getMinutes(),
      date: format(userLocalNow, 'yyyy-MM-dd'),
      time: format(userLocalNow, 'HH:mm:ss')
    });
  } catch (error) {
    logger.error('Error getting user time information', { error });
    res.status(500).json({ error: 'Failed to get user time information' });
  }
});

export const timezoneRouter = router;