import cron from "node-cron";
import { createContextLogger } from "./logger";

const notificationLogger = createContextLogger('notification-scheduler');

/**
 * TEMPORARILY DISABLED: The notification scheduler is disabled until the database schema is updated
 * 
 * The notifications table needs to be updated with additional columns:
 * - scheduledFor: timestamp
 * - isDelivered: boolean
 * - deliveredAt: timestamp
 * - priority: integer
 * - channel: text
 * - timezoneOffset: integer
 * 
 * After the database migration is complete, this file can be reverted to its original implementation.
 */
export function startNotificationScheduler() {
  notificationLogger.info('Notification scheduler is temporarily disabled until database schema is updated');
}