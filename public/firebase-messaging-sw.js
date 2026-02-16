// --- Firebase Push Notifications Setup ---
// This file is strictly for Firebase Background Messages.
// PWA Caching is handled by the generated sw.js from next-pwa.

// Using consistent version v10.13.0 for better compatibility with v11 client
importScripts('https://www.gstatic.com/firebasejs/10.13.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.0/firebase-messaging-compat.js');

firebase.initializeApp({
    apiKey: "AIzaSyCVNqRULKy7oWRdlo0QcDuedvccKgLRv10",
    authDomain: "pms-connect-e5cb8.firebaseapp.com",
    projectId: "pms-connect-e5cb8",
    storageBucket: "nobisoft-nextjs-website.appspot.com",
    messagingSenderId: "37146219570",
    appId: "1:37146219570:web:1eaf8e5a638110d7e2d82b",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);

    // Support both Notification and Data payloads (prefer Data to avoid system duplicates if backend sends data-only)
    const notificationTitle = payload.notification?.title || payload.data?.title;
    const notificationBody = payload.notification?.body || payload.data?.body;

    // If no content, ignore (e.g. silent sync)
    if (!notificationTitle) return;

    const notificationOptions = {
        body: notificationBody,
        icon: '/web-app-manifest-192x192.png',
        data: payload.data
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', function (event) {
    event.notification.close();
    // Handle click - open specific URL
    const urlToOpen = event.notification.data?.url || '/';

    event.waitUntil(
        clients.matchAll({
            type: 'window',
            includeUncontrolled: true
        }).then(function (windowClients) {
            // Check if there is already a window/tab open with the target URL
            for (var i = 0; i < windowClients.length; i++) {
                var client = windowClients[i];
                if (client.url === urlToOpen && 'focus' in client) {
                    return client.focus();
                }
            }
            // If not, open a new window
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});
