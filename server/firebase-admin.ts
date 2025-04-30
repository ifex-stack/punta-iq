import * as admin from 'firebase-admin';
import { cert } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import { logger } from './logger';

// Firebase admin service account credentials
const serviceAccount = {
  "type": "service_account",
  "project_id": "puntaiq",
  "private_key_id": "16e514e5f4232a3184c87ac15c8c2a2d7bba4619",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCtjIOBKo3ZnsrA\nh3xEzbxVTNrcdpJtFe/ThR2T8sMYvUUMsFIsVT5y36Y0hUhdS7KZzSQ10Z+tE1zr\nneU31ujYlX/A0d2b38usvAzYBp9eQ8u+Jok5rDUHRIC5MDfKvbfC0Kz93LKrbQSQ\nii90BtwwRjY4mKvOs23HW5oPTU27yqjz+WMuqnHYDL4N7a7NlVU3HsBAAmna4FIv\nsJFFbbkQzG31w6ZgFhzOjXt3YKJP+RCJUlutD2eyvfhKZBx2P8FwrTlbNdG+E1m2\nh8EYgOEJVk0EcBliVJ2H9hYZnwHKd/pAA9XVlvxCWjpyceJOm72T4qEvyaR/LMSz\nGsR9dfozAgMBAAECggEALls9lydoO2xUaQfnlDNGLp", // Note: In production, use environment variables for the full private key
  "client_email": "firebase-adminsdk-fbsvc@puntaiq.iam.gserviceaccount.com",
  "client_id": "118099638161163826679",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40puntaiq.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
};

// Initialize Firebase Admin with more detailed error logging
try {
  // Use the imported cert function instead of admin.credential.cert
  const credential = cert(serviceAccount as admin.ServiceAccount);
  admin.initializeApp({
    credential,
    databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
  });
  logger.info('[FirebaseAdmin]', 'Firebase Admin initialized successfully');
} catch (error) {
  // Check if the error is because the app is already initialized
  if (error instanceof Error && error.message.includes('already exists')) {
    logger.info('[FirebaseAdmin]', 'Firebase Admin already initialized');
  } else {
    logger.error('[FirebaseAdmin]', 'Firebase Admin initialization error:', error);
    
    // Get more detailed error info
    if (error instanceof Error) {
      logger.error('[FirebaseAdmin]', 'Error message:', error.message);
      logger.error('[FirebaseAdmin]', 'Error stack:', error.stack);
    }
    
    // Continue execution despite the error
    logger.warn('[FirebaseAdmin]', 'Continuing execution with Firebase in a degraded state');
  }
}

// Get the messaging instance once
const getMessagingInstance = () => {
  try {
    return getMessaging();
  } catch (error) {
    logger.error('[FirebaseAdmin]', 'Error getting messaging instance:', error);
    throw error;
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