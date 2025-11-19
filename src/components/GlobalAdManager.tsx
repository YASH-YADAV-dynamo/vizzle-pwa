"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useTimedAds } from "@/hooks/useTimedAds";
import InterstitialAd from "./InterstitialAd";

export default function GlobalAdManager() {
  const pathname = usePathname();
  const [showAd, setShowAd] = useState(false);
  const interstitialSlot = process.env.NEXT_PUBLIC_ADSENSE_INTERSTITIAL_SLOT || "";

  // Enable timed ads on main app pages (not auth pages)
  const isMainPage = pathname?.startsWith("/main");
  const enabled = isMainPage && !!interstitialSlot;

  const { shouldShowAd, resetAd } = useTimedAds({
    intervalSeconds: 10,
    enabled,
    onAdTrigger: () => {
      setShowAd(true);
    },
  });

  // Sync state with hook
  useEffect(() => {
    if (shouldShowAd) {
      setShowAd(true);
    }
  }, [shouldShowAd]);

  const handleClose = () => {
    setShowAd(false);
    resetAd();
  };

  if (!enabled) return null;

  return (
    <InterstitialAd
      adSlot={interstitialSlot}
      isOpen={showAd}
      onClose={handleClose}
      showCloseButton={true}
      closeDelay={5}
    />
  );
}

