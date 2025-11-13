/**
 * Firebase service for managing user activities
 * - Try-on history
 * - Favorites/Wishlist
 * - Feedback
 */

import { firestore } from "@/firebase/firebase";
import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
  query,
  where,
  getDocs,
  deleteDoc,
} from "firebase/firestore";

// ============= Types =============
export interface TryOnHistory {
  id: string;
  humanImage: string;
  garmentImage: string;
  resultImage: string;
  garmentName: string;
  garmentType: string;
  timestamp: any;
}

export interface Favorite {
  id: number;
  name: string;
  image: string;
  category: string;
  addedAt: string | null; // ISO string timestamp
}

export interface Feedback {
  id: string;
  rating: number;
  comment: string;
  timestamp: any;
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  comment: string;
  productId?: number | null; // Optional: for product-specific comments
  productName?: string | null;
  timestamp: any;
}

// ============= Try-On History =============

/**
 * Save a try-on result to user's history
 */
export async function saveTryOnHistory(
  userId: string,
  historyData: Omit<TryOnHistory, "id" | "timestamp">
): Promise<void> {
  try {
    const historyRef = collection(firestore, "users", userId, "tryOnHistory");
    const newHistoryDoc = doc(historyRef);
    
    await setDoc(newHistoryDoc, {
      ...historyData,
      id: newHistoryDoc.id,
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error saving try-on history:", error);
    throw error;
  }
}

/**
 * Get user's try-on history
 */
export async function getTryOnHistory(userId: string): Promise<TryOnHistory[]> {
  try {
    const historyRef = collection(firestore, "users", userId, "tryOnHistory");
    const q = query(historyRef);
    const querySnapshot = await getDocs(q);
    
    const history: TryOnHistory[] = [];
    querySnapshot.forEach((doc) => {
      history.push(doc.data() as TryOnHistory);
    });
    
    // Sort by timestamp descending (most recent first)
    return history.sort((a, b) => {
      const timeA = a.timestamp?.toMillis() || 0;
      const timeB = b.timestamp?.toMillis() || 0;
      return timeB - timeA;
    });
  } catch (error) {
    console.error("Error getting try-on history:", error);
    return [];
  }
}

/**
 * Delete a try-on history item
 */
export async function deleteTryOnHistory(userId: string, historyId: string): Promise<void> {
  try {
    const historyDocRef = doc(firestore, "users", userId, "tryOnHistory", historyId);
    await deleteDoc(historyDocRef);
  } catch (error) {
    console.error("Error deleting try-on history:", error);
    throw error;
  }
}

// ============= Favorites/Wishlist =============

/**
 * Add product to user's favorites
 */
export async function addToFavorites(userId: string, product: Favorite): Promise<void> {
  try {
    const userDocRef = doc(firestore, "users", userId);
    
    // Check if document exists first
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      // Create document if it doesn't exist
      await setDoc(userDocRef, {
        favorites: [{
          ...product,
          addedAt: new Date().toISOString(),
        }],
      });
    } else {
      // Use a regular timestamp instead of serverTimestamp() with arrayUnion
      await updateDoc(userDocRef, {
        favorites: arrayUnion({
          ...product,
          addedAt: new Date().toISOString(),
        }),
      });
    }
  } catch (error: any) {
    console.error("Error adding to favorites:", error);
    throw error;
  }
}

/**
 * Remove product from user's favorites
 */
export async function removeFromFavorites(userId: string, productId: number): Promise<void> {
  try {
    const userDocRef = doc(firestore, "users", userId);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      const favorites = userDoc.data().favorites || [];
      const updatedFavorites = favorites.filter((fav: Favorite) => fav.id !== productId);
      
      await updateDoc(userDocRef, {
        favorites: updatedFavorites,
      });
    }
  } catch (error) {
    console.error("Error removing from favorites:", error);
    throw error;
  }
}

/**
 * Get user's favorites
 */
export async function getFavorites(userId: string): Promise<Favorite[]> {
  try {
    const userDocRef = doc(firestore, "users", userId);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      return userDoc.data().favorites || [];
    }
    return [];
  } catch (error) {
    console.error("Error getting favorites:", error);
    return [];
  }
}

/**
 * Check if product is in favorites
 */
export async function isInFavorites(userId: string, productId: number): Promise<boolean> {
  try {
    const favorites = await getFavorites(userId);
    return favorites.some((fav) => fav.id === productId);
  } catch (error) {
    console.error("Error checking favorites:", error);
    return false;
  }
}

// ============= Feedback =============

/**
 * Submit user feedback
 */
export async function submitFeedback(
  userId: string,
  feedbackData: Omit<Feedback, "id" | "timestamp">
): Promise<void> {
  try {
    if (!userId) {
      throw new Error("User ID is required");
    }

    if (!feedbackData.rating && !feedbackData.comment) {
      throw new Error("Rating or comment is required");
    }

    const feedbackRef = collection(firestore, "users", userId, "feedback");
    const newFeedbackDoc = doc(feedbackRef);
    
    const feedbackToSave = {
      rating: feedbackData.rating || 0,
      comment: feedbackData.comment || "",
      id: newFeedbackDoc.id,
      timestamp: serverTimestamp(),
    };
    
    // Store feedback in Firebase
    await setDoc(newFeedbackDoc, feedbackToSave);
    
    // Verify the feedback was saved by reading it back
    const savedDoc = await getDoc(newFeedbackDoc);
    if (!savedDoc.exists()) {
      throw new Error("Failed to verify feedback was saved");
    }
    
    console.log("✅ Feedback submitted and verified successfully:", {
      feedbackId: newFeedbackDoc.id,
      userId: userId,
      rating: feedbackToSave.rating,
      hasComment: !!feedbackToSave.comment,
      path: `users/${userId}/feedback/${newFeedbackDoc.id}`
    });
  } catch (error: any) {
    console.error("❌ Error submitting feedback:", {
      error: error.message,
      userId: userId,
      feedbackData: feedbackData
    });
    throw error;
  }
}

/**
 * Get user's feedback history
 */
export async function getFeedback(userId: string): Promise<Feedback[]> {
  try {
    const feedbackRef = collection(firestore, "users", userId, "feedback");
    const q = query(feedbackRef);
    const querySnapshot = await getDocs(q);
    
    const feedback: Feedback[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      feedback.push({
        id: data.id || doc.id,
        rating: data.rating || 0,
        comment: data.comment || "",
        timestamp: data.timestamp,
      });
    });
    
    return feedback.sort((a, b) => {
      const timeA = a.timestamp?.toMillis?.() || a.timestamp || 0;
      const timeB = b.timestamp?.toMillis?.() || b.timestamp || 0;
      return timeB - timeA;
    });
  } catch (error) {
    console.error("Error getting feedback:", error);
    return [];
  }
}

// ============= Comments =============

/**
 * Submit a comment (can be general or product-specific)
 */
export async function submitComment(
  userId: string,
  userName: string,
  userEmail: string,
  commentData: Omit<Comment, "id" | "userId" | "userName" | "userEmail" | "timestamp">
): Promise<void> {
  try {
    const commentsRef = collection(firestore, "comments");
    const newCommentDoc = doc(commentsRef);
    
    await setDoc(newCommentDoc, {
      ...commentData,
      id: newCommentDoc.id,
      userId,
      userName,
      userEmail,
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error submitting comment:", error);
    throw error;
  }
}

/**
 * Get all comments (optionally filtered by productId)
 */
export async function getComments(productId?: number | null): Promise<Comment[]> {
  try {
    const commentsRef = collection(firestore, "comments");
    let q;
    
    if (productId !== undefined && productId !== null) {
      q = query(commentsRef, where("productId", "==", productId));
    } else {
      q = query(commentsRef);
    }
    
    const querySnapshot = await getDocs(q);
    const comments: Comment[] = [];
    
    querySnapshot.forEach((doc) => {
      comments.push(doc.data() as Comment);
    });
    
    return comments.sort((a, b) => {
      const timeA = a.timestamp?.toMillis() || 0;
      const timeB = b.timestamp?.toMillis() || 0;
      return timeB - timeA; // Most recent first
    });
  } catch (error) {
    console.error("Error getting comments:", error);
    return [];
  }
}

/**
 * Get user's comments
 */
export async function getUserComments(userId: string): Promise<Comment[]> {
  try {
    const commentsRef = collection(firestore, "comments");
    const q = query(commentsRef, where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    
    const comments: Comment[] = [];
    querySnapshot.forEach((doc) => {
      comments.push(doc.data() as Comment);
    });
    
    return comments.sort((a, b) => {
      const timeA = a.timestamp?.toMillis() || 0;
      const timeB = b.timestamp?.toMillis() || 0;
      return timeB - timeA;
    });
  } catch (error) {
    console.error("Error getting user comments:", error);
    return [];
  }
}

/**
 * Delete a comment (only by the user who created it or admin)
 */
export async function deleteComment(commentId: string): Promise<void> {
  try {
    const commentDocRef = doc(firestore, "comments", commentId);
    await deleteDoc(commentDocRef);
  } catch (error) {
    console.error("Error deleting comment:", error);
    throw error;
  }
}

// ============= User Profile Management =============

/**
 * Update user profile data
 */
export async function updateUserProfile(
  userId: string,
  profileData: Partial<{
    firstName: string;
    lastName: string;
    gender: string;
    photoURL: string;
    phoneNumber: string;
    location: string;
  }>
): Promise<void> {
  try {
    const userDocRef = doc(firestore, "users", userId);
    await updateDoc(userDocRef, profileData);
  } catch (error) {
    console.error("Error updating user profile:", error);
    throw error;
  }
}

/**
 * Get user profile data
 */
export async function getUserProfile(userId: string): Promise<any> {
  try {
    const userDocRef = doc(firestore, "users", userId);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      return userDoc.data();
    }
    return null;
  } catch (error) {
    console.error("Error getting user profile:", error);
    return null;
  }
}

