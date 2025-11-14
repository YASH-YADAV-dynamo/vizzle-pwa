"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import {
  signInWithPopup,
  signInWithRedirect,
  GoogleAuthProvider,
} from "firebase/auth";
import { auth, firestore } from "@/firebase/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

export default function AuthPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [googleLoading, setGoogleLoading] = useState(false);

  // Handle Google Sign-In
  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      if (!auth) {
        alert('Authentication service not available. Please refresh the page.');
        setGoogleLoading(false);
        return;
      }

      console.log('🔵 Starting Google Sign-In...');

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
        
        // Create/update user profile
        const userDocRef = doc(firestore, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (!userDoc.exists()) {
          const nameParts = user.displayName?.split(" ") || [];
          await setDoc(userDocRef, {
            firstName: nameParts[0] || "",
            lastName: nameParts.slice(1).join(" ") || "",
            gender: "",
            email: user.email,
            provider: "google.com",
            photoURL: user.photoURL || null,
            providers: ["google.com"],
          });
        }
        
        window.location.href = "/main";
        return;
      } catch (popupError: any) {
        console.log('  - Popup failed, trying redirect...');
        
        // If popup is blocked or fails, use redirect
        if (popupError.code === 'auth/popup-blocked' || 
            popupError.code === 'auth/popup-closed-by-user' ||
            popupError.code === 'auth/cancelled-popup-request') {
          
          console.log('  - Using redirect flow instead...');
          
          sessionStorage.setItem('authRedirectInProgress', 'true');
          sessionStorage.setItem('authRedirectProvider', 'google');
          sessionStorage.setItem('authRedirectTimestamp', Date.now().toString());
          sessionStorage.setItem('authRedirectOrigin', window.location.origin);
          sessionStorage.setItem('authRedirectPath', window.location.pathname);
          
          await signInWithRedirect(auth, provider);
          return;
        }
        throw popupError;
      }
    } catch (error: any) {
      console.error("❌ Google sign-in error:", error);
      alert(error.message || "Failed to sign in with Google. Please try again.");
      setGoogleLoading(false);
    }
  };

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) {
      router.push("/main");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (user) {
    return null; // Will redirect
  }

  return (
    <div className="relative min-h-screen bg-gray-100 overflow-hidden">
      {/* Background Image - 60% */}
      <div className="relative w-full h-[60vh] flex items-center justify-center">
        <Image
          src="/Shopping.png"
          alt="Shopping Illustration"
          fill
          className="object-contain"
          priority
        />
      </div>

      {/* Card - 40% */}
      <div className="absolute bottom-0 w-full h-[40vh] bg-white rounded-t-3xl shadow-lg z-10 px-6 py-8 text-center flex flex-col justify-center">
        <h2 className="text-[28px] font-semibold leading-none mb-3">
          Start Styling Now ✨
        </h2>

        <p className="text-[18px] font-normal text-gray-600 leading-none mb-8">
          Take your first step towards a new look with Vizzle&apos;s AR experience today!
        </p>

        <div className="flex justify-center gap-3 mb-4">
          <button
            onClick={() => router.push("/auth/login")}
            className="bg-black text-white text-[20px] font-semibold px-6 py-2 rounded-lg hover:bg-gray-800 transition"
          >
            Login
          </button>

          <button
            onClick={() => router.push("/auth/register")}
            className="bg-black text-white text-[20px] font-semibold px-6 py-2 rounded-lg hover:bg-gray-800 transition"
          >
            Register
          </button>
        </div>

        
      </div>
    </div>
  );
}
