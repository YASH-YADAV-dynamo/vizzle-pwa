"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { 
  useUploadHuman, 
  useUploadGarment, 
  useVirtualTryOn, 
  useLayeredTryOn,
  useVideoGeneration 
} from "@/hooks/useVizzleApi";
import { toast } from "react-hot-toast";
import { 
  Upload, 
  User, 
  Shirt, 
  Sparkles, 
  Loader2, 
  Download, 
  Video,
  Plus,
  RefreshCw
} from "lucide-react";
import ApiHealthCheck from "./ApiHealthCheck";

// Garment types available
const GARMENT_TYPES = [
  { value: "auto_detect", label: "Auto Detect" },
  { value: "shirt", label: "Shirt" },
  { value: "t-shirt", label: "T-Shirt" },
  { value: "blouse", label: "Blouse" },
  { value: "sweater", label: "Sweater" },
  { value: "hoodie", label: "Hoodie" },
  { value: "jacket", label: "Jacket" },
  { value: "coat", label: "Coat" },
  { value: "blazer", label: "Blazer" },
  { value: "cardigan", label: "Cardigan" },
  { value: "tank_top", label: "Tank Top" },
  { value: "crop_top", label: "Crop Top" },
  { value: "pants", label: "Pants" },
  { value: "jeans", label: "Jeans" },
  { value: "trousers", label: "Trousers" },
  { value: "shorts", label: "Shorts" },
  { value: "skirt", label: "Skirt" },
  { value: "leggings", label: "Leggings" },
  { value: "dress", label: "Dress" },
  { value: "jumpsuit", label: "Jumpsuit" },
  { value: "hat", label: "Hat" },
  { value: "glasses", label: "Glasses" },
  { value: "necklace", label: "Necklace" },
  { value: "earrings", label: "Earrings" },
  { value: "scarf", label: "Scarf" },
  { value: "accessory", label: "Accessory" },
];

const GARMENT_CATEGORIES = [
  { value: "upper_body", label: "Upper Body" },
  { value: "lower_body", label: "Lower Body" },
  { value: "dresses", label: "Dresses" },
  { value: "accessories", label: "Accessories" },
];

export default function VirtualTryOn() {
  const [humanImagePreview, setHumanImagePreview] = useState<string | null>(null);
  const [garmentImagePreview, setGarmentImagePreview] = useState<string | null>(null);
  const [garmentType, setGarmentType] = useState("auto_detect");
  const [garmentCategory, setGarmentCategory] = useState("upper_body");
  const [useVision, setUseVision] = useState(true);
  const [resultImageUrl, setResultImageUrl] = useState<string | null>(null);
  const [showLayeredOptions, setShowLayeredOptions] = useState(false);

  const humanUpload = useUploadHuman();
  const garmentUpload = useUploadGarment();
  const virtualTryOn = useVirtualTryOn();
  const layeredTryOn = useLayeredTryOn();
  const videoGeneration = useVideoGeneration();

  // Handle human image upload
  const handleHumanImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setHumanImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload
    try {
      await humanUpload.upload(file);
      toast.success("Human image uploaded successfully!");
    } catch (error) {
      toast.error("Failed to upload human image");
    }
  };

  // Handle garment image upload
  const handleGarmentImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setGarmentImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload
    try {
      await garmentUpload.upload(file);
      toast.success("Garment image uploaded successfully!");
    } catch (error) {
      toast.error("Failed to upload garment image");
    }
  };

  // Perform virtual try-on
  const handleVirtualTryOn = async () => {
    if (!humanUpload.uploadedImage || !garmentUpload.uploadedImage) {
      toast.error("Please upload both human and garment images");
      return;
    }

    try {
      const response = await virtualTryOn.performTryOn(
        humanUpload.uploadedImage.url,
        garmentUpload.uploadedImage.url,
        {
          garmentType,
          useVision,
          params: {
            category: garmentCategory,
            crop: false,
            force_dc: garmentCategory === "dresses",
            mask_only: false,
            steps: 20,
            seed: 42,
          },
        }
      );

      toast.loading("Processing your try-on...", { id: "tryon" });

      // Wait for completion
      const result = await virtualTryOn.waitForCompletion(response.id);
      
      if (result.status === "succeeded" && result.output) {
        const outputUrl = Array.isArray(result.output) ? result.output[0] : result.output;
        setResultImageUrl(outputUrl as string);
        toast.success("Try-on completed successfully!", { id: "tryon" });
        setShowLayeredOptions(true);
      } else if (result.status === "failed") {
        toast.error(result.error || "Try-on failed", { id: "tryon" });
      }
    } catch (error) {
      toast.error("Failed to perform try-on", { id: "tryon" });
    }
  };

  // Perform layered try-on
  const handleLayeredTryOn = async () => {
    if (!resultImageUrl || !garmentUpload.uploadedImage) {
      toast.error("Please complete a try-on first and upload another garment");
      return;
    }

    try {
      const response = await layeredTryOn.performLayeredTryOn(
        resultImageUrl,
        garmentUpload.uploadedImage.url,
        garmentType,
        {
          useVision,
          params: {
            category: garmentCategory,
            crop: false,
            force_dc: garmentCategory === "dresses",
            mask_only: false,
            steps: 20,
            seed: 42,
          },
        }
      );

      toast.loading("Adding more clothing...", { id: "layered" });

      // Wait for completion
      const result = await layeredTryOn.waitForCompletion(response.id);
      
      if (result.status === "succeeded" && result.output) {
        const outputUrl = Array.isArray(result.output) ? result.output[0] : result.output;
        setResultImageUrl(outputUrl as string);
        toast.success("Layered try-on completed!", { id: "layered" });
      } else if (result.status === "failed") {
        toast.error(result.error || "Layered try-on failed", { id: "layered" });
      }
    } catch (error) {
      toast.error("Failed to perform layered try-on", { id: "layered" });
    }
  };

  // Generate video
  const handleGenerateVideo = async () => {
    if (!resultImageUrl) {
      toast.error("Please complete a try-on first");
      return;
    }

    try {
      const response = await videoGeneration.generateVideo(resultImageUrl, {
        motionType: "subtle_walk",
        duration: 3,
        fps: 24,
      });

      toast.loading("Generating video...", { id: "video" });

      // Wait for completion
      const result = await videoGeneration.waitForCompletion(response.id);
      
      if (result.status === "succeeded" && result.video_url) {
        toast.success("Video generated successfully!", { id: "video" });
        // Open video in new tab
        window.open(result.video_url, "_blank");
      } else if (result.status === "failed") {
        toast.error(result.error || "Video generation failed", { id: "video" });
      }
    } catch (error) {
      toast.error("Failed to generate video", { id: "video" });
    }
  };

  // Reset all
  const handleReset = () => {
    setHumanImagePreview(null);
    setGarmentImagePreview(null);
    setResultImageUrl(null);
    setShowLayeredOptions(false);
    humanUpload.reset();
    garmentUpload.reset();
    virtualTryOn.reset();
    layeredTryOn.reset();
    videoGeneration.reset();
    toast.success("Reset successfully!");
  };

  const isProcessing = virtualTryOn.processing || virtualTryOn.polling || 
                       layeredTryOn.processing || layeredTryOn.polling ||
                       videoGeneration.processing || videoGeneration.polling;

  const isUploading = humanUpload.uploading || garmentUpload.uploading;

  // Fix for GPM WebView - Reset file inputs on click to ensure gallery opens every time
  useEffect(() => {
    const handleInputClick = (e: Event) => {
      const target = e.target as HTMLInputElement;
      if (target && target.type === "file") {
        target.value = "";
      }
    };

    const humanInput = document.getElementById("human-upload");
    const garmentInput = document.getElementById("garment-upload");

    [humanInput, garmentInput].forEach((input) => {
      if (input) {
        input.addEventListener("click", handleInputClick);
      }
    });

    return () => {
      [humanInput, garmentInput].forEach((input) => {
        if (input) {
          input.removeEventListener("click", handleInputClick);
        }
      });
    };
  }, []);

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold flex items-center justify-center gap-2">
          <Sparkles className="w-8 h-8 text-purple-500" />
          Virtual Try-On Studio
        </h1>
        <p className="text-gray-600">Upload your photo and a garment to see how it looks on you!</p>
      </div>

      {/* API Health Check */}
      <ApiHealthCheck />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Human Image Upload */}
          <div className="bg-white rounded-xl shadow-lg p-6 space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <User className="w-5 h-5 text-blue-500" />
              <h2 className="text-xl font-semibold">1. Upload Your Photo</h2>
            </div>
            
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                onChange={handleHumanImageUpload}
                className="hidden"
                id="human-upload"
                disabled={isUploading || isProcessing}
              />
              <label
                htmlFor="human-upload"
                className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors"
              >
                {humanImagePreview ? (
                  <div className="relative w-full h-full">
                    <Image
                      src={humanImagePreview}
                      alt="Human preview"
                      fill
                      className="object-contain rounded-lg"
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <Upload className="w-12 h-12 text-gray-400" />
                    <p className="text-sm text-gray-500">Click to upload your photo</p>
                    <p className="text-xs text-gray-400">JPEG, PNG, WebP supported</p>
                  </div>
                )}
              </label>
            </div>
            {humanUpload.uploading && (
              <div className="flex items-center gap-2 text-blue-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Uploading...</span>
              </div>
            )}
          </div>

          {/* Garment Image Upload */}
          <div className="bg-white rounded-xl shadow-lg p-6 space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Shirt className="w-5 h-5 text-purple-500" />
              <h2 className="text-xl font-semibold">2. Upload Garment</h2>
            </div>
            
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                onChange={handleGarmentImageUpload}
                className="hidden"
                id="garment-upload"
                disabled={isUploading || isProcessing}
              />
              <label
                htmlFor="garment-upload"
                className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-purple-500 transition-colors"
              >
                {garmentImagePreview ? (
                  <div className="relative w-full h-full">
                    <Image
                      src={garmentImagePreview}
                      alt="Garment preview"
                      fill
                      className="object-contain rounded-lg"
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <Upload className="w-12 h-12 text-gray-400" />
                    <p className="text-sm text-gray-500">Click to upload garment</p>
                    <p className="text-xs text-gray-400">JPEG, PNG, WebP supported</p>
                  </div>
                )}
              </label>
            </div>
            {garmentUpload.uploading && (
              <div className="flex items-center gap-2 text-purple-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Uploading...</span>
              </div>
            )}
          </div>

          {/* Settings */}
          <div className="bg-white rounded-xl shadow-lg p-6 space-y-4">
            <h2 className="text-xl font-semibold">3. Configure Settings</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Garment Type</label>
                <select
                  value={garmentType}
                  onChange={(e) => setGarmentType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  disabled={isProcessing}
                >
                  {GARMENT_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Category</label>
                <select
                  value={garmentCategory}
                  onChange={(e) => setGarmentCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  disabled={isProcessing}
                >
                  {GARMENT_CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="use-vision"
                checked={useVision}
                onChange={(e) => setUseVision(e.target.checked)}
                className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                disabled={isProcessing}
              />
              <label htmlFor="use-vision" className="text-sm font-medium">
                Use AI Vision for Auto Detection
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4">
            <button
              onClick={handleVirtualTryOn}
              disabled={!humanUpload.uploadedImage || !garmentUpload.uploadedImage || isProcessing}
              className="flex-1 bg-gradient-to-r from-purple-500 to-blue-500 text-white py-3 px-6 rounded-lg font-semibold hover:from-purple-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Try It On!
                </>
              )}
            </button>

            {showLayeredOptions && (
              <button
                onClick={handleLayeredTryOn}
                disabled={!resultImageUrl || !garmentUpload.uploadedImage || isProcessing}
                className="flex-1 bg-gradient-to-r from-orange-500 to-pink-500 text-white py-3 px-6 rounded-lg font-semibold hover:from-orange-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Add More Clothing
              </button>
            )}

            <button
              onClick={handleReset}
              disabled={isProcessing}
              className="bg-gray-200 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-5 h-5" />
              Reset
            </button>
          </div>
        </div>

        {/* Result Section */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-lg p-6 space-y-4 sticky top-6">
            <h2 className="text-xl font-semibold">Result</h2>
            
            <div className="relative w-full aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden">
              {resultImageUrl ? (
                <Image
                  src={resultImageUrl}
                  alt="Try-on result"
                  fill
                  className="object-contain"
                  unoptimized={resultImageUrl.includes('replicate.delivery')}
                  onError={(e) => {
                    console.error('Image load error:', e);
                    const target = e.target as HTMLImageElement;
                    if (target && target.parentElement) {
                      const img = document.createElement('img');
                      img.src = resultImageUrl;
                      img.alt = "Try-on result";
                      img.className = "object-contain w-full h-full";
                      img.style.objectFit = "contain";
                      target.parentElement.innerHTML = '';
                      target.parentElement.appendChild(img);
                    }
                  }}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <div className="text-center">
                    <Sparkles className="w-16 h-16 mx-auto mb-2 opacity-30" />
                    <p>Your result will appear here</p>
                  </div>
                </div>
              )}
            </div>

            {resultImageUrl && (
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => window.open(resultImageUrl, "_blank")}
                  className="w-full bg-green-500 text-white py-2 px-4 rounded-lg font-semibold hover:bg-green-600 flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download Image
                </button>
                
                <button
                  onClick={handleGenerateVideo}
                  disabled={videoGeneration.processing || videoGeneration.polling}
                  className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {videoGeneration.processing || videoGeneration.polling ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Video className="w-4 h-4" />
                      Generate Video
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

