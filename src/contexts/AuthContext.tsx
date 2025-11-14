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

  // Handle redirect result globally (for PWA and Web authentication)
  // This processes the result when user returns from Google sign-in in external browser
  useEffect(() => {
    if (typeof window === 'undefined' || !auth) return;

    const handleRedirectResult = async () => {
      try {
        console.log('🔍 Checking for Google sign-in redirect result...');
        console.log('  - Current URL:', window.location.href);
        console.log('  - Current Origin:', window.location.origin);
        
        // Check if we're returning from a redirect
        const redirectInProgress = sessionStorage.getItem('authRedirectInProgress');
        const redirectProvider = sessionStorage.getItem('authRedirectProvider');
        const redirectTimestamp = sessionStorage.getItem('authRedirectTimestamp');
        const redirectOrigin = sessionStorage.getItem('authRedirectOrigin');
        
        if (redirectInProgress) {
          console.log('  - ✅ Redirect in progress detected');
          console.log('  - Provider:', redirectProvider);
          console.log('  - Original Origin:', redirectOrigin);
          console.log('  - Timestamp:', redirectTimestamp);
        }
        
        // Only process if redirect was initiated recently (within 5 minutes)
        if (redirectTimestamp) {
          const timeDiff = Date.now() - parseInt(redirectTimestamp);
          if (timeDiff > 5 * 60 * 1000) {
            // Redirect too old, clear it
            console.log('  - ⏰ Redirect too old (5+ minutes), clearing flags');
            sessionStorage.removeItem('authRedirectInProgress');
            sessionStorage.removeItem('authRedirectProvider');
            sessionStorage.removeItem('authRedirectTimestamp');
            sessionStorage.removeItem('authRedirectOrigin');
            sessionStorage.removeItem('authRedirectPath');
            return;
          }
        }

        // Get redirect result from Firebase
        // This will return the user data if we're coming back from Google sign-in
        console.log('  - 🔄 Getting redirect result from Firebase...');
        const result = await getRedirectResult(auth);
        
        if (result && result.user) {
          console.log('✅ Google sign-in successful! User returned from browser.');
          console.log('  - User ID:', result.user.uid);
          console.log('  - Email:', result.user.email);
          console.log('  - Display Name:', result.user.displayName);
          console.log('  - Provider:', result.user.providerData[0]?.providerId);
          
          // Set user immediately so auth state updates
          setUser(result.user);
          
          // Create/update user profile in Firestore
          const userDocRef = doc(firestore, "users", result.user.uid);
          const userDoc = await getDoc(userDocRef);
          
          const providerId = result.user.providerData[0]?.providerId || "google.com";
          const isGoogleSignIn = providerId === "google.com";
          const isFacebookSignIn = providerId === "facebook.com";

          if (!userDoc.exists()) {
            console.log('  - 📝 Creating new user profile...');
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
            console.log('  - ✅ User profile created in Firestore');
          } else {
            console.log('  - 📝 Updating existing user profile...');
            // Update existing profile
            const existingData = userDoc.data();
            await setDoc(userDocRef, {
              ...existingData,
              photoURL: result.user.photoURL || existingData.photoURL,
              providers: existingData.providers?.includes(providerId)
                ? existingData.providers
                : [...(existingData.providers || []), providerId],
            }, { merge: true });
            console.log('  - ✅ User profile updated in Firestore');
          }

          // Fetch the updated profile
          await fetchUserProfile(result.user.uid);
          
          // Clear redirect flags
          sessionStorage.removeItem('authRedirectInProgress');
          sessionStorage.removeItem('authRedirectProvider');
          sessionStorage.removeItem('authRedirectTimestamp');
          sessionStorage.removeItem('authRedirectOrigin');
          sessionStorage.removeItem('authRedirectPath');
          
          console.log('  - 🚀 Redirecting to /main...');
          
          // Immediately redirect to main page
          // Use window.location.href for a full page reload to ensure clean state
          window.location.href = "/main";
        } else {
          // No redirect result - this is normal if not returning from auth
          if (redirectInProgress) {
            console.log('  - ⏳ No redirect result yet, but redirect was in progress');
            // Check if redirect was recent (might still be processing)
            if (redirectTimestamp) {
              const timeDiff = Date.now() - parseInt(redirectTimestamp);
              // If redirect was initiated less than 10 seconds ago, wait a bit
              if (timeDiff < 10000) {
                console.log('  - ⏱️ Redirect was recent (' + Math.round(timeDiff/1000) + 's ago), checking again in 1 second...');
                // Still might be processing, check again in a moment
                setTimeout(() => {
                  handleRedirectResult();
                }, 1000);
                return;
              }
            }
            // Redirect seems to have failed or timed out
            console.log('  - ⚠️ Redirect timed out or failed, clearing flags');
            sessionStorage.removeItem('authRedirectInProgress');
            sessionStorage.removeItem('authRedirectProvider');
            sessionStorage.removeItem('authRedirectTimestamp');
            sessionStorage.removeItem('authRedirectOrigin');
            sessionStorage.removeItem('authRedirectPath');
          } else {
            console.log('  - ℹ️ No redirect result (normal if not returning from auth)');
          }
        }
      } catch (error: any) {
        console.error("❌ Error processing redirect result:", error);
        console.error("  - Error code:", error.code);
        console.error("  - Error message:", error.message);
        console.error("  - Error stack:", error.stack);
        
        // Clear redirect flags on error
        sessionStorage.removeItem('authRedirectInProgress');
        sessionStorage.removeItem('authRedirectProvider');
        sessionStorage.removeItem('authRedirectTimestamp');
        sessionStorage.removeItem('authRedirectOrigin');
        sessionStorage.removeItem('authRedirectPath');
        
        // Show error to user if possible
        if (error.code === 'auth/account-exists-with-different-credential') {
          alert('An account already exists with this email. Please use a different sign-in method.');
        } else if (error.code === 'auth/unauthorized-domain') {
          const currentDomain = window.location.hostname;
          alert(`Domain "${currentDomain}" not authorized. Please add it to Firebase Console > Authentication > Settings > Authorized domains.`);
        } else if (error.message?.includes('origins don\'t match')) {
          const currentDomain = window.location.hostname;
          alert(`Origin mismatch. Please add "${currentDomain}" to Firebase Console. See FIREBASE_LOCALHOST_FIX.md for instructions.`);
        } else {
          console.error('  - Unknown error occurred during redirect processing');
        }
      }
    };

    // Handle redirect result on mount (when page loads after redirect)
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

