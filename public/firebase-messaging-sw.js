/* eslint-disable no-undef */
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

firebase.initializeApp({
    apiKey: "AIzaSyBCyvx3kzwCBeOSe1MCm6M4BFL3T6ZOTP0",
    authDomain: "connectify-9803.firebaseapp.com",
    projectId: "connectify-9803",
    storageBucket: "connectify-9803.firebasestorage.app",
    messagingSenderId: "291325959035",
    appId: "1:291325959035:web:d1ebf3fc49e76d4fc93bde",
    measurementId: "G-RZQWXL63PX"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    console.log("Background message received: ", payload);

    const notificationTitle = payload.notification.title
    const notificationOptions= {
        body: payload.notification.body,
        icon: "/firebase-logo.png",
    }
    self.registration.showNotification(notificationTitle, notificationOptions);
});
