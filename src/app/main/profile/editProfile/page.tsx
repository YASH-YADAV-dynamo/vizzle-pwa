"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { getUserProfile, updateUserProfile } from "@/lib/firebase/userActivity";
import { toast } from "react-hot-toast";
import { IoArrowBack } from "react-icons/io5";
import { Camera, Loader2 } from "lucide-react";
import Image from "next/image";
import { storage } from "@/firebase/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { updateProfile } from "firebase/auth";

export default function EditProfilePage() {
  const router = useRouter();
  const { user, refreshUserProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoURL, setPhotoURL] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    gender: "",
    location: "",
  });

  useEffect(() => {
    loadUserData();
  }, [user]);

  const loadUserData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const profile = await getUserProfile(user.uid);
      
      if (profile) {
        setFormData({
          firstName: profile.firstName || "",
          lastName: profile.lastName || "",
          phoneNumber: profile.phoneNumber || "",
          gender: profile.gender || "",
          location: profile.location || "",
        });
        // Load photo from profile or user auth
        setPhotoURL(profile.photoURL || user.photoURL || null);
      } else {
        // If no profile, use auth photo
        setPhotoURL(user.photoURL || null);
      }
    } catch (error) {
      console.error("Error loading profile:", error);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size should be less than 5MB");
        return;
      }
      
      // Preview image immediately
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoURL(reader.result as string);
      };
      reader.readAsDataURL(file);
      
      // Store file for upload on save
      setPhotoFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("User not authenticated");
      return;
    }

    if (!formData.firstName.trim()) {
      toast.error("First name is required");
      return;
    }

    try {
      setSaving(true);

      let uploadedPhotoURL = photoURL;

      // Upload photo to Firebase Storage if a new file was selected
      if (photoFile && user) {
        setUploadingPhoto(true);
        try {
          const storageRef = ref(storage, `profile-photos/${user.uid}/${Date.now()}_${photoFile.name}`);
          const snapshot = await uploadBytes(storageRef, photoFile);
          uploadedPhotoURL = await getDownloadURL(snapshot.ref);
          
          // Update Firebase Auth profile photo
          await updateProfile(user, { photoURL: uploadedPhotoURL });
          
          setPhotoURL(uploadedPhotoURL);
          toast.success("Photo uploaded successfully!");
        } catch (uploadError) {
          console.error("Error uploading photo:", uploadError);
          toast.error("Failed to upload photo, but profile was updated");
        } finally {
          setUploadingPhoto(false);
        }
      }

      // Update profile data in Firestore
      await updateUserProfile(user.uid, {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        gender: formData.gender,
        location: formData.location.trim(),
        photoURL: uploadedPhotoURL || undefined,
      });

      // Refresh user profile in context
      await refreshUserProfile();

      toast.success("Profile updated successfully!");
      
      // Navigate back after short delay
      setTimeout(() => {
        router.push("/main/profile");
      }, 1000);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
      setPhotoFile(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="relative flex items-center justify-center py-4 bg-white shadow-sm mb-6">
        <button
          type="button"
          className="absolute left-3 text-xl"
          onClick={() => router.back()}
        >
          <IoArrowBack />
        </button>
        <h2 className="text-xl font-semibold">Edit Profile</h2>
      </div>

      <div className="max-w-md mx-auto px-6 pb-20">
        {/* Profile Photo Section */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center overflow-hidden border-4 border-white shadow-lg">
              {photoURL ? (
                <Image
                  src={photoURL}
                  alt="Profile"
                  width={96}
                  height={96}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-3xl text-white font-bold">
                  {formData.firstName?.[0]?.toUpperCase() || "U"}
                </span>
              )}
            </div>
            
            <label
              htmlFor="photo-upload"
              className="absolute bottom-0 right-0 bg-blue-600 p-2 rounded-full shadow-md hover:bg-blue-700 transition cursor-pointer"
            >
              <Camera size={16} className="text-white" />
              <input
                id="photo-upload"
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Email Display (Read-only) */}
        <div className="mb-4 p-4 bg-gray-100 rounded-lg">
          <p className="text-xs text-gray-500 mb-1">Email (cannot be changed)</p>
          <p className="text-sm font-medium text-gray-700">{user?.email}</p>
        </div>

        {/* Edit Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* First Name */}
          <div>
            <label
              htmlFor="firstName"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              First Name *
            </label>
            <input
              id="firstName"
              name="firstName"
              type="text"
              required
              value={formData.firstName}
              onChange={handleChange}
              placeholder="Enter your first name"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Last Name */}
          <div>
            <label
              htmlFor="lastName"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Last Name
            </label>
            <input
              id="lastName"
              name="lastName"
              type="text"
              value={formData.lastName}
              onChange={handleChange}
              placeholder="Enter your last name"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Phone Number */}
          <div>
            <label
              htmlFor="phoneNumber"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Phone Number
            </label>
            <input
              id="phoneNumber"
              name="phoneNumber"
              type="tel"
              value={formData.phoneNumber}
              onChange={handleChange}
              placeholder="+1 234 567 8900"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Gender */}
          <div>
            <label
              htmlFor="gender"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Gender
            </label>
            <select
              id="gender"
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
              <option value="prefer_not_to_say">Prefer not to say</option>
            </select>
          </div>

          {/* Location */}
          <div>
            <label
              htmlFor="location"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Location
            </label>
            <input
              id="location"
              name="location"
              type="text"
              value={formData.location}
              onChange={handleChange}
              placeholder="City, Country"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={saving || uploadingPhoto}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
            >
              {(saving || uploadingPhoto) ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {uploadingPhoto ? "Uploading photo..." : "Saving..."}
                </>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>

          {/* Cancel Button */}
          <button
            type="button"
            onClick={() => router.back()}
            className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200 transition font-medium"
          >
            Cancel
          </button>
        </form>
      </div>
    </div>
  );
}
