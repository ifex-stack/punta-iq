import * as admin from 'firebase-admin';
import { cert } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import { logger } from './logger';

// Check if Firebase credentials are available in environment variables
let firebaseCredentials: any = null;
let projectId = "puntaiq"; // Default project ID

try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    // If provided as a JSON string in env var
    firebaseCredentials = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    projectId = firebaseCredentials.project_id;
    logger.info('[FirebaseAdmin]', 'Using Firebase credentials from environment');
  } else {
    // Sample credentials (for development only)
    logger.warn('[FirebaseAdmin]', 'Firebase credentials not found in environment. Using development mode.');
    firebaseCredentials = {
      "type": "service_account",
      "project_id": "puntaiq",
      // Other fields would be here in a real credential file
    };
  }
} catch (error) {
  logger.error('[FirebaseAdmin]', 'Error parsing Firebase credentials:', error);
  firebaseCredentials = null;
}

// Firebase instance status
let firebaseInitialized = false;

// Initialize Firebase only in production where credentials should be available
// In development, we'll use a fully mocked implementation
if (process.env.NODE_ENV === 'production' && process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    // Use the imported cert function with our credentials
    const credential = cert(firebaseCredentials as admin.ServiceAccount);
    admin.initializeApp({
      credential,
      databaseURL: `https://${projectId}.firebaseio.com`
    });
    firebaseInitialized = true;
    logger.info('[FirebaseAdmin]', 'Firebase Admin initialized successfully for production');
  } catch (error) {
    // Check if the error is because the app is already initialized
    if (error instanceof Error && error.message.includes('already exists')) {
      firebaseInitialized = true;
      logger.info('[FirebaseAdmin]', 'Firebase Admin already initialized');
    } else {
      logger.error('[FirebaseAdmin]', 'Firebase Admin initialization error:', error);
      
      // Get more detailed error info
      if (error instanceof Error) {
        logger.error('[FirebaseAdmin]', 'Error message:', error.message);
        logger.error('[FirebaseAdmin]', 'Error stack:', error.stack);
      }
    }
  }
} else {
  // In development, we're just using mocks rather than attempting to initialize
  logger.info('[FirebaseAdmin]', 'Running in development mode with mock Firebase implementation');
}

// Get the messaging instance once, with mock if Firebase is not initialized
const getMessagingInstance = () => {
  try {
    if (!firebaseInitialized) {
      // Return a mock messaging implementation for development
      logger.warn('[FirebaseAdmin]', 'Using mock messaging implementation');
      return {
        send: async () => {
          logger.info('[FirebaseAdmin]', '[MOCK] Message sent successfully');
          return 'mock-message-id-' + Date.now();
        },
        sendMulticast: async () => {
          logger.info('[FirebaseAdmin]', '[MOCK] Multicast message sent successfully');
          return {
            successCount: 1,
            failureCount: 0,
            responses: [{ success: true, messageId: 'mock-message-id-' + Date.now() }]
          };
        },
        subscribeToTopic: async () => {
          logger.info('[FirebaseAdmin]', '[MOCK] Successfully subscribed to topic');
          return { successCount: 1, failureCount: 0 };
        },
        unsubscribeFromTopic: async () => {
          logger.info('[FirebaseAdmin]', '[MOCK] Successfully unsubscribed from topic');
          return { successCount: 1, failureCount: 0 };
        }
      };
    }
    
    // Return the real messaging instance
    return getMessaging();
  } catch (error) {
    logger.error('[FirebaseAdmin]', 'Error getting messaging instance:', error);
    
    // Return mock implementation as fallback
    logger.warn('[FirebaseAdmin]', 'Falling back to mock messaging implementation');
    return {
      send: async () => {
        logger.info('[FirebaseAdmin]', '[MOCK-FALLBACK] Message sent successfully');
        return 'mock-message-id-' + Date.now();
      },
      sendMulticast: async () => {
        logger.info('[FirebaseAdmin]', '[MOCK-FALLBACK] Multicast message sent successfully');
        return {
          successCount: 1,
          failureCount: 0,
          responses: [{ success: true, messageId: 'mock-message-id-' + Date.now() }]
        };
      },
      subscribeToTopic: async () => {
        logger.info('[FirebaseAdmin]', '[MOCK-FALLBACK] Successfully subscribed to topic');
        return { successCount: 1, failureCount: 0 };
      },
      unsubscribeFromTopic: async () => {
        logger.info('[FirebaseAdmin]', '[MOCK-FALLBACK] Successfully unsubscribed from topic');
        return { successCount: 1, failureCount: 0 };
      }
    };
  }
};

/**
 * Send push notification to a specific device
 * @param token The FCM token of the device to send the notification to
 * @param title The notification title
 * @param body The notification body
 * @param data Additional data to send with the notification
 */
export const sendPushNotification = async (
  token: string,
  title: string,
  body: string,
  data: Record<string, string> = {}
) => {
  try {
    const message = {
      notification: {
        title,
        body,
      },
      data,
      token,
    };

    const messaging = getMessagingInstance();
    const response = await messaging.send(message);
    logger.info('[FirebaseAdmin]', 'Push notification sent successfully:', response);
    return { success: true, messageId: response };
  } catch (error) {
    logger.error('[FirebaseAdmin]', 'Error sending push notification:', error);
    return { success: false, error };
  }
};

/**
 * Send push notification to multiple devices
 * @param tokens List of FCM tokens
 * @param title The notification title
 * @param body The notification body
 * @param data Additional data to send with the notification
 */
export const sendMulticastPushNotification = async (
  tokens: string[],
  title: string,
  body: string,
  data: Record<string, string> = {}
) => {
  try {
    if (!tokens.length) {
      return { success: false, error: 'No tokens provided' };
    }

    const messaging = getMessagingInstance();
    
    // Handle individual messages since we're using a safer approach
    logger.info('[FirebaseAdmin]', 'Sending batch of individual messages');
    const sendPromises = tokens.map(async (token) => {
      try {
        const message = {
          notification: {
            title,
            body,
          },
          data,
          token,
        };
        
        return await messaging.send(message);
      } catch (err) {
        logger.error('[FirebaseAdmin]', 'Error sending individual message:', err);
        return null;
      }
    });
    
    const results = await Promise.all(sendPromises);
    
    // Create a response object similar to multicast response
    const response = {
      successCount: results.filter(r => !!r).length,
      failureCount: results.filter(r => !r).length,
      responses: results.map(messageId => ({ success: !!messageId, messageId }))
    };
    
    logger.info(
      '[FirebaseAdmin]', 
      `Multicast notification sent: ${response.successCount} success, ${response.failureCount} failures`
    );
    
    return { 
      success: true, 
      successCount: response.successCount,
      failureCount: response.failureCount,
      responses: response.responses 
    };
  } catch (error) {
    logger.error('[FirebaseAdmin]', 'Error sending multicast notification:', error);
    return { success: false, error };
  }
};

/**
 * Send push notification to a topic
 * @param topic The topic to send to
 * @param title The notification title
 * @param body The notification body
 * @param data Additional data to send with the notification
 */
export const sendTopicPushNotification = async (
  topic: string,
  title: string,
  body: string,
  data: Record<string, string> = {}
) => {
  try {
    const message = {
      notification: {
        title,
        body,
      },
      data,
      topic, // Topic name
    };

    const messaging = getMessagingInstance();
    const response = await messaging.send(message);
    logger.info('[FirebaseAdmin]', 'Topic notification sent successfully:', response);
    return { success: true, messageId: response };
  } catch (error) {
    logger.error('[FirebaseAdmin]', 'Error sending topic notification:', error);
    return { success: false, error };
  }
};

/**
 * Subscribe a device to a topic
 * @param token The FCM token to subscribe
 * @param topic The topic to subscribe to
 */
export const subscribeToTopic = async (token: string, topic: string) => {
  try {
    const messaging = getMessagingInstance();
    const response = await messaging.subscribeToTopic(token, topic);
    logger.info('[FirebaseAdmin]', 'Successfully subscribed to topic:', response);
    return { success: true, ...response };
  } catch (error) {
    logger.error('[FirebaseAdmin]', 'Error subscribing to topic:', error);
    return { success: false, error };
  }
};

/**
 * Unsubscribe a device from a topic
 * @param token The FCM token to unsubscribe
 * @param topic The topic to unsubscribe from
 */
export const unsubscribeFromTopic = async (token: string, topic: string) => {
  try {
    const messaging = getMessagingInstance();
    const response = await messaging.unsubscribeFromTopic(token, topic);
    logger.info('[FirebaseAdmin]', 'Successfully unsubscribed from topic:', response);
    return { success: true, ...response };
  } catch (error) {
    logger.error('[FirebaseAdmin]', 'Error unsubscribing from topic:', error);
    return { success: false, error };
  }
};

export default admin;