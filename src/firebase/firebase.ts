import {initializeApp, getApp, getApps} from "firebase/app";
import {getAuth, GoogleAuthProvider, FacebookAuthProvider } from "firebase/auth";
import {getFirestore} from "firebase/firestore";
import {getStorage} from "firebase/storage";

// Validate required environment variables
const requiredEnvVars = [
  { key: 'NEXT_PUBLIC_FIREBASE_API_KEY', value: process.env.NEXT_PUBLIC_FIREBASE_API_KEY },
  { key: 'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN', value: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN },
  { key: 'NEXT_PUBLIC_FIREBASE_PROJECT_ID', value: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID },
  { key: 'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET', value: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET },
  { key: 'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID', value: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID },
  { key: 'NEXT_PUBLIC_FIREBASE_APP_ID', value: process.env.NEXT_PUBLIC_FIREBASE_APP_ID },
];

// Check for missing environment variables (only in production)
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
  const missingVars = requiredEnvVars
    .filter(({ value }) => !value || value.trim() === '')
    .map(({ key }) => key);
  
  if (missingVars.length > 0) {
    console.error('❌ Missing Firebase environment variables:', missingVars.join(', '));
    console.error('Please set these in your Vercel project settings under Environment Variables');
    console.error('See VERCEL_DEPLOYMENT.md for detailed instructions');
  }
}

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "",
};

// Only initialize on client side
let app: any;
let auth: any;
let firestore: any;
let storage: any;

if (typeof window !== 'undefined') {
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(app);
  firestore = getFirestore(app);
  storage = getStorage(app);
}

export { auth, firestore, storage, app };

// Export functions to create providers (avoids SSR issues)
export const getGoogleProvider = () => {
  if (typeof window !== 'undefined') {
    return new GoogleAuthProvider();
  }
  return null;
};

export const getFacebookProvider = () => {
  if (typeof window !== 'undefined') {
    return new FacebookAuthProvider();
  }
  return null;
};

// Legacy exports for backward compatibility
export const googleProvider = typeof window !== 'undefined' ? new GoogleAuthProvider() : null;
export const facebookProvider = typeof window !== 'undefined' ? new FacebookAuthProvider() : null;
