import {initializeApp, getApp, getApps} from "firebase/app";
import {getAuth} from "firebase/auth";
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
  try {
    // Validate required config before initializing
    if (!firebaseConfig.apiKey || !firebaseConfig.authDomain || !firebaseConfig.projectId) {
      console.warn('⚠️ Firebase config is incomplete. Some features may not work.');
    }

    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    firestore = getFirestore(app);
    storage = getStorage(app);
    
    // Log configuration for debugging (only in development)
    if (process.env.NODE_ENV === 'development') {
      console.log('🔧 Firebase Configuration:', {
        projectId: firebaseConfig.projectId,
        authDomain: firebaseConfig.authDomain,
        currentOrigin: window.location.origin,
        currentHostname: window.location.hostname,
      });
      
      // Check if localhost needs to be added to authorized domains
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        console.log('⚠️  Running on localhost - Make sure "localhost" and "127.0.0.1" are added to Firebase Console > Authentication > Settings > Authorized domains');
        console.log('📖 See FIREBASE_LOCALHOST_FIX.md or QUICK_FIX_GOOGLE_LOGIN.md for instructions');
      }
    }
  } catch (error: any) {
    // Handle Firebase initialization errors gracefully
    const errorMessage = error?.message || String(error) || 'Unknown error';
    const isDomainError = errorMessage.includes('origins don\'t match') || 
                         errorMessage.includes('unauthorized domain') ||
                         errorMessage.includes('DOMAIN_NOT_VERIFIED');
    
    if (isDomainError) {
      // Domain authorization error - show helpful message
      const hostname = window.location.hostname;
      const origin = window.location.origin;
      
      console.error('');
      console.error('🔴 ============================================');
      console.error('🔴 FIREBASE DOMAIN AUTHORIZATION ERROR');
      console.error('🔴 ============================================');
      console.error('');
      console.error('Current domain:', hostname);
      console.error('Current origin:', origin);
      console.error('Firebase auth domain:', firebaseConfig.authDomain);
      console.error('');
      console.error('⚠️  SOLUTION: Add your domain to Firebase');
      console.error('');
      console.error('1. Go to: https://console.firebase.google.com/');
      console.error('2. Select project: vizzle-72eff');
      console.error('3. Go to: Authentication > Settings');
      console.error('4. Scroll to: "Authorized domains"');
      console.error('5. Click "Add domain" and add:');
      console.error('   - "' + hostname + '"');
      console.error('   - "localhost"');
      console.error('   - "127.0.0.1"');
      console.error('');
      console.error('6. Restart your dev server: npm run dev');
      console.error('7. Clear browser cache or use incognito mode');
      console.error('');
      console.error('📖 See QUICK_FIX_GOOGLE_LOGIN.md for detailed instructions');
      console.error('🔴 ============================================');
      console.error('');
      
      // Show user-friendly alert (only once, after a delay)
      if (typeof window !== 'undefined' && !sessionStorage.getItem('firebaseDomainErrorShown')) {
        sessionStorage.setItem('firebaseDomainErrorShown', 'true');
        setTimeout(() => {
          const message = 
            '🔴 Firebase Domain Error\n\n' +
            'Your domain "' + hostname + '" is not authorized in Firebase.\n\n' +
            'To fix this:\n\n' +
            '1. Go to Firebase Console\n' +
            '   https://console.firebase.google.com/\n\n' +
            '2. Select project: vizzle-72eff\n\n' +
            '3. Go to: Authentication > Settings\n\n' +
            '4. Scroll to "Authorized domains"\n\n' +
            '5. Click "Add domain" and add:\n' +
            '   • "' + hostname + '"\n' +
            '   • "localhost"\n' +
            '   • "127.0.0.1"\n\n' +
            '6. Restart your dev server\n' +
            '7. Clear browser cache\n\n' +
            'See QUICK_FIX_GOOGLE_LOGIN.md for details.';
          
          try {
            alert(message);
          } catch (e) {
            // Alert might fail in some contexts, ignore
            console.log('Could not show alert, but error is logged above');
          }
        }, 2000);
      }
      
      // Don't throw - allow app to continue (auth will just fail gracefully)
      // This prevents the app from crashing
      console.warn('⚠️ Firebase auth may not work until domain is authorized');
    } else {
      // Other Firebase errors
      console.error('❌ Firebase initialization error:', error);
      console.error('Error message:', errorMessage);
    }
    
    // Still initialize Firebase even if there's an error
    // This allows the app to continue running
    try {
      if (!app) {
        app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
      }
      if (!auth) {
        auth = getAuth(app);
      }
      if (!firestore) {
        firestore = getFirestore(app);
      }
      if (!storage) {
        storage = getStorage(app);
      }
    } catch (fallbackError) {
      console.error('❌ Could not initialize Firebase:', fallbackError);
    }
  }
}

export { auth, firestore, storage, app };
