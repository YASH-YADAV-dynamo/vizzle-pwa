"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";

export default function OnboardingPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Mark component as mounted (client-side only)
    setMounted(true);

    // Wait for auth to load, then show onboarding
    if (!loading && typeof window !== "undefined") {
      // If user is logged in, skip onboarding and go to main
      if (user) {
        router.push("/main");
        return;
      }
      
      // Check if onboarding has been shown before
      const hasSeenOnboarding = sessionStorage.getItem("onboardingShown");
      if (hasSeenOnboarding) {
        router.push("/auth/option");
        return;
      }

      // Show onboarding with animation
      setTimeout(() => setIsVisible(true), 100);
    }
  }, [user, loading, router]);

  const handleGetStarted = () => {
    // Mark onboarding as shown (only on client)
    if (typeof window !== "undefined") {
      sessionStorage.setItem("onboardingShown", "true");
    }
    // Navigate to auth option page
    router.push("/auth/option");
  };

  // Don't render until mounted or if user is logged in or still loading
  if (!mounted || loading || user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white flex flex-col overflow-hidden">
      {/* Top Section - Illustration */}
      <div
        className={`flex-1 flex items-center justify-center bg-gradient-to-b from-blue-50 to-white transition-all duration-1000 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
        }`}
      >
        <div className="relative w-full h-full max-w-md flex items-center justify-center p-8">
          <div
            className={`relative w-full aspect-[3/4] transition-all duration-1000 delay-300 ${
              imageLoaded
                ? "opacity-100 scale-100"
                : "opacity-0 scale-95"
            }`}
          >
            <Image
              src="/start.png"
              alt="Vizzle AR Shopping"
              fill
              className="object-contain"
              priority
              onLoad={() => setImageLoaded(true)}
            />
          </div>
        </div>
      </div>

      {/* Bottom Section - Text and CTA */}
      <div
        className={`bg-white rounded-t-3xl shadow-2xl px-6 py-8 transition-all duration-1000 delay-500 ${
          isVisible
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-10"
        }`}
      >
        <div className="max-w-md mx-auto text-center space-y-4">
          {/* Heading */}
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 animate-fade-in-up">
            Discover Your Perfect Look with Vizzle AR! 🎉
          </h1>

          {/* Description */}
          <p className="text-gray-600 text-base md:text-lg animate-fade-in-up-delay">
            Welcome to Vizzle! See how every outfit fits you, all with the power of AR.
          </p>

          {/* Get Started Button */}
          <button
            onClick={handleGetStarted}
            className="w-full mt-6 bg-black text-white py-4 px-6 rounded-xl font-semibold text-lg hover:bg-gray-800 transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg animate-fade-in-up-delay-2"
          >
            Get Started
          </button>
        </div>
      </div>
    </div>
  );
}

