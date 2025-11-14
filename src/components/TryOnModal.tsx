"use client";

import { useState, useEffect } from "react";
import { X, Loader2, Sparkles } from "lucide-react";
import { VizzleAPI } from "@/lib/api/vizzle-api";
import { toast } from "react-hot-toast";
import { useAuth } from "@/contexts/AuthContext";
import { saveTryOnHistory } from "@/lib/firebase/userActivity";

interface TryOnModalProps {
  isOpen: boolean;
  onClose: () => void;
  humanImage: string; // Base64 or URL
  garmentImage: string; // URL from product
  garmentName: string;
  onSuccess?: (resultUrl: string) => void;
}

export default function TryOnModal({
  isOpen,
  onClose,
  humanImage,
  garmentImage,
  garmentName,
  onSuccess,
}: TryOnModalProps) {
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    if (isOpen) {
      // Reset state when modal opens
      setIsProcessing(false);
      setProgress(0);
      setStatusMessage("");
      // Start try-on process
      handleTryOn();
    }
  }, [isOpen]);

  const handleTryOn = async () => {
    setIsProcessing(true);
    setProgress(10);
    setStatusMessage("Uploading your photo...");

    try {
      // Convert base64 to File if needed
      let humanFile: File;
      if (humanImage.startsWith("data:")) {
        const response = await fetch(humanImage);
        const blob = await response.blob();
        humanFile = new File([blob], "human.jpg", { type: "image/jpeg" });
      } else {
        // If URL, fetch it
        const response = await fetch(humanImage);
        const blob = await response.blob();
        humanFile = new File([blob], "human.jpg", { type: "image/jpeg" });
      }

      // Upload human image
      const humanUploadResponse = await VizzleAPI.uploadHumanImage(humanFile);
      setProgress(30);
      setStatusMessage("Uploading garment...");

      // Download garment from URL and upload
      const garmentResponse = await fetch(garmentImage);
      const garmentBlob = await garmentResponse.blob();
      const garmentFile = new File([garmentBlob], "garment.jpg", {
        type: "image/jpeg",
      });

      const garmentUploadResponse = await VizzleAPI.uploadGarmentImage(garmentFile);
      setProgress(50);
      setStatusMessage("Creating your virtual try-on...");

      // Perform virtual try-on
      const tryOnResponse = await VizzleAPI.performVirtualTryOn({
        human_img: humanUploadResponse.url,
        garm_img: garmentUploadResponse.url,
        garment_type: "auto_detect",
        use_vision: true,
        params: {
          category: "upper_body",
          crop: false,
          force_dc: false,
          mask_only: false,
          steps: 20,
          seed: 42,
        },
      });

      setProgress(70);
      setStatusMessage("Processing... This may take 30-60 seconds");

      // Wait for completion
      const result = await VizzleAPI.waitForVirtualTryOn(tryOnResponse.id);

      if (result.status === "succeeded" && result.output) {
        const outputUrl = Array.isArray(result.output)
          ? result.output[0]
          : result.output;
        
        setProgress(100);
        setStatusMessage("Complete!");
        
        // Save to Firebase if user is logged in (in background, don't wait)
        if (user) {
          saveTryOnHistory(user.uid, {
            humanImage: humanUploadResponse.url,
            garmentImage: garmentUploadResponse.url,
            resultImage: outputUrl as string,
            garmentName,
            garmentType: "auto_detect",
          }).catch((error) => {
            console.error("Failed to save history:", error);
            // Don't show error to user, just log it
          });
        }
        
        // Immediately call onSuccess to navigate to result page
        // Don't show result in modal - go directly to result page
        // Small delay to ensure progress shows 100% before navigation
        setTimeout(() => {
          if (onSuccess) {
            onSuccess(outputUrl as string);
          }
        }, 300);
      } else if (result.status === "failed") {
        throw new Error(result.error || "Try-on failed");
      }
    } catch (error) {
      console.error("Try-on error:", error);
      toast.error(error instanceof Error ? error.message : "Try-on failed");
      setStatusMessage("Failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Removed unused functions: handleDownload, handleShare, handleGenerateVideo, handleDownloadVideo
  // These are now handled on the result page, not in the modal

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-500" />
            Virtual Try-On
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Processing State */}
          {isProcessing && (
            <div className="flex flex-col items-center justify-center py-10">
              <div className="relative">
                <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-semibold text-blue-600">
                    {progress}%
                  </span>
                </div>
              </div>
              <p className="mt-4 text-gray-600 text-center">{statusMessage}</p>
              <div className="w-full max-w-xs mt-4 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Result State - Removed: Result is now shown directly on result page, not in modal */}
          {/* Modal automatically closes and navigates when result is ready */}

          {/* Error State */}
          {!isProcessing && statusMessage.includes("Failed") && (
            <div className="flex flex-col items-center justify-center py-10">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <X className="w-8 h-8 text-red-500" />
              </div>
              <p className="text-gray-600 text-center mb-4">{statusMessage}</p>
              <button
                onClick={() => {
                  setStatusMessage("");
                  handleTryOn();
                }}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Feedback Modal removed - handled on result page */}
    </div>
  );
}

