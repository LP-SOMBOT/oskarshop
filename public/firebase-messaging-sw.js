importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyAvSrhpON5ZQSsecrQTOZ44dlI7heclpXc",
  authDomain: "oskarshop-631c5.firebaseapp.com",
  databaseURL: "https://oskarshop-631c5-default-rtdb.firebaseio.com",
  projectId: "oskarshop-631c5",
  storageBucket: "oskarshop-631c5.firebasestorage.app",
  messagingSenderId: "30485488082",
  appId: "1:30485488082:web:8fbf7bdd72ff519ebd680b",
  measurementId: "G-XZBH0GH7WC"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const { title, body, icon } = payload.notification || {};
  self.registration.showNotification(title || 'OskarShop', {
    body: body || '',
    icon: icon || 'https://placehold.co/192x192/0EA5E9/FFFFFF/png?text=O',
    badge: 'https://placehold.co/192x192/0EA5E9/FFFFFF/png?text=O',
    data: payload.data || {},
    vibrate: [200, 100, 200],
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/')
  );
});
