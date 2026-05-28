importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing in the messagingSenderId.
firebase.initializeApp({
  apiKey: "AIzaSyAvSrhpON5ZQSsecrQTOZ44dlI7heclpXc",
  authDomain: "oskarshop-631c5.firebaseapp.com",
  databaseURL: "https://oskarshop-631c5-default-rtdb.firebaseio.com",
  projectId: "oskarshop-631c5",
  storageBucket: "oskarshop-631c5.firebasestorage.app",
  messagingSenderId: "30485488082",
  appId: "1:30485488082:web:8fbf7bdd72ff519ebd680b"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification?.title || 'Oskar Shop';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: payload.notification?.icon || 'https://placehold.co/192x192/0EA5E9/FFFFFF/png?text=O',
    badge: 'https://placehold.co/192x192/0EA5E9/FFFFFF/png?text=O',
    data: payload.data || {},
    vibrate: [200, 100, 200]
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  // Default to root, but try to use data.linkTo if provided by the trigger
  const linkTo = event.notification.data?.linkTo || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(linkTo) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(linkTo);
      }
    })
  );
});