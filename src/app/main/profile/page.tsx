"use client";
import { useRouter } from "next/navigation";
import {
  Heart,
  MapPin,
  Info,
  LogOut,
  FileText,
  User,
  FileLock,
  FileQuestion,
  Share2,
  Star,
  Handshake,
  History,
  Calendar,
  Mail,
  Phone,
  Users,
} from "lucide-react";
import { IoArrowBack } from "react-icons/io5";
import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Image from "next/image";
import { getTryOnHistory, getFavorites, getUserProfile } from "@/lib/firebase/userActivity";

export default function ProfilePage() {
  const router = useRouter();
  const { user, userProfile, signOut } = useAuth();
  const [photoURL, setPhotoURL] = useState<string | null>(null);
  const [stats, setStats] = useState({
    tryOnCount: 0,
    favoritesCount: 0,
    loading: true,
  });
  const [fullProfile, setFullProfile] = useState<any>(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showFeedbackPopup, setShowFeedbackPopup] = useState(false);

  useEffect(() => {
    // Set photo from Firebase Auth, userProfile, or fullProfile
    if (user?.photoURL) {
      setPhotoURL(user.photoURL);
    } else if (userProfile?.photoURL) {
      setPhotoURL(userProfile.photoURL);
    } else if (fullProfile?.photoURL) {
      setPhotoURL(fullProfile.photoURL);
    }

    // Load user stats and profile data
    if (user) {
      loadUserData();
    }

    // Clean up any leftover logout flow flags
    localStorage.removeItem("cameFromLogout");
  }, [user, userProfile, fullProfile]);

  const loadUserData = async () => {
    if (!user) return;

    try {
      // Load stats
      const [historyData, favoritesData, profileData] = await Promise.all([
        getTryOnHistory(user.uid),
        getFavorites(user.uid),
        getUserProfile(user.uid),
      ]);

      setStats({
        tryOnCount: historyData.length,
        favoritesCount: favoritesData.length,
        loading: false,
      });

      setFullProfile(profileData);
    } catch (error) {
      console.error("Error loading user data:", error);
      setStats(prev => ({ ...prev, loading: false }));
    }
  };

  // ✅ Function to navigate to any route
  const handleNavigation = (path: string) => {
    router.push(path);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="relative flex items-center justify-center py-4 bg-white shadow-sm mb-4">
        <button
          type="button"
          className="absolute left-3 text-xl"
          onClick={() => window.history.back()}
        >
          <IoArrowBack />
        </button>
        <h2 className="text-xl font-semibold">Profile</h2>
      </div>

      {/* Profile Section */}
      <div className="flex flex-col items-center mt-4 px-6">
        <div className="relative">
          {/* Circle Avatar */}
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
              <User size={48} className="text-white" />
            )}
          </div>

        </div>

        <h2 className="mt-3 text-xl font-bold text-gray-800">
          {userProfile
            ? `${userProfile.firstName} ${userProfile.lastName}`
            : user?.displayName || "User"}
        </h2>
        <p className="text-gray-500 text-sm">{user?.email || ""}</p>

        {/* User Stats Cards */}
        <div className="grid grid-cols-2 gap-3 w-full mt-6 mb-4">
          {/* Try-Ons Card */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-1">
              <History className="w-4 h-4 text-blue-600" />
              <span className="text-xs text-gray-500">Try-Ons</span>
            </div>
            <p className="text-2xl font-bold text-gray-800">
              {stats.loading ? "..." : stats.tryOnCount}
            </p>
          </div>

          {/* Favorites Card */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-1">
              <Heart className="w-4 h-4 text-red-500" />
              <span className="text-xs text-gray-500">Favorites</span>
            </div>
            <p className="text-2xl font-bold text-gray-800">
              {stats.loading ? "..." : stats.favoritesCount}
            </p>
          </div>
        </div>

        {/* Account Details Card */}
        <div className="w-full bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <User className="w-4 h-4" />
            Account Details
          </h3>
          
          <div className="space-y-3">
            {/* Email */}
            <div className="flex items-center gap-3 text-sm">
              <Mail className="w-4 h-4 text-gray-400" />
              <div className="flex-1">
                <p className="text-xs text-gray-500">Email</p>
                <p className="text-gray-800 font-medium">{user?.email || "Not provided"}</p>
              </div>
            </div>

            {/* Phone */}
            {fullProfile?.phoneNumber && (
              <div className="flex items-center gap-3 text-sm">
                <Phone className="w-4 h-4 text-gray-400" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500">Phone</p>
                  <p className="text-gray-800 font-medium">{fullProfile.phoneNumber}</p>
                </div>
              </div>
            )}

            {/* Gender */}
            {fullProfile?.gender && (
              <div className="flex items-center gap-3 text-sm">
                <Users className="w-4 h-4 text-gray-400" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500">Gender</p>
                  <p className="text-gray-800 font-medium capitalize">{fullProfile.gender}</p>
                </div>
              </div>
            )}

            {/* Member Since */}
            {user?.metadata?.creationTime && (
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="w-4 h-4 text-gray-400" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500">Member Since</p>
                  <p className="text-gray-800 font-medium">
                    {new Date(user.metadata.creationTime).toLocaleDateString('en-US', {
                      month: 'short',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            )}

            {/* Location */}
            {fullProfile?.location && (
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="w-4 h-4 text-gray-400" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500">Location</p>
                  <p className="text-gray-800 font-medium">{fullProfile.location}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Options List */}
      <div className="mt-2 space-y-2 px-6 pb-20">
        <ProfileItem
          icon={<History size={20} />}
          label="Try-On History"
          onClick={() => handleNavigation("/main/profile/history")}
        />
        <ProfileItem
          icon={<Heart size={20} />}
          label="Favourites"
          onClick={() => handleNavigation("/main/profile/favourites")}
        />
        <ProfileItem
          icon={<MapPin size={20} />}
          label="Location"
          onClick={() => handleNavigation("/main/profile/location")}
        />
        <ProfileItem
          icon={<Info size={20} />}
          label="About"
          onClick={() => handleNavigation("/main/profile/about")}
        />
        <ProfileItem
          icon={<FileLock size={20} />}
          label="Privacy Policy"
          onClick={() => handleNavigation("/main/profile/privacy")}
        />
        <ProfileItem
          icon={<FileText size={20} />}
          label="Terms & Conditions"
          onClick={() => handleNavigation("/main/profile/term")}
        />
        <ProfileItem
          icon={<FileQuestion size={20} />}
          label="FAQ"
          onClick={() => handleNavigation("/main/profile/FAQ")}
        />
        <ProfileItem
          icon={<Star size={20} />}
          label="Rate Us"
          onClick={() => handleNavigation("/main/profile/rate")}
        />
        <ProfileItem
          icon={<Share2 size={20} />}
          label="Connect With Us"
          onClick={() => setShowFeedbackPopup(true)}
        />
        <ProfileItem
          icon={<Handshake size={20} />}
          label="Partner With Us"
          onClick={() => handleNavigation("/main/profile/partner")}
        />

        {/* Logout Button - Prominent at Bottom */}
        <div className="mt-6">
          <button
            onClick={() => {
              // Directly show logout confirmation modal
              setShowLogoutModal(true);
            }}
            className="w-full flex items-center justify-center gap-3 bg-red-50 border-2 border-red-200 text-red-600 rounded-xl px-4 py-4 hover:bg-red-100 hover:border-red-300 transition font-medium shadow-sm"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Feedback Popup - Shown from Connect With Us (Center) */}
      {showFeedbackPopup && (
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
                  setShowFeedbackPopup(false);
                  // Navigate to feedback page
                  router.push("/main/profile/rate");
                }}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition"
              >
                Give Feedback
              </button>
              <button
                onClick={() => {
                  setShowFeedbackPopup(false);
                  // Navigate to connect page
                  router.push("/main/profile/connect");
                }}
                className="flex-1 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-medium transition"
              >
                Connect
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm animate-in fade-in duration-200">
            <h2 className="text-xl font-semibold text-gray-800 mb-2 text-center">
              Are you sure you wanna logout?
            </h2>
            <p className="text-gray-600 text-center mb-6">
              Let's try more outfits together
            </p>
            <div className="flex gap-3">
              <button
                onClick={async () => {
                  await signOut();
                  setShowLogoutModal(false);
                }}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
              >
                Yes
              </button>
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 px-4 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition font-medium"
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ✅ Fixed component typing (no TS errors)
function ProfileItem({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between bg-white border border-gray-100 rounded-xl px-4 py-4 shadow-sm hover:bg-gray-50 transition"
    >
      <div className="flex items-center gap-3 text-gray-700">
        <div className="p-2 bg-gray-100 rounded-lg">
          {icon}
        </div>
        <span className="text-sm font-medium">{label}</span>
      </div>
      <span className="text-gray-400 text-lg">&rsaquo;</span>
    </button>
  );
}
