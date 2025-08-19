// Import the functions you need from the SDKs you need
// "use client"
import { Auth } from "firebase/auth";
import {  getApp, getApps, initializeApp } from "firebase/app";
import { browserLocalPersistence, getAuth, setPersistence } from "firebase/auth";
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

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

// Définir la persistence immédiatement
let persistencePromise: Promise<void> | null = null;

if (typeof window !== "undefined" && !(auth as Auth & { _isPersistenceInitialized?: boolean })._isPersistenceInitialized) {
  persistencePromise = setPersistence(auth, browserLocalPersistence)
    .then(() => {
      console.log("🔥 Firebase auth persistence set to browserLocalPersistence");
    })
    .catch((err: unknown) => {
      console.error("❌ Failed to set auth persistence", err);
    });

  // Marque que c'est fait (pour éviter les doubles initialisations)
  (auth as Auth & { _isPersistenceInitialized?: boolean })._isPersistenceInitialized = true;
}

// Initialize Firebase
export {auth, persistencePromise};
export default app ;