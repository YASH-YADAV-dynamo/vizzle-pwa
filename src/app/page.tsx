"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function HomePage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && typeof window !== "undefined") {
      // Check if onboarding has been shown (only on client)
      const hasSeenOnboarding = sessionStorage.getItem("onboardingShown");
      
      if (user) {
        // User is logged in, go to main
        router.push("/main");
      } else if (!hasSeenOnboarding) {
        // User not logged in and hasn't seen onboarding, show onboarding
        router.push("/onboarding");
      } else {
        // User has seen onboarding, go to auth
        router.push("/auth/option");
      }
    }
  }, [user, loading, router]);

  // Show loading while checking authentication
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading Vizzle...</p>
      </div>
    </div>
  );
}

