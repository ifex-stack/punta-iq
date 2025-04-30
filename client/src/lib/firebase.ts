import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider, signInWithPopup, OAuthProvider } from "firebase/auth";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

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

// Request notification permission
export const requestNotificationPermission = async () => {
  if (!messaging) return { success: false, error: 'Messaging not supported' };
  
  try {
    // Request permission
    const permission = await Notification.requestPermission();
    
    if (permission !== 'granted') {
      return { success: false, error: 'Notification permission denied' };
    }
    
    // Get token
    const token = await getToken(messaging, {
      vapidKey: '' // TODO: Add your VAPID key here if needed
    });
    
    // Save token to backend
    if (token) {
      await saveTokenToServer(token);
      return { success: true, token };
    } else {
      return { success: false, error: 'No token generated' };
    }
  } catch (error) {
    console.error("Error requesting notification permission:", error);
    return { success: false, error };
  }
};

// Save token to server
const saveTokenToServer = async (token: string) => {
  try {
    const res = await fetch('/api/notifications/register-device', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    });
    return await res.json();
  } catch (error) {
    console.error("Error saving token to server:", error);
    throw error;
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