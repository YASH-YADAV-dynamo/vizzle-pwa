"use client";

import { useEffect, useRef, useState } from "react";

interface UseTimedAdsOptions {
  intervalSeconds?: number;
  enabled?: boolean;
  onAdTrigger?: () => void;
}

export function useTimedAds({
  intervalSeconds = 10,
  enabled = true,
  onAdTrigger,
}: UseTimedAdsOptions = {}) {
  const [shouldShowAd, setShouldShowAd] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastAdTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Start interval timer
    intervalRef.current = setInterval(() => {
      const now = Date.now();
      const timeSinceLastAd = now - lastAdTimeRef.current;

      // Only trigger if enough time has passed (prevent spam)
      if (timeSinceLastAd >= intervalSeconds * 1000) {
        lastAdTimeRef.current = now;
        setShouldShowAd(true);
        if (onAdTrigger) {
          onAdTrigger();
        }
      }
    }, intervalSeconds * 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, intervalSeconds, onAdTrigger]);

  const resetAd = () => {
    setShouldShowAd(false);
  };

  const pause = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const resume = () => {
    if (enabled && !intervalRef.current) {
      intervalRef.current = setInterval(() => {
        const now = Date.now();
        const timeSinceLastAd = now - lastAdTimeRef.current;

        if (timeSinceLastAd >= intervalSeconds * 1000) {
          lastAdTimeRef.current = now;
          setShouldShowAd(true);
          if (onAdTrigger) {
            onAdTrigger();
          }
        }
      }, intervalSeconds * 1000);
    }
  };

  return {
    shouldShowAd,
    resetAd,
    pause,
    resume,
  };
}

