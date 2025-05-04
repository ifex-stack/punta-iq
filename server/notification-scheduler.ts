import cron from "node-cron";
import { processScheduledNotifications, scheduleContent } from "./content-scheduler";
import { createContextLogger } from "./logger";

const notificationLogger = createContextLogger('notification-scheduler');

// Process scheduled notifications every minute
export function startNotificationScheduler() {
  notificationLogger.info('Starting notification scheduler');
  
  // Process due notifications every minute
  cron.schedule('* * * * *', async () => {
    try {
      notificationLogger.debug('Running scheduled notification processor');
      const processedCount = await processScheduledNotifications();
      
      if (processedCount > 0) {
        notificationLogger.info(`Processed ${processedCount} scheduled notifications`);
      }
    } catch (error) {
      notificationLogger.error('Error processing scheduled notifications:', error);
    }
  });
  
  // Schedule new content every day at 00:01
  cron.schedule('1 0 * * *', async () => {
    try {
      notificationLogger.info('Scheduling predictions for the next 24 hours');
      const scheduledCount = await scheduleContent({ 
        contentType: 'predictions', 
        startDate: new Date(), 
        endDate: new Date(Date.now() + 24 * 60 * 60 * 1000) 
      });
      
      notificationLogger.info(`Scheduled ${scheduledCount} predictions`);
    } catch (error) {
      notificationLogger.error('Error scheduling predictions:', error);
    }
  });
  
  // Schedule results notifications every day at 00:15
  cron.schedule('15 0 * * *', async () => {
    try {
      notificationLogger.info('Scheduling results for the next 24 hours');
      const scheduledCount = await scheduleContent({ 
        contentType: 'results', 
        startDate: new Date(), 
        endDate: new Date(Date.now() + 24 * 60 * 60 * 1000) 
      });
      
      notificationLogger.info(`Scheduled ${scheduledCount} results`);
    } catch (error) {
      notificationLogger.error('Error scheduling results:', error);
    }
  });
  
  // Schedule news content every day at 00:30
  cron.schedule('30 0 * * *', async () => {
    try {
      notificationLogger.info('Scheduling news for the next 24 hours');
      const scheduledCount = await scheduleContent({ 
        contentType: 'news', 
        startDate: new Date(), 
        endDate: new Date(Date.now() + 24 * 60 * 60 * 1000) 
      });
      
      notificationLogger.info(`Scheduled ${scheduledCount} news items`);
    } catch (error) {
      notificationLogger.error('Error scheduling news:', error);
    }
  });
  
  // Schedule promotional content every week on Monday at 00:45
  cron.schedule('45 0 * * 1', async () => {
    try {
      notificationLogger.info('Scheduling promotions for the next week');
      const scheduledCount = await scheduleContent({ 
        contentType: 'promotions', 
        startDate: new Date(), 
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) 
      });
      
      notificationLogger.info(`Scheduled ${scheduledCount} promotions`);
    } catch (error) {
      notificationLogger.error('Error scheduling promotions:', error);
    }
  });
  
  notificationLogger.info('Notification scheduler initialized');
}