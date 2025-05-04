import { useState, useEffect } from 'react';
import { useLocalStorage } from './use-local-storage';
import * as tzUtils from '@shared/timezone-utils';

interface TimePreferences {
  preferredTimeWindow: 'morning' | 'afternoon' | 'evening' | 'night' | 'auto';
  timezone: string;
  showTimeRelevantContentFirst: boolean;
}

interface ContentSchedule {
  predictions: { start: string; end: string };
  accumulators: { start: string; end: string };
  news: { start: string; end: string };
  livescores: { start: string; end: string };
}

/**
 * Hook for timezone-based content scheduling
 */
export function useTimezoneScheduling<T extends { startTime: string | Date }>(
  initialItems?: T[],
  options = { timeWindowHours: 12 }
) {
  // User preferences with defaults
  const [preferences, setPreferences] = useLocalStorage<TimePreferences>('timezone-preferences', {
    preferredTimeWindow: 'auto',
    timezone: tzUtils.getUserTimezone(),
    showTimeRelevantContentFirst: true
  });

  // Store content schedule
  const [contentSchedule, setContentSchedule] = useState<ContentSchedule>(
    tzUtils.getContentSchedule(preferences.timezone)
  );

  // Current time window (morning, afternoon, etc.)
  const [currentTimeWindow, setCurrentTimeWindow] = useState<
    'morning' | 'afternoon' | 'evening' | 'night'
  >(tzUtils.getUserTimeWindow());

  // Detect when we should refresh the schedule
  const [lastScheduleRefresh, setLastScheduleRefresh] = useState(new Date());

  // Items filtered and sorted based on timezone relevance
  const [sortedItems, setSortedItems] = useState<T[]>(initialItems || []);

  // Update items when initialItems changes
  useEffect(() => {
    if (!initialItems) return;
    
    // If user prefers time-relevant content first
    if (preferences.showTimeRelevantContentFirst) {
      // Get effective time window preference
      const effectiveTimeWindow = 
        preferences.preferredTimeWindow === 'auto' 
          ? currentTimeWindow 
          : preferences.preferredTimeWindow;
          
      // Sort by timezone relevance
      const sorted = tzUtils.sortMatchesByTimezoneRelevance(
        initialItems,
        effectiveTimeWindow,
        preferences.timezone
      );
      
      setSortedItems(sorted);
    } else {
      // Keep original order
      setSortedItems([...initialItems]);
    }
  }, [initialItems, preferences.showTimeRelevantContentFirst, preferences.preferredTimeWindow, currentTimeWindow]);

  // Refresh schedule every hour and on timezone/preference changes
  useEffect(() => {
    function refreshSchedule() {
      setCurrentTimeWindow(tzUtils.getUserTimeWindow());
      setContentSchedule(tzUtils.getContentSchedule(preferences.timezone));
      setLastScheduleRefresh(new Date());
    }

    // Initial refresh
    refreshSchedule();

    // Set up interval for refreshing
    const intervalId = setInterval(() => {
      refreshSchedule();
    }, 60 * 60 * 1000); // Every hour

    return () => clearInterval(intervalId);
  }, [preferences.timezone]);

  // Get time-relevant items (happening soon)
  const getTimeRelevantItems = (items: T[] = sortedItems, hoursWindow = options.timeWindowHours) => {
    return tzUtils.getTimeRelevantMatches(items, hoursWindow, preferences.timezone);
  };

  // Check if content type should be displayed now
  const shouldShowContent = (
    contentType: 'predictions' | 'accumulators' | 'news' | 'livescores'
  ) => {
    return tzUtils.shouldShowContentType(contentType, preferences.timezone);
  };

  // Format a date for display in user's timezone
  const formatLocalTime = (date: Date | string, formatStr = 'HH:mm') => {
    return tzUtils.formatLocalTime(date, formatStr, preferences.timezone);
  };

  // Update user preferences
  const updatePreferences = (newPrefs: Partial<TimePreferences>) => {
    setPreferences(prev => ({ ...prev, ...newPrefs }));
  };

  return {
    // Current state
    userTimezone: preferences.timezone,
    currentTimeWindow,
    contentSchedule,
    preferences,
    sortedItems,
    
    // Methods
    formatLocalTime,
    shouldShowContent, 
    getTimeRelevantItems,
    updatePreferences,
    
    // Raw timezone utils for advanced usage
    tzUtils
  };
}