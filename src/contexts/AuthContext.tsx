"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged, signOut as firebaseSignOut, getRedirectResult } from "firebase/auth";
import { auth, firestore } from "@/firebase/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

interface UserProfile {
  firstName: string;
  lastName: string;
  gender: string;
  email: string;
  phoneNumber?: string;
  photoURL?: string;
  providers: string[];
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  loading: true,
  signOut: async () => {},
  refreshUserProfile: async () => {},
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchUserProfile = async (uid: string) => {
    try {
      const userDocRef = doc(firestore, "users", uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        setUserProfile(userDoc.data() as UserProfile);
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  };

  const refreshUserProfile = async () => {
    if (user) {
      await fetchUserProfile(user.uid);
    }
  };

  // Handle redirect result globally (for PWA authentication)
  useEffect(() => {
    if (typeof window === 'undefined' || !auth) return;

    const handleRedirectResult = async () => {
      try {
        console.log('🔍 Checking for redirect result...');
        const result = await getRedirectResult(auth);
        
        if (result && result.user) {
          console.log('✅ Redirect authentication successful:', result.user.email);
          console.log('  - User ID:', result.user.uid);
          console.log('  - Provider:', result.user.providerData[0]?.providerId);
          
          // Set user immediately so auth state updates
          setUser(result.user);
          
          // Create/update user profile
          const userDocRef = doc(firestore, "users", result.user.uid);
          const userDoc = await getDoc(userDocRef);
          
          const providerId = result.user.providerData[0]?.providerId || "google.com";
          const isGoogleSignIn = providerId === "google.com";
          const isFacebookSignIn = providerId === "facebook.com";

          if (!userDoc.exists()) {
            // Create new profile
            let finalFirstName = "";
            let finalLastName = "";
            
            if ((isGoogleSignIn || isFacebookSignIn) && result.user.displayName) {
              const nameParts = result.user.displayName.split(" ");
              finalFirstName = nameParts[0] || "";
              finalLastName = nameParts.slice(1).join(" ") || "";
            }

            const profileData: any = {
              firstName: finalFirstName,
              lastName: finalLastName,
              gender: "",
              email: result.user.email,
              provider: providerId,
              photoURL: result.user.photoURL || null,
              providers: [providerId],
            };
            
            await setDoc(userDocRef, profileData);
            console.log('✅ User profile created');
          } else {
            // Update existing profile
            const existingData = userDoc.data();
            await setDoc(userDocRef, {
              ...existingData,
              photoURL: result.user.photoURL || existingData.photoURL,
              providers: existingData.providers?.includes(providerId)
                ? existingData.providers
                : [...(existingData.providers || []), providerId],
            }, { merge: true });
            console.log('✅ User profile updated');
          }

          // Fetch the updated profile
          await fetchUserProfile(result.user.uid);
          
          // Clear the redirect flag
          sessionStorage.removeItem('authRedirectInProgress');
          
          // Wait a moment for state to update, then redirect
          setTimeout(() => {
            console.log('🔄 Redirecting to /main...');
            router.push("/main");
            // Force a hard navigation to ensure the redirect happens
            window.location.href = "/main";
          }, 100);
        } else {
          console.log('ℹ️ No redirect result found (normal if not returning from auth)');
          // Clear the redirect flag if it exists
          sessionStorage.removeItem('authRedirectInProgress');
        }
      } catch (error: any) {
        console.error("❌ Redirect result error:", error);
        console.error("Error code:", error.code);
        console.error("Error message:", error.message);
        console.error("Current origin:", typeof window !== 'undefined' ? window.location.origin : 'N/A');
        
        // Clear the redirect flag on error
        sessionStorage.removeItem('authRedirectInProgress');
        
        // Don't set error state here as this is a global handler
        // Individual pages can handle their own errors
      }
    };

    // Only handle redirect result once on mount
    // But also check if we're returning from a redirect
    const redirectInProgress = sessionStorage.getItem('authRedirectInProgress');
    if (redirectInProgress) {
      console.log('🔄 Redirect in progress detected, processing result...');
    }
    
    handleRedirectResult();
  }, [router]);

  useEffect(() => {
    if (typeof window === 'undefined' || !auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        await fetchUserProfile(firebaseUser.uid);
      } else {
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      if (auth) {
        await firebaseSignOut(auth);
        setUser(null);
        setUserProfile(null);
        router.push("/auth/login");
      }
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, userProfile, loading, signOut, refreshUserProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

