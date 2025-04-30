import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider, OAuthProvider } from "firebase/auth";
import { getMessaging, getToken as getFirebaseToken, onMessage, isSupported } from "firebase/messaging";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBavJfC39euBBt2ktsMI5UZC9lwCjh_T68",
  authDomain: "puntaiq.firebaseapp.com",
  projectId: "puntaiq",
  storageBucket: "puntaiq.firebasestorage.app",
  messagingSenderId: "671968691848",
  appId: "1:671968691848:web:f20598285bbcb84190413d",
  measurementId: "G-7WLFPR7YJB"
};

// Initialize Firebase app
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Authentication methods
export const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    console.error("Google sign-in error:", error);
    throw error;
  }
};

export const signInWithApple = async () => {
  const provider = new OAuthProvider('apple.com');
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    console.error("Apple sign-in error:", error);
    throw error;
  }
};

export const getFirebaseConfig = () => {
  return firebaseConfig;
};

// Check if notifications are supported in this browser/environment
export const isNotificationsSupported = async (): Promise<boolean> => {
  if (typeof window === 'undefined') return false;
  
  try {
    return await isSupported();
  } catch {
    return false;
  }
};

// Get notification permission status
export const getNotificationPermission = async (): Promise<NotificationPermission> => {
  if (!('Notification' in window)) {
    return 'denied';
  }
  
  return Notification.permission;
};

// Request notification permission
export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (!('Notification' in window)) {
    throw new Error('Notifications not supported in this browser');
  }
  
  return await Notification.requestPermission();
};

// Get Firebase messaging token for push notifications
export const getToken = async (vapidKey?: string): Promise<string | null> => {
  try {
    // Check if notifications are supported first
    if (!await isNotificationsSupported()) {
      console.warn('Firebase messaging is not supported in this browser/environment');
      return null;
    }
    
    // Make sure permission is granted
    const permission = await getNotificationPermission();
    if (permission !== 'granted') {
      console.warn('Notification permission not granted');
      return null;
    }
    
    const messaging = getMessaging(app);
    const currentToken = await getFirebaseToken(messaging, {
      vapidKey: vapidKey || 'BOX9XCgq5sqpGjG2jJYWxKhzQ3yEBGdxXOsVVS5Dxx19nxYvRXNE0Y2t3LiFONwgXUVU7jLlQn6O8R-NwAZ_LAY',
    });
    
    if (currentToken) {
      return currentToken;
    } else {
      console.warn('No FCM token obtained');
      return null;
    }
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
};

// Set up Firebase messaging foreground handler
export const setupMessageListener = (callback: (payload: any) => void) => {
  try {
    const supported = isNotificationsSupported();
    if (!supported) {
      console.warn('Firebase messaging is not supported in this browser/environment');
      return;
    }
    
    const messaging = getMessaging(app);
    
    // Handle foreground messages
    return onMessage(messaging, (payload) => {
      console.log('Received foreground message:', payload);
      callback(payload);
    });
  } catch (error) {
    console.error('Error setting up message listener:', error);
  }
};

// Utility function to determine if in development mode
export const isDevelopmentMode = (): boolean => {
  return import.meta.env.MODE === 'development';
};