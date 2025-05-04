import { format, addHours, subHours, isAfter, isBefore, parseISO } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

/**
 * Utility functions for timezone-based content scheduling
 */

/**
 * Get user's current timezone
 */
export function getUserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/**
 * Get user's timezone offset in hours
 */
export function getUserTimezoneOffset(): number {
  // Returns in minutes, convert to hours
  return new Date().getTimezoneOffset() / -60;
}

/**
 * Convert date to user's local timezone
 */
export function toLocalTime(date: Date | string, timezone?: string): Date {
  const parsedDate = typeof date === 'string' ? new Date(date) : date;
  const userTz = timezone || getUserTimezone();
  return toZonedTime(parsedDate, userTz);
}

/**
 * Convert local time to UTC
 */
export function toUTCTime(date: Date | string, timezone?: string): Date {
  const parsedDate = typeof date === 'string' ? new Date(date) : date;
  const userTz = timezone || getUserTimezone();
  
  // Since date-fns-tz doesn't have a direct zonedTimeToUtc function,
  // we need to calculate it manually
  const tzDate = toZonedTime(parsedDate, userTz);
  const offset = new Date().getTimezoneOffset() * 60000;
  return new Date(tzDate.getTime() - offset);
}

/**
 * Format date for display based on user's timezone
 */
export function formatLocalTime(date: Date | string, formatStr: string = 'HH:mm', timezone?: string): string {
  const localDate = toLocalTime(date, timezone);
  return format(localDate, formatStr);
}

/**
 * Determine if a match is happening 'today' in user's timezone
 */
export function isMatchToday(matchDate: Date | string, timezone?: string): boolean {
  const now = new Date();
  const userTz = timezone || getUserTimezone();
  const localNow = toZonedTime(now, userTz);
  const localMatch = toLocalTime(matchDate, userTz);
  
  return (
    localNow.getDate() === localMatch.getDate() &&
    localNow.getMonth() === localMatch.getMonth() &&
    localNow.getFullYear() === localMatch.getFullYear()
  );
}

/**
 * Get time window for user's timezone (morning, afternoon, evening, night)
 */
export function getUserTimeWindow(): 'morning' | 'afternoon' | 'evening' | 'night' {
  const now = new Date();
  const hour = now.getHours();
  
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

/**
 * Check if current time is within a specified time window
 */
export function isInTimeWindow(
  startTime: string, 
  endTime: string,
  timezone?: string
): boolean {
  const userTz = timezone || getUserTimezone();
  const now = new Date();
  const localNow = toZonedTime(now, userTz);
  
  // Parse time strings (format: HH:mm)
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);
  
  // Create date objects for start and end times
  const startDate = new Date(localNow);
  startDate.setHours(startHour, startMinute, 0, 0);
  
  const endDate = new Date(localNow);
  endDate.setHours(endHour, endMinute, 0, 0);
  
  // Handle overnight windows (e.g., 22:00 - 04:00)
  if (endHour < startHour) {
    endDate.setDate(endDate.getDate() + 1);
  }
  
  return isAfter(localNow, startDate) && isBefore(localNow, endDate);
}

/**
 * Get priority score for a match based on timezone
 * Higher score = higher priority for the user's timezone
 */
export function getMatchPriorityScore(
  matchDate: Date | string, 
  userTimePreference?: 'morning' | 'afternoon' | 'evening' | 'night',
  timezone?: string
): number {
  const userTz = timezone || getUserTimezone();
  const localMatchTime = toLocalTime(matchDate, userTz);
  const matchHour = localMatchTime.getHours();
  
  // Base priority score
  let score = 100;
  
  // Is match today? Higher priority
  if (isMatchToday(matchDate, timezone)) {
    score += 50;
  }
  
  // Is match in next 3 hours? Higher priority
  const now = new Date();
  const localNow = toZonedTime(now, userTz);
  const hoursUntilMatch = (localMatchTime.getTime() - localNow.getTime()) / (1000 * 60 * 60);
  
  if (hoursUntilMatch > 0 && hoursUntilMatch <= 3) {
    score += 30;
  }
  
  // Adjust score based on time of day preference
  const userPreference = userTimePreference || getUserTimeWindow();
  
  // Match time corresponds to user preference
  if (
    (userPreference === 'morning' && matchHour >= 5 && matchHour < 12) ||
    (userPreference === 'afternoon' && matchHour >= 12 && matchHour < 17) ||
    (userPreference === 'evening' && matchHour >= 17 && matchHour < 21) ||
    (userPreference === 'night' && (matchHour >= 21 || matchHour < 5))
  ) {
    score += 20;
  }
  
  return score;
}

/**
 * Sort matches by timezone relevance
 */
export function sortMatchesByTimezoneRelevance<T extends { startTime: string | Date }>(
  matches: T[],
  userTimePreference?: 'morning' | 'afternoon' | 'evening' | 'night',
  timezone?: string
): T[] {
  return [...matches].sort((a, b) => {
    const scoreA = getMatchPriorityScore(a.startTime, userTimePreference, timezone);
    const scoreB = getMatchPriorityScore(b.startTime, userTimePreference, timezone);
    return scoreB - scoreA; // Higher score first
  });
}

/**
 * Get matches that are relevant for the current time window
 */
export function getTimeRelevantMatches<T extends { startTime: string | Date }>(
  matches: T[],
  timeWindow: number = 6, // hours
  timezone?: string
): T[] {
  const userTz = timezone || getUserTimezone();
  const now = new Date();
  const localNow = toZonedTime(now, userTz);
  
  const windowEnd = addHours(localNow, timeWindow);
  
  return matches.filter(match => {
    const matchTime = toLocalTime(match.startTime, userTz);
    return isAfter(matchTime, localNow) && isBefore(matchTime, windowEnd);
  });
}

/**
 * Calculate the user's prime viewing hours 
 * Returns the optimal times to show content based on timezone
 */
export function getUserPrimeViewingHours(timezone?: string): { start: string; end: string } {
  const userTimeWindow = getUserTimeWindow();
  const userTz = timezone || getUserTimezone();
  
  // Default viewing hours by time window
  switch (userTimeWindow) {
    case 'morning':
      return { start: '07:00', end: '10:00' };
    case 'afternoon':
      return { start: '12:00', end: '15:00' };
    case 'evening':
      return { start: '18:00', end: '21:00' };
    case 'night':
      return { start: '20:00', end: '23:00' };
    default:
      return { start: '18:00', end: '21:00' }; // Default to evening
  }
}

/**
 * Generate schedule for when to display different content types
 */
export function getContentSchedule(timezone?: string): {
  predictions: { start: string; end: string };
  accumulators: { start: string; end: string };
  news: { start: string; end: string };
  livescores: { start: string; end: string };
} {
  const userTimeWindow = getUserTimeWindow();
  
  // Schedule varies by time of day
  switch (userTimeWindow) {
    case 'morning':
      return {
        predictions: { start: '07:00', end: '10:00' },
        accumulators: { start: '08:00', end: '11:00' },
        news: { start: '06:30', end: '09:00' },
        livescores: { start: '09:00', end: '12:00' }
      };
    case 'afternoon':
      return {
        predictions: { start: '12:00', end: '15:00' },
        accumulators: { start: '13:00', end: '16:00' },
        news: { start: '12:30', end: '14:30' },
        livescores: { start: '14:00', end: '18:00' }
      };
    case 'evening':
      return {
        predictions: { start: '17:00', end: '20:00' },
        accumulators: { start: '18:00', end: '21:00' },
        news: { start: '17:30', end: '19:30' },
        livescores: { start: '19:00', end: '23:00' }
      };
    case 'night':
      return {
        predictions: { start: '20:00', end: '23:00' },
        accumulators: { start: '19:00', end: '22:00' },
        news: { start: '21:00', end: '23:30' },
        livescores: { start: '20:30', end: '01:00' }
      };
    default:
      // Fallback schedule
      return {
        predictions: { start: '10:00', end: '22:00' },
        accumulators: { start: '12:00', end: '20:00' },
        news: { start: '08:00', end: '22:00' },
        livescores: { start: '12:00', end: '23:59' }
      };
  }
}

/**
 * Determine if specific content should be shown now
 */
export function shouldShowContentType(
  contentType: 'predictions' | 'accumulators' | 'news' | 'livescores',
  timezone?: string
): boolean {
  const schedule = getContentSchedule(timezone);
  const contentSchedule = schedule[contentType];
  
  return isInTimeWindow(contentSchedule.start, contentSchedule.end, timezone);
}