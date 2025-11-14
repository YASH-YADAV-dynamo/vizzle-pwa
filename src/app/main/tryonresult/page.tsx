"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { Share2, Download, Video, Loader2, Sparkles } from "lucide-react";
import { FaWhatsapp, FaFacebook, FaInstagram, FaTwitter } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { VizzleAPI } from "@/lib/api/vizzle-api";

export default function TryOnResultPage() {
  const router = useRouter();
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [garmentName, setGarmentName] = useState<string>("Product");
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [buyLink, setBuyLink] = useState<string | null>(null);
  const [productImage, setProductImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    // Load try-on result from localStorage with proper state management
    const loadTryOnData = async () => {
      try {
        // Set loading state
        setIsLoading(true);
        
        // Minimum loading time of 1.5 seconds for smooth UX
        const minLoadTime = 1500;
        const startTime = Date.now();

        // Load data from localStorage with cache validation
        const savedResult = localStorage.getItem("tryonResult");
        const savedGarmentName = localStorage.getItem("tryonGarmentName");
        const savedBuyLink = localStorage.getItem("tryonBuyLink");
        const savedProductImage = localStorage.getItem("tryonProductImage");
        const savedTimestamp = localStorage.getItem("tryonResultTimestamp");

        // Validate cache age (optional: expire after 24 hours)
        if (savedTimestamp) {
          const cacheAge = Date.now() - parseInt(savedTimestamp);
          const maxCacheAge = 24 * 60 * 60 * 1000; // 24 hours
          if (cacheAge > maxCacheAge) {
            console.warn("Try-on result cache expired, clearing...");
            localStorage.removeItem("tryonResult");
            localStorage.removeItem("tryonGarmentName");
            localStorage.removeItem("tryonBuyLink");
            localStorage.removeItem("tryonProductImage");
            localStorage.removeItem("tryonResultTimestamp");
            toast.error("Try-on result expired. Please create a new one.");
            setTimeout(() => {
              router.push("/main/tryon");
            }, 2000);
            return;
          }
        }

        // Validate that we have a result
        if (!savedResult || savedResult.trim() === "" || savedResult === "/v1.jpg") {
          console.warn("No valid try-on result found in localStorage");
          toast.error("No try-on result found. Please try again.");
          setTimeout(() => {
            router.push("/main/tryon");
          }, 2000);
          return;
        }

        // Set data
        if (savedResult) {
          setResultUrl(savedResult);
        }

        if (savedGarmentName) {
          setGarmentName(savedGarmentName);
        }

        if (savedBuyLink) {
          setBuyLink(savedBuyLink);
        }

        if (savedProductImage) {
          setProductImage(savedProductImage);
        }

        // Preload the image to ensure it's ready before showing
        if (savedResult) {
          const img = new window.Image();
          img.src = savedResult;
          
          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            // Timeout after 5 seconds
            setTimeout(() => reject(new Error("Image load timeout")), 5000);
          });
        }

        // Wait for minimum load time (1.5-2 seconds for smooth UX)
        const elapsed = Date.now() - startTime;
        const remainingTime = Math.max(0, minLoadTime - elapsed);
        
        await new Promise(resolve => setTimeout(resolve, remainingTime));
        
        // Set loading to false after data is loaded, image is preloaded, and minimum time has passed
        setIsLoading(false);
      } catch (error) {
        console.error("Error loading try-on data:", error);
        toast.error("Failed to load try-on result. Please try again.");
        setIsLoading(false);
        setTimeout(() => {
          router.push("/main/tryon");
        }, 2000);
      }
    };

    loadTryOnData();

    // Check if video was generated and show feedback after 2 minutes
    const videoGeneratedTime = localStorage.getItem("videoGeneratedTime");
    if (videoGeneratedTime) {
      const timeSinceGeneration = Date.now() - parseInt(videoGeneratedTime);
      const twoMinutes = 2 * 60 * 1000; // 2 minutes in milliseconds
      
      if (timeSinceGeneration >= twoMinutes) {
        // Show feedback modal if 2 minutes have passed
        setShowFeedbackModal(true);
        localStorage.removeItem("videoGeneratedTime");
      } else {
        // Set timer to show feedback modal after remaining time
        const remainingTime = twoMinutes - timeSinceGeneration;
        const timer = setTimeout(() => {
          setShowFeedbackModal(true);
          localStorage.removeItem("videoGeneratedTime");
        }, remainingTime);
        
        return () => clearTimeout(timer);
      }
    }

    // Clear navigation flag
    sessionStorage.removeItem("tryonNavigationInProgress");
    sessionStorage.removeItem("tryonNavigationTimestamp");
  }, [router]);

  const handleShareClick = () => {
    // Show feedback modal first
    setShowFeedbackModal(true);
  };

  const handleShare = async (platform?: string) => {
    if (!platform && navigator.share) {
      try {
        await navigator.share({
          title: "My Virtual Try-On",
          text: `Check out how ${garmentName} looks on me!`,
          url: resultUrl,
        });
        return;
      } catch {}
    }

    if (!platform) {
      setShowShareOptions(true);
      return;
    }

    const url = encodeURIComponent(resultUrl);
    const text = encodeURIComponent(`Check out how ${garmentName} looks on me!`);
    let shareUrl = "";

    switch (platform) {
      case "whatsapp":
        shareUrl = `https://wa.me/?text=${text}%20${url}`;
        break;
      case "facebook":
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
        break;
      case "twitter":
        shareUrl = `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
        break;
      case "instagram":
        toast.success("Please download the image and share it on Instagram");
        setShowShareOptions(false);
        return;
    }

    window.open(shareUrl, "_blank", "width=600,height=400");
    setShowShareOptions(false);
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(resultUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `vizzle-tryon-${garmentName.replace(/\s+/g, "-")}.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Image downloaded successfully!");
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Download failed. Please try again.");
    }
  };

  const handleGenerateVideo = async () => {
    if (!resultUrl || resultUrl === "/v1.jpg") {
      toast.error("Please complete a try-on first");
      return;
    }

    setIsGeneratingVideo(true);
    setVideoProgress(10);
    const loadingToast = toast.loading("Initializing video generation...");

    try {
      // Generate video from the try-on result image
      // API: VideoGenerationRequest with image_url, motion_type, duration (2-10), fps (12-30)
      const videoResponse = await VizzleAPI.generateVideo({
        image_url: resultUrl,
        motion_type: "subtle_walk",
        duration: 3, // Valid range: [2, 10]
        fps: 24, // Valid range: [12, 30]
      });

      setVideoProgress(20);
      toast.loading("Generating video... This may take 60-90 seconds", {
        id: loadingToast,
      });

      // Poll for status updates to show progress
      let pollInterval: NodeJS.Timeout | null = null;
      pollInterval = setInterval(async () => {
        try {
          const status = await VizzleAPI.getVideoStatus(videoResponse.id);
          if (status.progress !== null && status.progress !== undefined) {
            setVideoProgress(Math.max(20, status.progress));
          }
          if (status.status === "succeeded" || status.status === "failed") {
            if (pollInterval) clearInterval(pollInterval);
          }
        } catch (error) {
          // Ignore polling errors, waitForVideo will handle final status
        }
      }, 2000); // Poll every 2 seconds

      // Wait for video generation to complete
      // API: VideoResponse with id, status, video_url, error, progress, estimated_time
      const videoResult = await VizzleAPI.waitForVideo(videoResponse.id);
      if (pollInterval) clearInterval(pollInterval);

      if (videoResult.status === "succeeded" && videoResult.video_url) {
        setVideoProgress(100);
        toast.success("Video generated successfully!", { id: loadingToast });
        
        // Save video URL to localStorage
        localStorage.setItem("tryonVideoUrl", videoResult.video_url);
        localStorage.setItem("tryonVideoGarmentName", garmentName);
        
        // Set timer to show feedback modal after 2 minutes
        const videoGeneratedTime = Date.now();
        localStorage.setItem("videoGeneratedTime", videoGeneratedTime.toString());
        
        // Redirect to video result page
        router.push("/main/tryonresult/video");
      } else if (videoResult.status === "failed") {
        throw new Error(videoResult.error || "Video generation failed");
      }
    } catch (error) {
      console.error("Video generation error:", error);
      toast.error(
        error instanceof Error ? error.message : "Video generation failed",
        { id: loadingToast }
      );
    } finally {
      setIsGeneratingVideo(false);
      setVideoProgress(0);
    }
  };

  // Show loading state - no placeholder, only proper loader
  if (isLoading || !resultUrl) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-white p-4">
        <div className="w-full max-w-md">
          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative mb-6">
              <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-blue-400 animate-pulse" />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              Preparing Your Result
            </h3>
            <p className="text-gray-600 text-center text-sm max-w-xs">
              Your virtual try-on is being processed...
            </p>
            <div className="w-full max-w-xs mt-6 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-500" 
                style={{ width: '70%' }} 
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50 p-4 relative">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6 relative">
        <h2 className="text-2xl font-semibold text-gray-800 text-center mb-6">
          Try On Result
        </h2>

        <div className="relative rounded-2xl overflow-hidden mb-6 bg-white">
          <div className="relative aspect-[3/4] w-full bg-white">
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
                <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
              </div>
            )}
            <Image
              src={resultUrl}
              alt="Try On Result"
              fill
              className={`object-contain transition-opacity duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
              priority
              unoptimized={resultUrl.includes('replicate.delivery')}
              onLoad={() => {
                setImageLoaded(true);
                console.log("✅ Try-on result image loaded successfully");
              }}
              onError={(e) => {
                console.error('Image load error:', e);
                setImageLoaded(true);
                // Fallback to regular img tag if Next Image fails
                const target = e.target as HTMLImageElement;
                if (target && target.parentElement) {
                  const img = document.createElement('img');
                  img.src = resultUrl;
                  img.alt = "Try On Result";
                  img.className = "object-contain w-full h-full";
                  img.style.objectFit = "contain";
                  target.parentElement.innerHTML = '';
                  target.parentElement.appendChild(img);
                }
              }}
            />
          </div>

          {/* Top-right icons */}
          <div className="absolute top-3 right-1 flex gap-1.5">
            <button
              onClick={handleDownload}
              className="bg-white hover:bg-gray-50 p-3 rounded-full shadow-lg transition-all hover:scale-110"
              aria-label="Download"
            >
              <Download className="w-4 h-4 text-gray-700" />
            </button>
            <button
              onClick={handleShareClick}
              className="bg-white hover:bg-gray-50 p-3 rounded-full shadow-lg transition-all hover:scale-110"
              aria-label="Share"
            >
              <Share2 className="w-4 h-4 text-gray-700" />
            </button>
          </div>
        </div>

        {/* Generate Video + Buy Now */}
       <div className="grid grid-cols-2 gap-3 mb-4">
  <button
    onClick={handleGenerateVideo}
    disabled={isGeneratingVideo}
    className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
  >
    {isGeneratingVideo ? (
      <>
        <Loader2 className="w-5 h-5 animate-spin" />
        Generating...
      </>
    ) : (
      <>
        <Video className="w-5 h-5" />
        Generate Video
      </>
    )}
  </button>

  <button
    onClick={() => {
      if (buyLink) {
        window.open(buyLink, "_blank", "noopener,noreferrer");
      } else {
        router.push("/main");
      }
    }}
    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-medium"
  >
    Buy Now
  </button>
</div>

<button
  onClick={() => router.push("/main")}
  className="w-full text-center text-blue-600 hover:text-blue-700 py-2 font-medium transition"
>
  Try another outfit
</button>

        {/* Feedback Modal - Shown before share */}
        {showFeedbackModal && (
          <div className="fixed inset-0 flex justify-center items-center bg-black/40 z-50 p-4">
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
                    // Show share modal after feedback
                    setShowShareOptions(true);
                  }}
                  className="flex-1 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-medium transition"
                >
                  Maybe Later
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Share Modal */}
        {showShareOptions && (
          <div
            className="fixed inset-0 bg-black/60 flex justify-center items-end z-50 animate-in fade-in duration-200"
            onClick={() => setShowShareOptions(false)}
          >
            <div
              className="bg-white w-full max-w-md rounded-t-3xl p-6 animate-in slide-in-from-bottom duration-300"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-6"></div>
              <h3 className="text-xl font-semibold text-gray-800 text-center mb-6">
                Share your look
              </h3>

              <div className="grid grid-cols-4 gap-6 mb-6">
                <button onClick={() => handleShare("whatsapp")} className="flex flex-col items-center gap-2 group">
                  <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center group-hover:bg-green-200 transition">
                    <FaWhatsapp className="text-green-600 text-2xl" />
                  </div>
                  <span className="text-xs text-gray-700">WhatsApp</span>
                </button>
                <button onClick={() => handleShare("facebook")} className="flex flex-col items-center gap-2 group">
                  <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200 transition">
                    <FaFacebook className="text-blue-600 text-2xl" />
                  </div>
                  <span className="text-xs text-gray-700">Facebook</span>
                </button>
                <button onClick={() => handleShare("twitter")} className="flex flex-col items-center gap-2 group">
                  <div className="w-14 h-14 bg-sky-100 rounded-full flex items-center justify-center group-hover:bg-sky-200 transition">
                    <FaTwitter className="text-sky-500 text-2xl" />
                  </div>
                  <span className="text-xs text-gray-700">Twitter</span>
                </button>
                <button onClick={() => handleShare("instagram")} className="flex flex-col items-center gap-2 group">
                  <div className="w-14 h-14 bg-pink-100 rounded-full flex items-center justify-center group-hover:bg-pink-200 transition">
                    <FaInstagram className="text-pink-600 text-2xl" />
                  </div>
                  <span className="text-xs text-gray-700">Instagram</span>
                </button>
              </div>

              <button
                onClick={() => setShowShareOptions(false)}
                className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>


    </div>
  );
}
