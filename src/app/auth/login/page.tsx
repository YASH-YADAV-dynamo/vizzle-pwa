"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { IoArrowBack } from "react-icons/io5";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  GoogleAuthProvider,
  FacebookAuthProvider,
} from "firebase/auth";
import {
  auth,
  firestore,
} from "@/firebase/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Import useAuth to check if user is already logged in
  const { user, loading: authLoading } = typeof window !== 'undefined' ? require('@/contexts/AuthContext').useAuth() : { user: null, loading: false };

  // Check if running in PWA mode - recalculate each time to ensure accuracy
  const checkIsPWA = () => {
    if (typeof window === 'undefined') return false;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isIOSStandalone = (window.navigator as any).standalone === true;
    const isPWA = isStandalone || isIOSStandalone;
    return isPWA;
  };
  
  const [isPWA, setIsPWA] = React.useState(false);
  
  // Update PWA status on mount and when needed
  React.useEffect(() => {
    setIsPWA(checkIsPWA());
  }, []);

  // Debug: Log domain information on mount (especially for PWA)
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      console.log('🔍 Domain Debug Info:');
      console.log('  - Hostname:', window.location.hostname);
      console.log('  - Origin:', window.location.origin);
      console.log('  - Full URL:', window.location.href);
      console.log('  - Is PWA:', isPWA);
      console.log('  - Display Mode:', window.matchMedia('(display-mode: standalone)').matches ? 'standalone' : 'browser');
      console.log('  - Firebase Auth Domain:', process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'Not set');
      console.log('⚠️  If you see "unauthorized domain" error, add the hostname above to Firebase Console > Authentication > Settings > Authorized domains');
    }
  }, [isPWA]);

  // Redirect if already logged in (but not if we're processing a redirect result)
  if (typeof window !== 'undefined') {
    React.useEffect(() => {
      const redirectInProgress = sessionStorage.getItem('authRedirectInProgress');
      // Don't redirect if we're processing a redirect result - let AuthContext handle it
      if (!authLoading && user && !redirectInProgress) {
        router.push("/main");
      }
    }, [user, authLoading, router]);
  }

  // 🔹 Email/Password Login
  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Skip email verification for admin user
      const isAdminUser = email.toLowerCase() === "admin@gmail.com";

      if (user.emailVerified || isAdminUser) {
        await handleUserProfile(user);
        router.push("/main");
      } else {
        setError("Please verify your email before logging in.");
      }
    } catch (error) {
      console.error("Login error:", error);
      setError(error instanceof Error ? error.message : "An unknown error occurred");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Helper: Create/Update Firestore User Profile
  const handleUserProfile = async (user: any) => {
    const registrationData = localStorage.getItem("registrationData");
    const { firstName = "", lastName = "", gender = "", phoneNumber = "" } = registrationData
      ? JSON.parse(registrationData)
      : {};

    const userDocRef = doc(firestore, "users", user.uid);
    const userDoc = await getDoc(userDocRef);

    const providerId = user.providerData[0]?.providerId || "email";
    const isGoogleSignIn = providerId === "google.com";
    const isFacebookSignIn = providerId === "facebook.com";

    if (!userDoc.exists()) {
      // For Google/Facebook sign-in, extract name from displayName or email
      let finalFirstName = firstName;
      let finalLastName = lastName;

      if ((isGoogleSignIn || isFacebookSignIn) && user.displayName) {
        const nameParts = user.displayName.split(" ");
        finalFirstName = nameParts[0] || "";
        finalLastName = nameParts.slice(1).join(" ") || "";
      }

      const profileData: any = {
        firstName: finalFirstName,
        lastName: finalLastName,
        gender: gender || "",
        email: user.email,
        provider: providerId,
        photoURL: user.photoURL || null,
        providers: [providerId],
      };
      
      // Include phone number if it exists
      if (phoneNumber) {
        profileData.phoneNumber = phoneNumber;
      }
      
      await setDoc(userDocRef, profileData);
    } else {
      // Update existing profile with social provider photo if signing in with Google/Facebook
      if ((isGoogleSignIn || isFacebookSignIn) && user.photoURL) {
        const existingData = userDoc.data();
        await setDoc(userDocRef, {
          ...existingData,
          photoURL: user.photoURL,
          providers: existingData.providers?.includes(providerId) 
            ? existingData.providers 
            : [...(existingData.providers || []), providerId],
        }, { merge: true });
      }
    }
  };

  // Note: Redirect result is now handled globally in AuthContext
  // This ensures it works regardless of which page the user lands on after redirect

  // 🔹 Google Sign-In - Fixed and Simplified
  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);

    try {
      // Validate auth is available
      if (!auth) {
        const errorMsg = 'Authentication service not available. Please refresh the page.';
        console.error('❌', errorMsg);
        setError(errorMsg);
        setLoading(false);
        return;
      }

      console.log('🔵 Starting Google Sign-In...');
      console.log('  - Auth Domain:', auth.app?.options?.authDomain || 'Not set');
      console.log('  - Current Origin:', window.location.origin);
      console.log('  - Current Hostname:', window.location.hostname);

      // Configure Google provider
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      provider.addScope('profile');
      provider.addScope('email');
      
      // Try popup first (works better in most cases)
      try {
        console.log('  - Attempting popup sign-in...');
        const userCredential = await signInWithPopup(auth, provider);
        const user = userCredential.user;
        
        console.log('✅ Google sign-in successful via popup!');
        console.log('  - User ID:', user.uid);
        console.log('  - Email:', user.email);
        
        // Handle user profile
        await handleUserProfile(user);
        
        // Navigate to main page
        window.location.href = "/main";
        return;
      } catch (popupError: any) {
        console.log('  - Popup failed, trying redirect...');
        console.log('  - Popup error:', popupError.code, popupError.message);
        
        // If popup is blocked or fails, use redirect
        if (popupError.code === 'auth/popup-blocked' || 
            popupError.code === 'auth/popup-closed-by-user' ||
            popupError.code === 'auth/cancelled-popup-request') {
          
          console.log('  - Using redirect flow instead...');
          
          // Store redirect info
          sessionStorage.setItem('authRedirectInProgress', 'true');
          sessionStorage.setItem('authRedirectProvider', 'google');
          sessionStorage.setItem('authRedirectTimestamp', Date.now().toString());
          sessionStorage.setItem('authRedirectOrigin', window.location.origin);
          sessionStorage.setItem('authRedirectPath', window.location.pathname);
          
          // Use redirect
          await signInWithRedirect(auth, provider);
          // Page will redirect - AuthContext will handle the result
          return;
        }
        
        // If it's a different error, throw it
        throw popupError;
      }
      
    } catch (error: any) {
      // Clean up on error
      sessionStorage.removeItem('authRedirectInProgress');
      sessionStorage.removeItem('authRedirectProvider');
      sessionStorage.removeItem('authRedirectTimestamp');
      sessionStorage.removeItem('authRedirectOrigin');
      sessionStorage.removeItem('authRedirectPath');
      
      console.error("❌ Google sign-in error:", error);
      console.error("  - Error code:", error.code);
      console.error("  - Error message:", error.message);
      
      // Handle specific error codes
      const errorMessage = error?.message || String(error) || 'Unknown error';
      const errorCode = error?.code || '';
      
      if (errorCode === "auth/popup-closed-by-user") {
        setError("Sign-in was cancelled. Please try again.");
      } else if (errorCode === "auth/unauthorized-domain" || errorMessage.includes('origins don\'t match')) {
        const currentDomain = window.location.hostname;
        const fixMessage = 
          `Domain "${currentDomain}" is not authorized.\n\n` +
          `To fix:\n` +
          `1. Go to Firebase Console > Authentication > Settings\n` +
          `2. Add "${currentDomain}", "localhost", and "127.0.0.1" to Authorized domains\n` +
          `3. Restart dev server and clear cache\n\n` +
          `See QUICK_FIX_GOOGLE_LOGIN.md for details.`;
        setError(fixMessage);
      } else if (errorCode === "auth/operation-not-allowed") {
        setError("Google sign-in is not enabled. Please enable it in Firebase Console > Authentication > Sign-in method.");
      } else if (errorCode === "auth/account-exists-with-different-credential") {
        setError("An account already exists with this email. Please use a different sign-in method.");
      } else {
        setError(errorMessage || "Failed to sign in with Google. Please try again.");
      }
      setLoading(false);
    }
  };

  // 🔹 Facebook Sign-In
  const handleFacebookSignIn = async () => {
    console.log('🔵 Facebook Sign-In button clicked');
    console.log('  - isPWA:', isPWA);
    
    setError(null);
    setLoading(true);

    try {
      const provider = new FacebookAuthProvider();
      provider.addScope('email');
      provider.addScope('public_profile');
      
      // Recheck PWA status at click time
      const currentIsPWA = checkIsPWA();
      
      // Always try redirect first in PWA mode
      if (currentIsPWA) {
        console.log('🚀 PWA Mode: Using redirect flow for Facebook');
        sessionStorage.setItem('authRedirectInProgress', 'true');
        await signInWithRedirect(auth, provider);
        return;
      } else {
        try {
          const userCredential = await signInWithPopup(auth, provider);
          const user = userCredential.user;
          await handleUserProfile(user);
          router.push("/main");
        } catch (popupError: any) {
          if (popupError.code === 'auth/popup-blocked' || popupError.code === 'auth/popup-closed-by-user') {
            console.log('🔄 Falling back to redirect flow');
            sessionStorage.setItem('authRedirectInProgress', 'true');
            await signInWithRedirect(auth, provider);
            return;
          }
          throw popupError;
        }
      }
    } catch (error: any) {
      console.error("Facebook sign-in error:", error);
      console.error("Error code:", error.code);
      console.error("Current origin:", typeof window !== 'undefined' ? window.location.origin : 'N/A');
      
      if (error.code === "auth/popup-closed-by-user") {
        setError("Sign-in was cancelled.");
      } else if (error.code === "auth/unauthorized-domain") {
        const currentDomain = typeof window !== 'undefined' ? window.location.hostname : 'unknown';
        setError(`Domain not authorized. Please add "${currentDomain}" to Firebase Console > Authentication > Settings > Authorized domains. See FIREBASE_PWA_SETUP.md for instructions.`);
      } else if (error.code === "auth/account-exists-with-different-credential") {
        setError("An account already exists with this email. Please use a different sign-in method.");
      } else {
        setError(error.message || "Failed to sign in with Facebook.");
      }
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-white">
      <div className="w-full max-w-md bg-white p-6">
        {/* Header */}
        <div className="relative flex items-center justify-center mb-8">
          <button
            type="button"
            className="absolute left-0 text-xl text-gray-700 hover:text-gray-900"
            onClick={() => window.history.back()}
          >
            <IoArrowBack />
          </button>
          <h2 className="text-2xl font-semibold text-gray-900">Login</h2>
        </div>

        {/* Social Login Buttons */}
        <div className="space-y-3 mb-6">
          {/* Google Sign-In Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className={`w-full flex items-center justify-center gap-3 bg-black text-white py-3.5 rounded-lg hover:bg-gray-800 transition font-medium ${
              loading ? "opacity-70 cursor-not-allowed" : ""
            }`}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span>Login with Google</span>
          </button>

          {/* Facebook Sign-In Button */}
          <button
            type="button"
            onClick={handleFacebookSignIn}
            disabled={loading}
            className={`w-full flex items-center justify-center gap-3 bg-black text-white py-3.5 rounded-lg hover:bg-gray-800 transition font-medium ${
              loading ? "opacity-70 cursor-not-allowed" : ""
            }`}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#1877F2"
                d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
              />
            </svg>
            <span>Login with Facebook</span>
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center my-6">
          <div className="flex-1 border-t border-gray-300"></div>
          <span className="px-4 text-sm text-gray-500">Or login with email</span>
          <div className="flex-1 border-t border-gray-300"></div>
        </div>

        {/* Email/Password Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          {/* Error Message */}
          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Email</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          {/* Password Input */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <AiOutlineEye className="text-xl" />
                ) : (
                  <AiOutlineEyeInvisible className="text-xl" />
                )}
              </button>
            </div>
          </div>

          {/* Forgot Password */}
          <div className="text-sm text-gray-500 cursor-pointer hover:underline text-right"
             onClick={() => router.push("/auth/forgot")}>
            Forgot Password?
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full bg-blue-500 text-white py-3.5 rounded-lg hover:bg-blue-600 transition font-medium ${
              loading ? "opacity-70 cursor-not-allowed" : ""
            }`}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        {/* Register Link */}
        <p className="text-center text-sm mt-6 text-gray-600">
          Don't have an account?{" "}
          <Link href="/auth/register" className="font-semibold text-gray-900 hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
