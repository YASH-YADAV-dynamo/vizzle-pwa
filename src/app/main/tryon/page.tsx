"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, Eye, Trash2, X, Sparkles, ImageIcon, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import TryOnModal from "@/components/TryOnModal";
import { toast } from "react-hot-toast";

function TryOnPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [tab, setTab] = useState("single");
  const [garments, setGarments] = useState<any[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [modelImage, setModelImage] = useState<string | null>(null);
  const modelInputRef = useRef<HTMLInputElement>(null);
  const [showTryOnModal, setShowTryOnModal] = useState(false);
  const [selectedGarmentForTryOn, setSelectedGarmentForTryOn] =
    useState<any>(null);
  const [showGarmentUploadModal, setShowGarmentUploadModal] = useState(false);
  const [selectedGarmentSlot, setSelectedGarmentSlot] = useState<number | null>(null);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("tryonProducts") || "[]");
      setGarments(stored);
    } catch (error) {
      console.error("Error reading garments from localStorage:", error);
      setGarments([]);
    }

    const tabFromURL = searchParams.get("tab");
    if (tabFromURL === "multiple" || tabFromURL === "single") {
      setTab(tabFromURL);
      try {
        localStorage.setItem("originTab", tabFromURL);
      } catch (error) {
        console.error("Error saving tab to localStorage:", error);
      }
    } else {
      const saved = localStorage.getItem("originTab");
      if (saved) setTab(saved);
    }

    try {
      const savedModel = localStorage.getItem("modelImage");
      if (savedModel) setModelImage(savedModel);
    } catch (error) {
      console.error("Error reading model image from localStorage:", error);
    }
  }, [searchParams]);

  // Fix for GPM WebView - Reset file inputs on click to ensure gallery opens every time
  useEffect(() => {
    // Model input
    const modelInput = modelInputRef.current;
    const handleModelClick = () => {
      if (modelInput) {
        modelInput.value = "";
      }
    };

    if (modelInput) {
      modelInput.addEventListener("click", handleModelClick);
    }

    return () => {
      if (modelInput) {
        modelInput.removeEventListener("click", handleModelClick);
      }
    };
  }, []);

  useEffect(() => {
    // Gallery upload inputs
    const handleInputClick = (e: Event) => {
      const target = e.target as HTMLInputElement;
      if (target && target.type === "file") {
        target.value = "";
      }
    };

    // Add listeners to all file inputs
    const singleInput = document.getElementById("galleryUploadSingle");
    const multipleInputs = [0, 1, 2].map((i) => 
      document.getElementById(`galleryUploadMultiple-${i}`)
    );

    [singleInput, ...multipleInputs].forEach((input) => {
      if (input) {
        input.addEventListener("click", handleInputClick);
      }
    });

    return () => {
      [singleInput, ...multipleInputs].forEach((input) => {
        if (input) {
          input.removeEventListener("click", handleInputClick);
        }
      });
    };
  }, []);

  const handleAddGarment = () => {
    try {
      localStorage.setItem("originTab", tab);
    } catch (error) {
      console.error("Error saving tab to localStorage:", error);
    }
    router.push(`/main?tab=${tab}`);
  };

  const handleGarmentCardClick = (slotIndex?: number) => {
    setSelectedGarmentSlot(slotIndex ?? null);
    setShowGarmentUploadModal(true);
  };

  const handleDeleteGarment = (index: number) => {
    const updated = garments.filter((_, i) => i !== index);
    setGarments(updated);
    try {
      localStorage.setItem("tryonProducts", JSON.stringify(updated));
    } catch (error) {
      if (error instanceof DOMException && error.name === "QuotaExceededError") {
        toast.error("Storage full. Please clear some space.");
      } else {
        console.error("Error saving to localStorage:", error);
      }
    }
  };

  // Compress image to reduce localStorage size
  const compressImage = (file: File, maxWidth: number = 1024, quality: number = 0.7): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        // Use HTMLImageElement constructor instead of Image from next/image
        const img = document.createElement("img");
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;

          // Calculate new dimensions
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("Could not get canvas context"));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL("image/jpeg", quality);
          resolve(compressedDataUrl);
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleModelUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const compressedImage = await compressImage(file, 1024, 0.7);
        setModelImage(compressedImage);
        try {
          localStorage.setItem("modelImage", compressedImage);
        } catch (error) {
          if (error instanceof DOMException && error.name === "QuotaExceededError") {
            toast.error("Storage full. Please clear some space or use a smaller image.");
          } else {
            console.error("Error saving to localStorage:", error);
          }
        }
      } catch (error) {
        console.error("Error compressing image:", error);
        toast.error("Failed to process image. Please try again.");
      }
      // Reset input properly using ref
      if (modelInputRef.current) {
        modelInputRef.current.value = "";
      }
    }
  };

  const handleRemoveModel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setModelImage(null);
    localStorage.removeItem("modelImage");
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Close modal after upload starts
    setShowGarmentUploadModal(false);
    setSelectedGarmentSlot(null);
    
    try {
      // Compress image before storing
      const compressedImage = await compressImage(file, 1024, 0.7);
      const newGarment = {
        id: Date.now(),
        name: file.name,
        image: compressedImage,
      };
      const updatedGarments = [...garments, newGarment];
      setGarments(updatedGarments);
      
      try {
        localStorage.setItem("tryonProducts", JSON.stringify(updatedGarments));
        toast.success("Garment added from gallery!");
      } catch (error) {
        if (error instanceof DOMException && error.name === "QuotaExceededError") {
          // Remove oldest items if quota exceeded
          const maxItems = 3; // Keep only last 3 items
          if (updatedGarments.length > maxItems) {
            const trimmedGarments = updatedGarments.slice(-maxItems);
            setGarments(trimmedGarments);
            try {
              localStorage.setItem("tryonProducts", JSON.stringify(trimmedGarments));
              toast.success("Garment added! (Removed older items to save space)");
            } catch (retryError) {
              toast.error("Storage full. Please clear some space or remove items.");
              // Revert state
              setGarments(garments);
            }
          } else {
            toast.error("Storage full. Please clear some space or remove items.");
            // Revert state
            setGarments(garments);
          }
        } else {
          console.error("Error saving to localStorage:", error);
          toast.error("Failed to save garment. Please try again.");
          // Revert state
          setGarments(garments);
        }
      }
    } catch (error) {
      console.error("Error compressing image:", error);
      toast.error("Failed to process image. Please try again.");
    }
    
    e.target.value = "";
  };

  const lastGarment =
    garments && garments.length > 0 ? garments[garments.length - 1] : null;

  const handleCreateTryOn = () => {
    if (!modelImage) {
      toast.error("Please upload your photo first");
      return;
    }

    if (tab === "single") {
      if (!lastGarment) {
        toast.error("Please select a garment");
        return;
      }
      setSelectedGarmentForTryOn(lastGarment);
      setShowTryOnModal(true);
    } else {
      if (garments.length === 0) {
        toast.error("Please select at least one garment");
        return;
      }
      setSelectedGarmentForTryOn(garments[0]);
      setShowTryOnModal(true);
    }
  };

  const handleTryOnSuccess = (resultUrl: string) => {
    // Save to localStorage first
    try {
      localStorage.setItem("tryonResult", resultUrl);
      localStorage.setItem(
        "tryonGarmentName",
        selectedGarmentForTryOn?.name || ""
      );
      // Save buyLink and product image if available
      if (selectedGarmentForTryOn?.buyLink) {
        localStorage.setItem("tryonBuyLink", selectedGarmentForTryOn.buyLink);
      }
      if (selectedGarmentForTryOn?.image) {
        localStorage.setItem("tryonProductImage", selectedGarmentForTryOn.image);
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "QuotaExceededError") {
        toast.error("Storage full. Result may not be saved. Please clear some space.");
      } else {
        console.error("Error saving try-on result to localStorage:", error);
      }
    }
    // Close modal and redirect immediately
    setShowTryOnModal(false);
    router.push("/main/tryonresult");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center p-6 pb-24">
      <div className="w-full max-w-md bg-white rounded-2xl shadow p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">
          Try On Clothing
        </h2>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="single">Single Garment</TabsTrigger>
            <TabsTrigger value="multiple">Multiple Garments</TabsTrigger>
          </TabsList>

          {/* ---------- SINGLE GARMENT ---------- */}
          <TabsContent value="single">
            <Card
              className="border-dashed border-2 border-gray-300 rounded-lg mb-4 hover:bg-gray-50 cursor-pointer relative"
              onClick={!lastGarment ? () => handleGarmentCardClick() : undefined}
            >
              <input
                type="file"
                id="galleryUploadSingle"
                accept="image/*"
                className="hidden"
                onChange={handleGalleryUpload}
              />

              <CardContent className="flex flex-col items-center justify-center py-10 mt-5">
                {lastGarment ? (
                  <>
                    <div className="relative w-40 h-40 mb-2 rounded-lg overflow-hidden mt-5">
                      <Image
                        src={lastGarment.image}
                        alt={lastGarment.name}
                        fill
                        className="object-contain rounded-lg"
                      />
                    </div>

                    <div className="absolute top-2 right-2 flex gap-2 bg-white/70 rounded-md p-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewImage(lastGarment.image);
                        }}
                        className="p-1 hover:bg-gray-200 rounded"
                      >
                        <Eye className="h-4 w-4 text-gray-600" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteGarment(garments.length - 1);
                        }}
                        className="p-1 hover:bg-gray-200 rounded"
                      >
                        <Trash2 className="h-4 w-4 text-gray-600" />
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <Upload className="h-8 w-8 text-gray-400 mt-2" />
                    <p className="text-gray-500 text-sm">Add garment</p>
                    <p className="text-xs text-gray-400 mt-1 text-center">
                      JPEG/PNG/WEBP up to 20MB and 4096×4096 pixels
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Select Model */}
            <Card
              className="border-dashed border-2 border-gray-300 rounded-lg mb-6 hover:bg-gray-50 cursor-pointer relative"
              onClick={() => {
                if (modelInputRef.current) {
                  modelInputRef.current.value = ""; // Reset before opening
                  modelInputRef.current.click();
                }
              }}
            >
              <CardContent className="flex flex-col items-center justify-center py-10 relative mt-5">
                {modelImage ? (
                  <div className="relative w-40 h-40 mb-2 overflow-hidden mt-5">
                    <Image
                      src={modelImage}
                      alt="Model"
                      fill
                      className="object-contain"
                    />
                    <button
                      onClick={handleRemoveModel}
                      className="absolute top-2 right-2 bg-white p-1 rounded-full hover:bg-gray-200"
                    >
                      <Trash2 className="h-4 w-4 text-gray-600" />
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload className="h-8 w-8 text-gray-400 mt-2" />
                    <p className="text-gray-500 text-sm">Upload photo</p>
                  </>
                )}
              </CardContent>
            </Card>

            <Button
              onClick={handleCreateTryOn}
              disabled={!modelImage || !lastGarment}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Create Virtual Try-On
            </Button>
          </TabsContent>

          {/* ---------- MULTIPLE GARMENTS ---------- */}
          <TabsContent value="multiple">
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[0, 1, 2].map((index) => {
                const item = garments[index];
                return item ? (
                  <Card
                    key={`garment-${item.id || index}`}
                    className="border-dashed border-2 border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer relative"
                  >
                    <CardContent className="flex flex-col items-center justify-center py-10 relative mt-5">
                      <div className="relative w-25 h-20 mb-2 rounded-md overflow-hidden mt-5">
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-contain"
                        />
                      </div>

                      <div className="absolute top-2 right-2 flex gap-1 bg-white/70 rounded-md p-1">
                        <button
                          onClick={() => setPreviewImage(item.image)}
                          className="p-1 hover:bg-gray-200 rounded"
                        >
                          <Eye className="h-3 w-3 text-gray-600" />
                        </button>
                        <button
                          onClick={() => handleDeleteGarment(index)}
                          className="p-1 hover:bg-gray-200 rounded"
                        >
                          <Trash2 className="h-3 w-3 text-gray-600" />
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card
                    key={`empty-${index}`}
                    onClick={() => handleGarmentCardClick(index)}
                    className="border-dashed border-2 border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer relative"
                  >
                    <input
                      type="file"
                      id={`galleryUploadMultiple-${index}`}
                      accept="image/*"
                      className="hidden"
                      onChange={handleGalleryUpload}
                    />

                    <CardContent className="flex flex-col items-center justify-center py-10 mt-5">
                      <Upload className="h-8 w-8 text-gray-400 mt-2" />
                      <p className="text-gray-500 text-sm text-center">
                        Add garment
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Select Model */}
            <Card
              className="border-dashed border-2 border-gray-300 rounded-lg mb-6 hover:bg-gray-50 cursor-pointer relative "
              onClick={() => {
                if (modelInputRef.current) {
                  modelInputRef.current.value = ""; // Reset before opening
                  modelInputRef.current.click();
                }
              }}
            >
              <CardContent className="flex flex-col items-center justify-center py-10 relative">
                {modelImage ? (
                  <div className="relative w-40 h-48 mb-2 overflow-hidden mt-5">
                    <Image
                      src={modelImage}
                      alt="Model"
                      fill
                      className="object-contain"
                    />
                    <button
                      onClick={handleRemoveModel}
                      className="absolute top-2 right-2 bg-white p-1 rounded-full hover:bg-gray-200"
                    >
                      <Trash2 className="h-4 w-4 text-gray-600" />
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload className="h-8 w-8 text-gray-400 mt-2" />
                    <p className="text-gray-500 text-sm">Upload photo</p>
                  </>
                )}
              </CardContent>
            </Card>

            <Button
              onClick={handleCreateTryOn}
              disabled={!modelImage || garments.length === 0}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Create Virtual Try-On
            </Button>
          </TabsContent>
        </Tabs>
      </div>

      {/* Try-On Modal */}
      {showTryOnModal && selectedGarmentForTryOn && modelImage && (
        <TryOnModal
          isOpen={showTryOnModal}
          onClose={() => setShowTryOnModal(false)}
          humanImage={modelImage}
          garmentImage={selectedGarmentForTryOn.image}
          garmentName={selectedGarmentForTryOn.name}
          onSuccess={handleTryOnSuccess}
        />
      )}

      <input
        ref={modelInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleModelUpload}
      />

      {previewImage && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-2">
          <div className="relative bg-white rounded-lg p-4 max-w-lg w-full">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-2 right-2 p-2 rounded-full bg-white hover:bg-gray-200 z-50"
            >
              <X className="h-5 w-5 text-gray-800" />
            </button>

            <div className="relative w-full h-96 z-10">
              <Image
                src={previewImage}
                alt="Preview"
                fill
                className="object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}

      {/* Garment Upload Selection Modal */}
      {showGarmentUploadModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Add Garment</h3>
              <button
                onClick={() => {
                  setShowGarmentUploadModal(false);
                  setSelectedGarmentSlot(null);
                }}
                className="p-1 hover:bg-gray-100 rounded-full transition"
              >
                <X className="h-5 w-5 text-gray-600" />
              </button>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={() => {
                  setShowGarmentUploadModal(false);
                  // Open the appropriate file input based on slot
                  if (selectedGarmentSlot !== null) {
                    const input = document.getElementById(
                      `galleryUploadMultiple-${selectedGarmentSlot}`
                    ) as HTMLInputElement | null;
                    if (input) {
                      input.value = ""; // Reset before opening
                      input.click();
                    }
                  } else {
                    const input = document.getElementById(
                      "galleryUploadSingle"
                    ) as HTMLInputElement | null;
                    if (input) {
                      input.value = ""; // Reset before opening
                      input.click();
                    }
                  }
                  setSelectedGarmentSlot(null);
                }}
                className="w-full flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all"
              >
                <div className="p-2 bg-blue-100 rounded-lg">
                  <ImageIcon className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-gray-800">Gallery</p>
                  <p className="text-sm text-gray-500">Upload from your device</p>
                </div>
              </button>

              <button
                onClick={() => {
                  setShowGarmentUploadModal(false);
                  try {
                    localStorage.setItem("originTab", tab);
                  } catch (error) {
                    console.error("Error saving tab to localStorage:", error);
                  }
                  router.push(`/main?tab=${tab}`);
                  setSelectedGarmentSlot(null);
                }}
                className="w-full flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all"
              >
                <div className="p-2 bg-purple-100 rounded-lg">
                  <ShoppingBag className="h-5 w-5 text-purple-600" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-gray-800">Vizzle</p>
                  <p className="text-sm text-gray-500">Browse products from store</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TryOnPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Loading...</p>
          </div>
        </div>
      }
    >
      <TryOnPageContent />
    </Suspense>
  );
}
