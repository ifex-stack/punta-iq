/**
 * Timezone service for PuntaIQ smart content scheduling
 * Handles timezone detection, conversion, and scheduling optimization
 */

// List of common IANA timezones
export const timezoneOptions = [
  { value: 'Europe/London', label: 'London (GMT/BST)', offset: 0, region: 'Europe' },
  { value: 'Europe/Paris', label: 'Paris (CET/CEST)', offset: 1, region: 'Europe' },
  { value: 'America/New_York', label: 'New York (EST/EDT)', offset: -5, region: 'North America' },
  { value: 'America/Chicago', label: 'Chicago (CST/CDT)', offset: -6, region: 'North America' },
  { value: 'America/Los_Angeles', label: 'Los Angeles (PST/PDT)', offset: -8, region: 'North America' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)', offset: 9, region: 'Asia' },
  { value: 'Asia/Dubai', label: 'Dubai (GST)', offset: 4, region: 'Asia' },
  { value: 'Asia/Singapore', label: 'Singapore (SGT)', offset: 8, region: 'Asia' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST/AEDT)', offset: 10, region: 'Australia' },
  { value: 'Africa/Lagos', label: 'Lagos (WAT)', offset: 1, region: 'Africa' },
  { value: 'Africa/Nairobi', label: 'Nairobi (EAT)', offset: 3, region: 'Africa' },
  { value: 'Africa/Johannesburg', label: 'Johannesburg (SAST)', offset: 2, region: 'Africa' },
  { value: 'Africa/Accra', label: 'Accra (GMT)', offset: 0, region: 'Africa' },
];

/**
 * Detect user's timezone using browser APIs
 */
export function detectUserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (error) {
    console.error('Failed to detect timezone:', error);
    return 'Europe/London'; // Default to London/GMT if detection fails
  }
}

/**
 * Convert time from user's timezone to UTC
 * @param timeString Time string in format 'HH:MM'
 * @param timezone IANA timezone string
 * @returns UTC time string in format 'HH:MM'
 */
export function convertToUTC(timeString: string, timezone: string): string {
  try {
    // Create a date object for today with the specified time in the user's timezone
    const [hours, minutes] = timeString.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    
    // Get the date string in ISO format which will be in local timezone
    const localISOString = date.toISOString();
    
    // Create a formatter to format the date in the user's timezone
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    
    // Get the time in the user's timezone
    const userTimezoneTime = formatter.format(date);
    
    // Convert the time to UTC
    const utcDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    const utcHours = utcDate.getUTCHours();
    const utcMinutes = utcDate.getUTCMinutes();
    
    return `${utcHours.toString().padStart(2, '0')}:${utcMinutes.toString().padStart(2, '0')}`;
  } catch (error) {
    console.error('Failed to convert time to UTC:', error);
    return timeString; // Return original time if conversion fails
  }
}

/**
 * Convert UTC time to user's timezone
 * @param utcTimeString UTC time string in format 'HH:MM'
 * @param timezone IANA timezone string
 * @returns Time string in user's timezone in format 'HH:MM'
 */
export function convertFromUTC(utcTimeString: string, timezone: string): string {
  try {
    // Create a date object for today with the specified UTC time
    const [hours, minutes] = utcTimeString.split(':').map(Number);
    const date = new Date();
    date.setUTCHours(hours, minutes, 0, 0);
    
    // Create a formatter to format the date in the user's timezone
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    
    // Format the date in the user's timezone
    return formatter.format(date);
  } catch (error) {
    console.error('Failed to convert time from UTC:', error);
    return utcTimeString; // Return original time if conversion fails
  }
}

/**
 * Check if current time is within quiet hours
 * @param quietHoursStart Start time of quiet hours in format 'HH:MM'
 * @param quietHoursEnd End time of quiet hours in format 'HH:MM'
 * @param timezone IANA timezone string
 * @returns True if current time is within quiet hours
 */
export function isWithinQuietHours(
  quietHoursStart: string, 
  quietHoursEnd: string, 
  timezone: string
): boolean {
  try {
    // Get current time in user's timezone
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    const currentTime = formatter.format(now);
    
    // Convert all times to minutes since midnight for easy comparison
    const currentMinutes = convertTimeToMinutes(currentTime);
    const startMinutes = convertTimeToMinutes(quietHoursStart);
    const endMinutes = convertTimeToMinutes(quietHoursEnd);
    
    // Handle case where quiet hours span midnight
    if (startMinutes > endMinutes) {
      return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
    } else {
      return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
    }
  } catch (error) {
    console.error('Failed to check quiet hours:', error);
    return false; // Default to not in quiet hours if check fails
  }
}

/**
 * Calculate best time to deliver content based on user preferences
 * @param preferredTime Preferred time in format 'HH:MM'
 * @param contentType Type of content (predictions, results, news, promotions)
 * @param userPreferences User preferences object
 * @returns Optimized delivery time in format 'HH:MM'
 */
export function calculateOptimalDeliveryTime(
  preferredTime: string,
  contentType: 'predictions' | 'results' | 'news' | 'promotions',
  userPreferences: any
): string {
  try {
    const timezone = userPreferences.timezone || detectUserTimezone();
    const quietHoursStart = userPreferences.schedulingPreferences?.quietHoursStart || '23:00';
    const quietHoursEnd = userPreferences.schedulingPreferences?.quietHoursEnd || '07:00';
    const respectQuietHours = userPreferences.schedulingPreferences?.respectQuietHours !== false;
    
    // If user doesn't want to respect quiet hours, just return preferred time
    if (!respectQuietHours) {
      return preferredTime;
    }
    
    // Convert times to minutes since midnight
    const preferredMinutes = convertTimeToMinutes(preferredTime);
    const quietStartMinutes = convertTimeToMinutes(quietHoursStart);
    const quietEndMinutes = convertTimeToMinutes(quietHoursEnd);
    
    // Check if preferred time is within quiet hours
    let isInQuietHours = false;
    if (quietStartMinutes > quietEndMinutes) {
      // Quiet hours span midnight
      isInQuietHours = preferredMinutes >= quietStartMinutes || preferredMinutes <= quietEndMinutes;
    } else {
      isInQuietHours = preferredMinutes >= quietStartMinutes && preferredMinutes <= quietEndMinutes;
    }
    
    // If not in quiet hours, return preferred time
    if (!isInQuietHours) {
      return preferredTime;
    }
    
    // If in quiet hours, adjust to the end of quiet hours
    return minutesToTimeString(quietEndMinutes);
  } catch (error) {
    console.error('Failed to calculate optimal delivery time:', error);
    return preferredTime; // Return original time if calculation fails
  }
}

/**
 * Convert time string to minutes since midnight
 * @param timeString Time string in format 'HH:MM'
 * @returns Minutes since midnight
 */
function convertTimeToMinutes(timeString: string): number {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Convert minutes since midnight to time string
 * @param minutes Minutes since midnight
 * @returns Time string in format 'HH:MM'
 */
function minutesToTimeString(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

/**
 * Check if the given day is a weekend
 * @param date Date to check
 * @param timezone IANA timezone string
 * @returns True if the date is a weekend (Saturday or Sunday)
 */
export function isWeekend(date: Date, timezone: string): boolean {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      weekday: 'long'
    });
    const weekday = formatter.format(date);
    return weekday === 'Saturday' || weekday === 'Sunday';
  } catch (error) {
    console.error('Failed to check if date is weekend:', error);
    return false;
  }
}

/**
 * Get user's local date
 * @param timezone IANA timezone string
 * @returns Current date in user's timezone
 */
export function getUserLocalDate(timezone: string): Date {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    const dateString = formatter.format(now);
    
    // Convert date string to Date object
    const [month, day, year] = dateString.split('/').map(Number);
    return new Date(year, month - 1, day);
  } catch (error) {
    console.error('Failed to get user local date:', error);
    return new Date();
  }
}