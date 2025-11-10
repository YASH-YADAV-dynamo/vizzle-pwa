"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { Share2, Download, Video, Loader2 } from "lucide-react";
import { FaWhatsapp, FaFacebook, FaInstagram, FaTwitter } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { VizzleAPI } from "@/lib/api/vizzle-api";

export default function TryOnResultPage() {
  const router = useRouter();
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [resultUrl, setResultUrl] = useState<string>("/v1.jpg");
  const [garmentName, setGarmentName] = useState<string>("Product");
  const [showFeedback, setShowFeedback] = useState(false);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);

  useEffect(() => {
    // Load try-on result from localStorage
    const savedResult = localStorage.getItem("tryonResult");
    const savedGarmentName = localStorage.getItem("tryonGarmentName");

    if (savedResult) {
      setResultUrl(savedResult);
    }

    if (savedGarmentName) {
      setGarmentName(savedGarmentName);
    }
  }, []);

   useEffect(() => {
    // Check if feedback was already shown
    const hasSeenFeedback = localStorage.getItem("hasSeenFeedback");

    if (!hasSeenFeedback) {
      // Show after 10 seconds (10000 ms)
      const timer = setTimeout(() => {
        setShowFeedback(true);
        localStorage.setItem("hasSeenFeedback", "true");
      }, 10000);

      // Cleanup if user navigates before 10s
      return () => clearTimeout(timer);
    }
  }, []);

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

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50 p-4 relative">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6 relative">
        <h2 className="text-2xl font-semibold text-gray-800 text-center mb-6">
          Try On Result
        </h2>

        <div className="relative rounded-2xl overflow-hidden mb-6 bg-gradient-to-br from-gray-100 to-gray-50">
          <div className="relative aspect-[3/4] w-full">
            <Image
              src={resultUrl}
              alt="Try On Result"
              fill
              className="object-contain"
              priority
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
              onClick={() => handleShare()}
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
    onClick={() => router.push("/main")}
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

      {/* Feedback Card */}
    {showFeedback && (
  <div className="fixed inset-0 flex justify-center items-center bg-black/40 z-50">
    <div className="bg-white shadow-2xl rounded-2xl p-6 w-80 text-center animate-in fade-in duration-300">
      <h3 className="text-lg font-semibold text-gray-800 mb-3">
        Give us your feedback 💬
      </h3>
      <p className="text-gray-600 text-sm mb-5">
        Your opinion helps us improve your virtual try-on experience.
      </p>
      <button
        onClick={() => router.push("/main/profile/rate")}
        className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition"
      >
        Give Feedback
      </button>
    </div>
  </div>
)}

    </div>
  );
}
