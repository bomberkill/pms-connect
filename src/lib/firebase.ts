// Import the functions you need from the SDKs you need
// "use client"
import { initializeApp, FirebaseApp } from "firebase/app";
import { getStorage } from "firebase/storage";
import {
  Auth,
  getAuth,
} from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// let app: FirebaseApp;
// let auth: Auth;

// // This prevents Firebase from being initialized more than once
// if (getApps().length === 0) {
//   app = initializeApp(firebaseConfig);
//   // Use initializeAuth to set persistence. It's cleaner and safer.
//   auth = initializeAuth(app, {
//     persistence: [indexedDBLocalPersistence, browserLocalPersistence],
//   });
// } else {
//   app = getApp();
//   auth = getAuth(app); // getAuth is idempotent and will return the existing instance
// }
const app: FirebaseApp = initializeApp(firebaseConfig);
const auth: Auth = getAuth(app);
const storage = getStorage(app);

// Initialize Messaging only on client side
import type { Messaging } from "firebase/messaging";

let messaging: Messaging | null = null;
if (typeof window !== "undefined") {
  import("firebase/messaging").then(async ({ getMessaging, isSupported }) => {
    try {
      const supported = await isSupported();
      if (supported) {
        messaging = getMessaging(app);
      } else {
        console.warn("Firebase Messaging not supported in this browser.");
      }
    } catch (e) {
      console.warn("Firebase Messaging initialization failed", e);
    }
  });
}

// Initialize Firebase
export { auth, storage, messaging };
export default app;