"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export default function SplashScreen() {
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Mark component as mounted (client-side only)
    setMounted(true);

    // Check if splash has been shown before (only on client)
    if (typeof window !== "undefined") {
      // Detect if running as PWA
      const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
      const isPWA = (window.navigator as any).standalone || isStandalone;
      
      // For PWA: Always show splash on app launch (every time app opens)
      // For Web: Show splash only once per session
      const hasShownSplash = sessionStorage.getItem("splashShown");
      
      // Only skip if it's web and splash was already shown
      if (hasShownSplash && !isPWA) {
        return;
      }

      // Mark splash as shown (for web, PWA doesn't need this check)
      if (!isPWA) {
        sessionStorage.setItem("splashShown", "true");
      }

      // Show splash screen immediately
      setShouldRender(true);
      setIsVisible(true);

      // Hide splash after 2 seconds
      const timer = setTimeout(() => {
        setIsVisible(false);
        // Remove from DOM after fade out animation
        setTimeout(() => setShouldRender(false), 500);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, []);

  // Don't render anything until mounted (prevents hydration mismatch)
  if (!mounted || !shouldRender) return null;

  return (
    <div
      className={`fixed inset-0 bg-white z-[9999] flex items-center justify-center transition-opacity duration-500 ${
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

