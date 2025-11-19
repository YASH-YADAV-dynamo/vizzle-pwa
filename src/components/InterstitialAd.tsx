"use client";

import { useEffect, useState, useRef } from "react";
import { X } from "lucide-react";

interface InterstitialAdProps {
  adSlot: string;
  isOpen: boolean;
  onClose: () => void;
  showCloseButton?: boolean;
  closeDelay?: number; // Delay in seconds before showing close button
}

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

export default function InterstitialAd({
  adSlot,
  isOpen,
  onClose,
  showCloseButton = true,
  closeDelay = 5,
}: InterstitialAdProps) {
  const [canClose, setCanClose] = useState(false);
  const [adLoaded, setAdLoaded] = useState(false);
  const [adKey, setAdKey] = useState(0);
  const adRef = useRef<HTMLDivElement>(null);
  const pushedRef = useRef(false);
  const closeTimerRef = useRef<NodeJS.Timeout | null>(null);

  const adsensePublisherId = process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID;

  useEffect(() => {
    if (!isOpen) {
      setCanClose(false);
      setAdLoaded(false);
      // Reset pushedRef when modal closes so new ad can be initialized next time
      pushedRef.current = false;
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
      }
      return;
    }

    // Reset state when ad opens and generate new key for fresh ad instance
    setCanClose(false);
    setAdLoaded(false);
    pushedRef.current = false; // Reset for new ad instance
    const newKey = Date.now();
    setAdKey(newKey); // Force new ad instance with unique key

    // Load ad only if not already pushed
    const initializeAd = () => {
      if (
        typeof window === "undefined" ||
        !window.adsbygoogle ||
        !adRef.current
      ) {
        return;
      }

      // Find the ins element
      const insElement = adRef.current.querySelector('.adsbygoogle') as HTMLElement;
      if (!insElement) {
        return;
      }

      // Check if ad has already been initialized (AdSense adds this attribute)
      if (insElement.getAttribute('data-adsbygoogle-status')) {
        setAdLoaded(true);
        return;
      }

      // Only push if we haven't pushed for this instance
      if (!pushedRef.current) {
        try {
          pushedRef.current = true;
          window.adsbygoogle.push({});
          setAdLoaded(true);
        } catch (error) {
          console.error("Interstitial ad error:", error);
          pushedRef.current = false; // Reset on error
          setAdLoaded(true); // Allow closing even if ad fails
        }
      }
    };

    // Delay to ensure DOM is updated with new key and React has rendered
    const initTimer = setTimeout(() => {
      initializeAd();
    }, 200);

    // If AdSense script hasn't loaded yet, wait for it
    if (typeof window !== "undefined" && !window.adsbygoogle) {
      const checkInterval = setInterval(() => {
        if (window.adsbygoogle) {
          clearInterval(checkInterval);
          initializeAd();
        }
      }, 100);

      setTimeout(() => clearInterval(checkInterval), 10000);
    }

    // Enable close button after delay
    if (showCloseButton) {
      closeTimerRef.current = setTimeout(() => {
        setCanClose(true);
      }, closeDelay * 1000);
    } else {
      setCanClose(true);
    }

    return () => {
      clearTimeout(initTimer);
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
      }
    };
  }, [isOpen, adSlot, showCloseButton, closeDelay]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center p-4">
      <div className="relative bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Close Button */}
        {showCloseButton && (
          <button
            onClick={onClose}
            disabled={!canClose}
            className={`absolute top-2 right-2 z-50 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-all ${
              canClose ? "opacity-100 cursor-pointer" : "opacity-30 cursor-not-allowed"
            }`}
            title={canClose ? "Close ad" : `Please wait ${closeDelay} seconds`}
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Ad Container */}
        <div
          ref={adRef}
          className="w-full min-h-[400px] flex items-center justify-center"
        >
          <ins
            key={adKey}
            className="adsbygoogle"
            style={{
              display: "block",
              width: "100%",
              minHeight: "400px",
            }}
            data-ad-client={adsensePublisherId}
            data-ad-slot={adSlot}
            data-ad-format="autorelaxed"
            data-full-width-responsive="true"
          />
        </div>

        {/* Loading State */}
        {!adLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading ad...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

