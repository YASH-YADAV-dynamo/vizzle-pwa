"use client";

import { useEffect, useRef } from "react";

interface AdSenseProps {
  adSlot: string;
  adFormat?: "auto" | "rectangle" | "vertical" | "horizontal";
  style?: React.CSSProperties;
  className?: string;
  fullWidthResponsive?: boolean;
}

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

export default function AdSense({
  adSlot,
  adFormat = "auto",
  style,
  className = "",
  fullWidthResponsive = true,
}: AdSenseProps) {
  const adRef = useRef<HTMLDivElement>(null);
  const insRef = useRef<HTMLElement | null>(null);
  const pushedRef = useRef(false);

  useEffect(() => {
    // Don't render if publisher ID is not set
    const adsensePublisherId = process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID;
    if (!adsensePublisherId || !adSlot) {
      return;
    }

    // Wait for AdSense script to load and DOM to be ready
    const initializeAd = () => {
      if (
        typeof window === "undefined" ||
        !window.adsbygoogle ||
        pushedRef.current ||
        !adRef.current
      ) {
        return;
      }

      // Find the ins element
      const insElement = adRef.current.querySelector('.adsbygoogle') as HTMLElement;
      if (!insElement) {
        return;
      }

      // Check if ad has already been initialized (has data-adsbygoogle-status attribute)
      if (insElement.getAttribute('data-adsbygoogle-status')) {
        return;
      }

      try {
        pushedRef.current = true;
        insRef.current = insElement;
        window.adsbygoogle.push({});
      } catch (error) {
        console.error("AdSense error:", error);
        pushedRef.current = false; // Reset on error to allow retry
      }
    };

    // Try to initialize immediately
    initializeAd();

    // If AdSense script hasn't loaded yet, wait for it
    if (typeof window !== "undefined" && !window.adsbygoogle) {
      const checkInterval = setInterval(() => {
        if (window.adsbygoogle) {
          clearInterval(checkInterval);
          initializeAd();
        }
      }, 100);

      // Cleanup after 10 seconds
      setTimeout(() => clearInterval(checkInterval), 10000);

      return () => clearInterval(checkInterval);
    }
  }, [adSlot, adFormat]);

  // Don't render if publisher ID or ad slot is not set
  const adsensePublisherId = process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID;
  if (!adsensePublisherId || !adSlot) {
    return null;
  }

  return (
    <div
      ref={adRef}
      className={`adsense-container ${className}`}
      style={style}
    >
      <ins
        className="adsbygoogle"
        style={{
          display: "block",
          ...(fullWidthResponsive && { width: "100%" }),
        }}
        data-ad-client={adsensePublisherId}
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-full-width-responsive={fullWidthResponsive ? "true" : "false"}
      />
    </div>
  );
}

