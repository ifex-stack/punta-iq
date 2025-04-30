// Give the service worker access to Firebase Messaging.
// Note that you can only use Firebase Messaging here. Other Firebase libraries
// are not available in the service worker.
importScripts('https://www.gstatic.com/firebasejs/9.2.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.2.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing in
// your app's Firebase config object.
// https://firebase.google.com/docs/web/setup#config-object
firebase.initializeApp({
  apiKey: "AIzaSyBavJfC39euBBt2ktsMI5UZC9lwCjh_T68",
  authDomain: "puntaiq.firebaseapp.com",
  projectId: "puntaiq",
  storageBucket: "puntaiq.firebasestorage.app",
  messagingSenderId: "671968691848",
  appId: "1:671968691848:web:f20598285bbcb84190413d",
  measurementId: "G-7WLFPR7YJB"
});

// Retrieve an instance of Firebase Messaging so that it can handle background
// messages.
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message', payload);
  
  // Customize notification here
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/favicon.ico',
    badge: '/logo192.png',
    data: payload.data,
    // Add more options as needed: image, actions, etc.
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification click', event);
  
  event.notification.close();
  
  // This looks to see if the current is already open and focuses it
  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    })
    .then((clientList) => {
      const url = event.notification.data && event.notification.data.url 
        ? event.notification.data.url 
        : '/';
        
      // If a window is already open, focus it
      for (const client of clientList) {
        if (client.url.includes(self.registration.scope) && 'focus' in client) {
          client.postMessage({
            type: 'NOTIFICATION_CLICK',
            url: url
          });
          return client.focus();
        }
      }
      
      // Otherwise, open a new window
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});