// Firebase Cloud Messaging Service Worker

// Scripts for firebase and firebase messaging
importScripts('https://www.gstatic.com/firebasejs/9.19.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.19.1/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker
firebase.initializeApp({
  apiKey: "AIzaSyBavJfC39euBBt2ktsMI5UZC9lwCjh_T68",
  authDomain: "puntaiq.firebaseapp.com",
  projectId: "puntaiq",
  storageBucket: "puntaiq.firebasestorage.app",
  messagingSenderId: "671968691848",
  appId: "1:671968691848:web:f20598285bbcb84190413d",
  measurementId: "G-7WLFPR7YJB"
});

// Retrieve an instance of Firebase Messaging
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/assets/puntaiq-logo.png',
    badge: '/assets/notification-badge.png',
    data: payload.data,
    // For actions in the notification
    actions: [
      {
        action: 'view',
        title: 'View',
      }
    ]
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification clicked', event);
  event.notification.close();
  
  // This looks to see if the current window is already open and focuses if it is
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Get data from notification
        const urlToOpen = event.notification.data?.url || '/notifications';
        
        // Look for an existing window to use
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        
        // If no existing window, open a new one
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});