"use client";

import React, { useState, useEffect } from "react";
import { IoArrowBack, IoMail } from "react-icons/io5";
import toast, { Toaster } from "react-hot-toast";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/firebase/firebase";
import { useRouter } from "next/navigation";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const router = useRouter();

  // Check if auth is available
  useEffect(() => {
    if (!auth) {
      console.error("Firebase auth is not initialized");
      toast.error("Authentication service is not available. Please refresh the page.");
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validate email
    if (!email || !email.trim()) {
      toast.error("Please enter your email address");
      return;
    }

    const trimmedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      toast.error("Please enter a valid email address");
      return;
    }

    // Check if auth is available
    if (!auth) {
      toast.error("Authentication service is not available. Please refresh the page.");
      return;
    }

    setIsLoading(true);

    try {
      console.log("Sending password reset email to:", trimmedEmail);
      
      // Configure action code settings for better redirect handling
      const actionCodeSettings = {
        url: typeof window !== 'undefined' 
          ? `${window.location.origin}/auth/login`
          : 'http://localhost:3000/auth/login',
        handleCodeInApp: false,
      };

      // Send Firebase password reset email
      await sendPasswordResetEmail(auth, trimmedEmail, actionCodeSettings);
      
      console.log("Password reset email sent successfully");
      
      setIsLoading(false);
      setEmailSent(true);
      setShowToast(true);

      // Show custom success toast
      toast.custom(
        (t) => (
          <div className="fixed inset-0 z-50 flex items-start justify-center pointer-events-none">
            {/* Blurred backdrop */}
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm"></div>

            {/* Toast card */}
            <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-[320px] pointer-events-auto mt-64 animate-fadeIn">
              {/* Email Icon */}
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                  <div className="w-12 h-8 bg-blue-600 rounded flex items-center justify-center">
                    <IoMail className="w-4 h-4 text-white" />
                  </div>
                </div>
              </div>

              {/* Title */}
              <h2 className="text-lg font-semibold text-gray-900 text-center mb-3">
                Check Your Email!
              </h2>

              {/* Description */}
              <p className="text-gray-600 text-center mb-2 text-sm leading-relaxed">
                We've sent a password reset link to <strong>{trimmedEmail}</strong>. 
                Please check your inbox and click the link to reset your password. 
                The link is valid for 24 hours.
              </p>
              <p className="text-gray-500 text-center mb-6 text-xs italic">
                Please check spam folder also
              </p>

              {/* Buttons */}
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => {
                    // Open Gmail in a new tab
                    const gmailUrl = `https://mail.google.com/mail/u/0/#inbox`;
                    window.open(gmailUrl, '_blank', 'noopener,noreferrer');
                    
                    // Also try to open default mail client as fallback
                    setTimeout(() => {
                      try {
                        window.location.href = `mailto:${trimmedEmail}`;
                      } catch (e) {
                        // Ignore if mailto fails
                      }
                    }, 500);
                    
                    toast.dismiss(t.id);
                  }}
                  className="w-full bg-black text-white py-3 rounded-full font-medium hover:bg-gray-800 transition-colors duration-200"
                >
                  Open Gmail / Mail App
                </button>
                <button
                  onClick={() => {
                    toast.dismiss(t.id);
                    setShowToast(false);
                    router.push("/auth/login");
                  }}
                  className="w-full bg-gray-200 text-gray-800 py-3 rounded-full font-medium hover:bg-gray-300 transition-colors duration-200"
                >
                  Back to Login
                </button>
              </div>
            </div>
          </div>
        ),
        { duration: 10000 } // Show for 10 seconds
      );

      // Remove blur after toast disappears
      setTimeout(() => setShowToast(false), 10000);
    } catch (err: any) {
      console.error("Password reset error:", err);
      setIsLoading(false);
      setEmailSent(false);
      
      // Handle specific error codes
      let errorMessage = "Failed to send reset email. Please try again.";
      
      if (err?.code === "auth/user-not-found") {
        errorMessage = "No account found with this email address.";
      } else if (err?.code === "auth/invalid-email") {
        errorMessage = "Invalid email address. Please check and try again.";
      } else if (err?.code === "auth/too-many-requests") {
        errorMessage = "Too many requests. Please try again later.";
      } else if (err?.message) {
        errorMessage = err.message;
      }
      
      toast.error(errorMessage);
    }
  };

  return (
    <div className="relative">
      <Toaster /> {/* Toast container */}

      {/* Main content wrapper */}
      <div className={`${showToast ? "blur-sm" : ""} transition-all duration-300`}>
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
          <div className="w-[380px] h-[500px] bg-white p-6 rounded-2xl shadow-md flex flex-col justify-start pt-10">
            {/* Header */}
            <div className="relative flex items-center justify-center mb-6">
              <button
                type="button"
                className="absolute left-0 text-xl hover:text-blue-600 transition-colors"
                onClick={() => window.history.back()}
              >
                <IoArrowBack />
              </button>
              <h2 className="text-2xl font-semibold">Forgot Password</h2>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col flex-1">
              <div className="mb-4">
                <label htmlFor="email" className="block text-sm font-medium mb-1">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  disabled={isLoading}
                  required
                />
              </div>

              {emailSent ? (
                <div className="text-center">
                  <p className="text-green-600 mb-4 text-sm">
                    ✓ Password reset email sent! Check your inbox.
                  </p>
                  <button
                    type="button"
                    onClick={() => router.push("/auth/login")}
                    className="w-full bg-black text-white py-3 rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    Back to Login
                  </button>
                </div>
              ) : (
                <button
                  type="submit"
                  disabled={isLoading || !email.trim()}
                  className="w-full bg-black text-white py-3 rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Sending...
                    </div>
                  ) : (
                    "Send Reset Link"
                  )}
                </button>
              )}
            </form>
          </div>
        </div>
      </div>

      {/* Tailwind animation */}
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fadeIn {
            animation: fadeIn 0.3s ease-out forwards;
          }
        `}
      </style>
    </div>
  );
}
