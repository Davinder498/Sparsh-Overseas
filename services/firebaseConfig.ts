
// Fix: Import Firebase v8 compat libraries to match the project's likely dependency version.
import firebase from "firebase/compat/app";
import "firebase/compat/firestore";
import "firebase/compat/storage";
import "firebase/compat/auth";

// IMPORTANT: Replace these placeholder values with your actual Firebase project configuration.
// This method is generally NOT recommended for production environments due to security concerns.
const firebaseConfig = {
  apiKey: "AIzaSyBllp7cAupYL7DZ1gq-7h3j39u3zbAGpQk",
  authDomain: "sparsh-life-certificate-nri.firebaseapp.com",
  projectId: "sparsh-life-certificate-nri",
  storageBucket: "sparsh-life-certificate-nri.firebasestorage.app",
  messagingSenderId: "125269828104",
  appId: "1:125269828104:web:5254b95b6a074f476167bd",
  measurementId: "G-QG15KTNN9E"
};

// Initialize Firebase using the compat SDK
// Using if check to avoid re-initializing in hot-reload environments
if (!firebase.apps.length) {
    // Basic validation to ensure keys are present
    if (firebaseConfig.apiKey === "YOUR_FIREBASE_API_KEY") {
      console.warn("Firebase API Keys are still placeholders. Please replace them in services/firebaseConfig.ts.");
    }
    firebase.initializeApp(firebaseConfig);
}

// Fix: Use the namespaced v8 compat API
export const db = firebase.firestore();
export const storage = firebase.storage();
export const auth = firebase.auth();