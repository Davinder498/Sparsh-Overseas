
// Fix: Import Firebase v8 compat libraries to match the project's likely dependency version.
import firebase from "firebase/compat/app";
import "firebase/compat/firestore";
import "firebase/compat/storage";
import "firebase/compat/auth";

// Load keys from Environment Variables (Vite standard)
const firebaseConfig = {
  // Fix: Type assertion is used here to bypass TypeScript's lack of knowledge about `import.meta.env`.
  // This is typically handled by `vite-env.d.ts` or `tsconfig.json` setup in a Vite project,
  // but adding new files is disallowed by current coding guidelines.
  apiKey: (import.meta as any).env.VITE_FIREBASE_API_KEY,
  // Fix: Type assertion is used here to bypass TypeScript's lack of knowledge about `import.meta.env`.
  // This is typically handled by `vite-env.d.ts` or `tsconfig.json` setup in a Vite project,
  // but adding new files is disallowed by current coding guidelines.
  authDomain: (import.meta as any).env.VITE_FIREBASE_AUTH_DOMAIN,
  // Fix: Type assertion is used here to bypass TypeScript's lack of knowledge about `import.meta.env`.
  // This is typically handled by `vite-env.d.ts` or `tsconfig.json` setup in a Vite project,
  // but adding new files is disallowed by current coding guidelines.
  projectId: (import.meta as any).env.VITE_FIREBASE_PROJECT_ID,
  // Fix: Type assertion is used here to bypass TypeScript's lack of knowledge about `import.meta.env`.
  // This is typically handled by `vite-env.d.ts` or `tsconfig.json` setup in a Vite project,
  // but adding new files is disallowed by current coding guidelines.
  storageBucket: (import.meta as any).env.VITE_FIREBASE_STORAGE_BUCKET,
  // Fix: Type assertion is used here to bypass TypeScript's lack of knowledge about `import.meta.env`.
  // This is typically handled by `vite-env.d.ts` or `tsconfig.json` setup in a Vite project,
  // but adding new files is disallowed by current coding guidelines.
  messagingSenderId: (import.meta as any).env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  // Fix: Type assertion is used here to bypass TypeScript's lack of knowledge about `import.meta.env`.
  // This is typically handled by `vite-env.d.ts` or `tsconfig.json` setup in a Vite project,
  // but adding new files is disallowed by current coding guidelines.
  appId: (import.meta as any).env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase using the compat SDK
// Using if check to avoid re-initializing in hot-reload environments
if (!firebase.apps.length) {
    // Basic validation to ensure keys are present
    if (!firebaseConfig.apiKey) {
      console.error("Firebase API Keys are missing. Please check your .env file or Netlify Environment Variables.");
    }
    firebase.initializeApp(firebaseConfig);
}

// Fix: Use the namespaced v8 compat API
export const db = firebase.firestore();
export const storage = firebase.storage();
export const auth = firebase.auth();