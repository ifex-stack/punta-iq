import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider, signInWithPopup, OAuthProvider } from "firebase/auth";
import { getMessaging, getToken as firebaseGetToken, onMessage } from "firebase/messaging";

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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const analytics = getAnalytics(app);

// Google Auth Provider
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('email');
googleProvider.addScope('profile');

// Apple Auth Provider
const appleProvider = new OAuthProvider('apple.com');
appleProvider.addScope('email');
appleProvider.addScope('name');

// Sign in with Google
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return {
      success: true,
      user: result.user,
      credential: GoogleAuthProvider.credentialFromResult(result),
    };
  } catch (error) {
    console.error("Google sign-in error:", error);
    return {
      success: false,
      error,
    };
  }
};

// Sign in with Apple
export const signInWithApple = async () => {
  try {
    const result = await signInWithPopup(auth, appleProvider);
    return {
      success: true,
      user: result.user,
      credential: OAuthProvider.credentialFromResult(result),
    };
  } catch (error) {
    console.error("Apple sign-in error:", error);
    return {
      success: false,
      error,
    };
  }
};

// Messaging setup
let messaging: any;
try {
  // Only initialize messaging if browser supports it
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    messaging = getMessaging(app);
  }
} catch (error) {
  console.error("Firebase messaging initialization error:", error);
}

// Export config getter for checking firebase availability
export const getFirebaseConfig = () => {
  return firebaseConfig;
};

// Check if notifications are supported
export const isNotificationsSupported = () => {
  return typeof window !== 'undefined' && 
         'Notification' in window && 
         'serviceWorker' in navigator && 
         'PushManager' in window;
};

// Get current notification permission
export const getNotificationPermission = () => {
  if (!isNotificationsSupported()) {
    return 'unsupported';
  }
  return Notification.permission;
};

// Request notification permission
export const requestNotificationPermission = async () => {
  if (!isNotificationsSupported()) {
    console.warn('Push notifications are not supported in this browser');
    return 'unsupported';
  }
  
  try {
    // Request permission from the user
    return await Notification.requestPermission();
  } catch (error) {
    console.error("Error requesting notification permission:", error);
    return 'denied';
  }
};

// Get Firebase messaging token
export const getToken = async (vapidKey?: string): Promise<string | null> => {
  if (!messaging) {
    console.warn('Firebase messaging is not available');
    return null;
  }
  
  try {
    // Check permission first
    const permission = Notification.permission;
    if (permission !== 'granted') {
      console.warn('Notification permission not granted');
      return null;
    }
    
    // Get token with optional VAPID key
    const options = vapidKey ? { vapidKey } : {};
    return await firebaseGetToken(messaging, options);
  } catch (error) {
    console.error("Error getting notification token:", error);
    return null;
  }
};

// Handle foreground messages
export const setupMessageListener = () => {
  if (!messaging) return;
  
  onMessage(messaging, (payload) => {
    console.log('Message received in foreground:', payload);
    
    // Display custom notification UI if app is open
    const { notification } = payload;
    if (notification) {
      // Here you could trigger a custom notification UI component
      // For example, using a toast notification system
      console.log('Notification title:', notification.title);
      console.log('Notification body:', notification.body);
    }
  });
};

export { app, auth, analytics, messaging };