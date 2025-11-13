// app/(main)/layout.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Footer from "@/components/footer";
import ProtectedRoute from "@/components/ProtectedRoute";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  useEffect(() => {
    // Track app usage time
    const appStartTime = localStorage.getItem("appStartTime");
    const hasShownFeedback = localStorage.getItem("hasShown5MinFeedback");
    
    if (!appStartTime) {
      // First time in app, set start time
      localStorage.setItem("appStartTime", Date.now().toString());
      return;
    }

    if (hasShownFeedback === "true") {
      // Already shown feedback, don't show again
      return;
    }

    const timeSinceStart = Date.now() - parseInt(appStartTime);
    const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds

    if (timeSinceStart >= fiveMinutes) {
      // Show feedback modal if 5 minutes have passed
      setShowFeedbackModal(true);
      localStorage.setItem("hasShown5MinFeedback", "true");
    } else {
      // Set timer to show feedback modal after remaining time
      const remainingTime = fiveMinutes - timeSinceStart;
      const timer = setTimeout(() => {
        setShowFeedbackModal(true);
        localStorage.setItem("hasShown5MinFeedback", "true");
      }, remainingTime);

      return () => clearTimeout(timer);
    }
  }, [pathname]);

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col">
        <main className="flex-1">{children}</main>
        <Footer />
      </div>

      {/* PWA Install Prompt */}
      <PWAInstallPrompt />

      {/* Global Feedback Modal - Shown after 5 minutes of app usage */}
      {showFeedbackModal && (
        <div className="fixed inset-0 flex justify-center items-center bg-black/40 z-[100] p-4">
          <div className="bg-white shadow-2xl rounded-2xl p-6 w-full max-w-md text-center animate-in fade-in duration-300">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              Give us your feedback 💬
            </h3>
            <p className="text-gray-600 text-sm mb-5">
              Your opinion helps us improve your virtual try-on experience.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowFeedbackModal(false);
                  // Navigate to feedback page
                  router.push("/main/profile/rate");
                }}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition"
              >
                Give Feedback
              </button>
              <button
                onClick={() => {
                  setShowFeedbackModal(false);
                }}
                className="flex-1 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-medium transition"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}
