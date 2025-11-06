"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { FcGoogle } from "react-icons/fc";
import { FaFacebook } from "react-icons/fa";
import { IoArrowBack } from "react-icons/io5";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
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

  // Redirect if already logged in
  if (typeof window !== 'undefined') {
    React.useEffect(() => {
      if (!authLoading && user) {
        router.push("/main");
      }
    }, [user, authLoading]);
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

  // 🔹 Google Login
  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      if (!auth) {
        throw new Error("Firebase authentication not initialized");
      }
      
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      await handleUserProfile(user);
      router.push("/main");
    } catch (error: any) {
      console.error("Google login error:", error);
      
      // Handle specific error codes
      if (error.code === 'auth/popup-closed-by-user') {
        setError("Sign-in cancelled. Please try again.");
      } else if (error.code === 'auth/popup-blocked') {
        setError("Popup blocked. Please allow popups for this site.");
      } else if (error.code === 'auth/cancelled-popup-request') {
        // User opened multiple popups, ignore this error
        setError(null);
      } else {
        setError(error.message || "Failed to login with Google");
      }
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Facebook Login
  const handleFacebookLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      if (!auth) {
        throw new Error("Firebase authentication not initialized");
      }
      
      const provider = new FacebookAuthProvider();
      provider.setCustomParameters({
        display: 'popup'
      });
      
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      await handleUserProfile(user);
      router.push("/main");
    } catch (error: any) {
      console.error("Facebook login error:", error);
      
      // Handle specific error codes
      if (error.code === 'auth/popup-closed-by-user') {
        setError("Sign-in cancelled. Please try again.");
      } else if (error.code === 'auth/popup-blocked') {
        setError("Popup blocked. Please allow popups for this site.");
      } else if (error.code === 'auth/account-exists-with-different-credential') {
        setError("An account with this email already exists with a different sign-in method.");
      } else {
        setError(error.message || "Failed to login with Facebook");
      }
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Helper: Create/Update Firestore User Profile
  const handleUserProfile = async (user: any) => {
    const registrationData = localStorage.getItem("registrationData");
    const { firstName = "", lastName = "", gender = "" } = registrationData
      ? JSON.parse(registrationData)
      : {};

    const userDocRef = doc(firestore, "users", user.uid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      await setDoc(userDocRef, {
        firstName,
        lastName,
        gender,
        email: user.email,
        provider: user.providerData[0]?.providerId || "email",
      });
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-[380px] bg-white p-6 rounded-2xl shadow-md">
        {/* Header */}
        <div className="relative flex items-center justify-center mb-6">
          <button
            type="button"
            className="absolute left-0 text-xl"
            onClick={() => window.history.back()}
          >
            <IoArrowBack />
          </button>
          <h2 className="text-2xl font-semibold">Login</h2>
        </div>

        {/* Google Login */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="flex items-center justify-center w-full gap-2 bg-black text-white py-3 rounded-lg mb-3 hover:opacity-90 disabled:opacity-70"
        >
          <FcGoogle className="text-xl" />
          Login with Google
        </button>

        {/* Facebook Login */}
        <button
          type="button"
          onClick={handleFacebookLogin}
          disabled={loading}
          className="flex items-center justify-center w-full gap-2 bg-black text-white py-3 rounded-lg mb-6 hover:opacity-90 disabled:opacity-70"
        >
          <FaFacebook className="text-blue-500 text-xl" />
          Login with Facebook
        </button>

        {/* Divider */}
        <div className="flex items-center mb-6">
          <hr className="flex-grow border-gray-300" />
          <span className="mx-2 text-sm text-gray-500">Or login with email</span>
          <hr className="flex-grow border-gray-300" />
        </div>

        {/* Email/Password Login Form */}
        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          {/* Password Input */}
          <div className="mb-2">
            <label className="block text-sm font-medium mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-400"
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

          {/* Error Message */}
          {error && <p className="text-red-500 text-sm mb-2">{error}</p>}

          {/* Forgot Password */}
          <div className="text-sm text-gray-500 mb-4 cursor-pointer hover:underline"
             onClick={() => router.push("/auth/forgot")}>
            Forgot Password?
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 mb-4 ${
              loading ? "opacity-70 cursor-not-allowed" : ""
            }`}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        {/* Register Link */}
        <p className="text-center text-sm">
          Don’t have an account?{" "}
          <Link href="/auth/register" className="font-semibold text-blue-500 hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
