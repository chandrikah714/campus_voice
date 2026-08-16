// public/firebase-messaging-sw.js
/* eslint-disable no-undef */
importScripts("https://www.gstatic.com/firebasejs/9.22.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.22.2/firebase-messaging-compat.js");

// Your Firebase config (same as in firebase.js)
firebase.initializeApp({
  apiKey: "AIzaSyA0lS_Ns4MhyRdSVMRLsgHNk4w8xYyL66Y",
  authDomain: "campus-voice-91dda.firebaseapp.com",
  projectId: "campus-voice-91dda",
  storageBucket: "campus-voice-91dda.firebasestorage.app",
  messagingSenderId: "54852741961",
  appId: "1:54852741961:web:afe60d1ee0e3bb02c54898",
  measurementId: "G-X7GSB78RDS"

});

// Initialize messaging
const messaging = firebase.messaging();

// Handle background push notifications
messaging.onBackgroundMessage((payload) => {
  console.log("[firebase-messaging-sw.js] Received background message ", payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: "/firebase-logo.png",
  };
  self.registration.showNotification(notificationTitle, notificationOptions);
});
