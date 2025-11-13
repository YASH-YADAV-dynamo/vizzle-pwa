"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";

export default function SplashPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  const handleRedirect = useCallback(() => {
    if (typeof window === "undefined") return;

    if (user) {
      // User is logged in, go to main
      router.push("/main");
    } else {
      // Check if onboarding has been shown
      const hasSeenOnboarding = sessionStorage.getItem("onboardingShown");
      
      if (!hasSeenOnboarding) {
        // User not logged in and hasn't seen onboarding, show onboarding
        router.push("/onboarding");
      } else {
        // User has seen onboarding, go to auth
        router.push("/auth/option");
      }
    }
  }, [user, router]);

  useEffect(() => {
    // Mark component as mounted (client-side only)
    setMounted(true);

    if (typeof window !== "undefined") {
      // Detect if running as PWA
      const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
      const isPWA = (window.navigator as any).standalone || isStandalone;
      
      // For PWA: Always show splash on app launch (every time app opens)
      // For Web: Show splash only once per session
      const hasShownSplash = sessionStorage.getItem("splashShown");
      
      // Only skip if it's web and splash was already shown
      if (hasShownSplash && !isPWA) {
        // Skip splash, go directly to next page
        handleRedirect();
        return;
      }

      // Mark splash as shown (for web, PWA doesn't need this check)
      if (!isPWA) {
        sessionStorage.setItem("splashShown", "true");
      }

      // Show splash screen immediately
      setIsVisible(true);

      // Hide splash after 4.5 seconds and redirect
      const timer = setTimeout(() => {
        setIsVisible(false);
        // Redirect after fade out animation
        setTimeout(() => {
          handleRedirect();
        }, 800);
      }, 4500);

      return () => clearTimeout(timer);
    }
  }, [loading, handleRedirect]);

  // Don't render anything until mounted (prevents hydration mismatch)
  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-300 mx-auto mb-4"></div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen bg-white flex items-center justify-center transition-opacity duration-1000 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
    >
      {/* Logo with magnifying animation */}
      <div className="animate-magnify">
        <Image
          src="/logo.png"
          alt="Vizzle Logo"
          width={200}
          height={80}
          className="object-contain"
          priority
        />
      </div>
    </div>
  );
}

