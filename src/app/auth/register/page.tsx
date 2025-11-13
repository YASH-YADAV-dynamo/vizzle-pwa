"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { IoArrowBack } from "react-icons/io5";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithPopup,
  GoogleAuthProvider,
  FacebookAuthProvider,
} from "firebase/auth";
import { auth, firestore } from "@/firebase/firebase";
import { doc, setDoc } from "firebase/firestore";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [gender, setGender] = useState("");
  const [email, setEmail] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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

  // 🔹 Helper: Create/Update Firestore User Profile for Social Login
  const handleSocialUserProfile = async (user: any, providerId: string) => {
    const userDocRef = doc(firestore, "users", user.uid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      // Extract name from displayName for social providers
      let finalFirstName = "";
      let finalLastName = "";

      if (user.displayName) {
        const nameParts = user.displayName.split(" ");
        finalFirstName = nameParts[0] || "";
        finalLastName = nameParts.slice(1).join(" ") || "";
      }

      const profileData: any = {
        firstName: finalFirstName,
        lastName: finalLastName,
        gender: "",
        email: user.email,
        provider: providerId,
        photoURL: user.photoURL || null,
        providers: [providerId],
      };

      await setDoc(userDocRef, profileData);
    } else {
      // Update existing profile with social provider data
      const existingData = userDoc.data();
      await setDoc(userDocRef, {
        ...existingData,
        photoURL: user.photoURL || existingData.photoURL,
        providers: existingData.providers?.includes(providerId)
          ? existingData.providers
          : [...(existingData.providers || []), providerId],
      }, { merge: true });
    }
  };

  // 🔹 Google Registration
  const handleGoogleRegister = async () => {
    setError(null);
    setLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;

      await handleSocialUserProfile(user, "google.com");
      router.push("/main");
    } catch (error: any) {
      console.error("Google registration error:", error);
      if (error.code === "auth/popup-closed-by-user") {
        setError("Registration was cancelled.");
      } else if (error.code === "auth/account-exists-with-different-credential") {
        setError("An account already exists with this email. Please login instead.");
      } else {
        setError(error.message || "Failed to register with Google.");
      }
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Facebook Registration
  const handleFacebookRegister = async () => {
    setError(null);
    setLoading(true);

    try {
      const provider = new FacebookAuthProvider();
      provider.addScope('email');
      provider.addScope('public_profile');
      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;

      await handleSocialUserProfile(user, "facebook.com");
      router.push("/main");
    } catch (error: any) {
      console.error("Facebook registration error:", error);
      if (error.code === "auth/popup-closed-by-user") {
        setError("Registration was cancelled.");
      } else if (error.code === "auth/account-exists-with-different-credential") {
        setError("An account already exists with this email. Please login instead.");
      } else {
        setError(error.message || "Failed to register with Facebook.");
      }
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Handle Email Registration
  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    if (!phoneNumber.trim()) {
      setError("Phone number is required!");
      return;
    }

    // Validate phone number (should be 10 digits for Indian numbers)
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(phoneNumber.trim())) {
      setError("Please enter a valid 10-digit phone number!");
      return;
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Combine country code and phone number
      const fullPhoneNumber = `${countryCode} ${phoneNumber.trim()}`;

      // Save data to Firestore
      await setDoc(doc(firestore, "users", user.uid), {
        firstName,
        lastName,
        gender,
        email,
        phoneNumber: fullPhoneNumber,
        providers: ["password"],
      });

      // Save user data temporarily (for login use)
      localStorage.setItem("registrationData", JSON.stringify({ firstName, lastName, gender, phoneNumber: fullPhoneNumber }));

      // Skip email verification for admin user
      const isAdminUser = email.toLowerCase() === "admin@gmail.com";

      if (!isAdminUser) {
        await sendEmailVerification(user);
        alert("Verification email sent! Please verify before logging in.");
      } else {
        alert("Admin account created! You can now login directly.");
      }
      
      router.push("/auth/login");
    } catch (error) {
      console.error("Register error:", error);
      if (error instanceof Error) setError(error.message);
      else setError("An unknown error occurred");
    } finally {
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
          <h2 className="text-2xl font-semibold text-gray-900">Register</h2>
        </div>

        {/* Social Registration Buttons */}
        <div className="space-y-3 mb-6">
          {/* Google Register Button */}
          <button
            type="button"
            onClick={handleGoogleRegister}
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
            <span>Register with Google</span>
          </button>

          {/* Facebook Register Button */}
          <button
            type="button"
            onClick={handleFacebookRegister}
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
            <span>Register with Facebook</span>
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center my-6">
          <div className="flex-1 border-t border-gray-300"></div>
          <span className="px-4 text-sm text-gray-500">Or register with email</span>
          <div className="flex-1 border-t border-gray-300"></div>
        </div>

        {/* Email Registration Form */}
        <form onSubmit={handleRegister} className="space-y-4">
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

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Confirm Password</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <AiOutlineEye className="text-xl" />
                ) : (
                  <AiOutlineEyeInvisible className="text-xl" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full bg-blue-500 text-white py-3.5 rounded-lg hover:bg-blue-600 transition font-medium ${
              loading ? "opacity-70 cursor-not-allowed" : ""
            }`}
          >
            {loading ? "Registering..." : "Register"}
          </button>
        </form>

        <p className="text-center text-sm mt-6 text-gray-600">
          Have an account?{" "}
          <Link href="/auth/login" className="font-semibold text-gray-900 hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
