"use client";

import { useState } from "react";
import { Star, Send, Loader2 } from "lucide-react";
import { IoArrowBack } from "react-icons/io5";
import { useAuth } from "@/contexts/AuthContext";
import { submitFeedback } from "@/lib/firebase/userActivity";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";

export default function ReviewPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [rating, setRating] = useState<number>(0);
  const [hover, setHover] = useState<number>(0);
  const [review, setReview] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const ratingLabels = ["Very Bad", "Bad", "Average", "Good", "Excellent"];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating && !review) {
      toast.error("Please provide a rating or comment");
      return;
    }

    if (!user) {
      toast.error("Please login to submit feedback");
      router.push("/auth/login");
      return;
    }

            setIsSubmitting(true);
            try {
              await submitFeedback(user.uid, {
                rating: rating || 0,
                comment: review || "",
              });
              
              // Mark that user has given feedback
              localStorage.setItem("hasGivenLogoutFeedback", "true");
              
              setShowToast(true);
              toast.success("Thank you for your feedback!");
              
              setTimeout(() => {
                setShowToast(false);
                setRating(0);
                setReview("");
                // Check if user came from logout flow
                const cameFromLogout = localStorage.getItem("cameFromLogout");
                if (cameFromLogout === "true") {
                  localStorage.removeItem("cameFromLogout");
                  // Go back to profile page which will show logout modal
                  router.push("/main/profile");
                } else {
                  router.back();
                }
              }, 2000);
            } catch (error) {
              console.error("Error submitting feedback:", error);
              toast.error("Failed to submit feedback. Please try again.");
            } finally {
              setIsSubmitting(false);
            }
  };

  return (
    <div className="relative min-h-screen bg-white px-5 py-10 flex flex-col items-center">
  {/* Toast Card */}
  {showToast && (
    <div className="absolute inset-0 flex justify-center items-center z-50">
      {/* Slight Blur Behind */}
      <div className="absolute inset-0 backdrop-blur-[2px] bg-white/10"></div>

      {/* Toast Card */}
      <div className="relative bg-white shadow-lg rounded-2xl p-5 w-[90%] max-w-sm text-center border border-gray-100 animate-slide-down">
        <div className="flex justify-center items-center w-14 h-14 mx-auto mb-3 bg-blue-50 rounded-full">
          <Send className="w-7 h-7 text-blue-500" />
        </div>
        <h2 className="text-base font-semibold">Thank you for your feedback!</h2>
        <p className="text-gray-500 text-sm mt-1 mb-4">
          We appreciate your time in helping us improve 💬
        </p>
        <button
          onClick={() => setShowToast(false)}
          className="bg-black text-white rounded-full px-5 py-2 text-sm font-medium hover:bg-gray-800 transition"
        >
          Close
        </button>
      </div>
    </div>
  )}
      {/* Main Content */}
      <div className="relative z-10 w-full max-w-md">
        {/* Header */}
        <div className="flex items-center space-x-2 mb-6">
          <button
            onClick={() => window.history.back()}
            className="text-gray-700 text-lg font-medium"
          >
              <IoArrowBack />
          </button>
          <h1 className="text-lg font-semibold">Review Us</h1>
        </div>

        {/* Feedback Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Textarea */}
          <div>
            <label className="text-gray-800 font-medium block mb-2">
              Please tell us how was your experience with us:
            </label>
            <textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              rows={4}
              className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-400 focus:outline-none"
              placeholder="Type your feedback here..."
            />
          </div>

          {/* Rating */}
          <div>
            <p className="text-gray-800 font-medium mb-2">Rate your experience</p>
            <div className="flex items-center space-x-2 mb-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHover(star)}
                  onMouseLeave={() => setHover(0)}
                  className={`w-8 h-8 cursor-pointer transition ${
                    (hover || rating) >= star
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300"
                  }`}
                />
              ))}
            </div>
            <p className="text-gray-500 text-sm">
              {rating > 0 ? `"${ratingLabels[rating - 1]}"` : ""}
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className={`w-full py-3 rounded-xl text-white font-semibold transition flex items-center justify-center gap-2 ${
              (rating || review) && !isSubmitting
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-gray-300 cursor-not-allowed"
            }`}
            disabled={(!rating && !review) || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
