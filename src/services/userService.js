import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../config/firebase";

const USERS_COLLECTION = "users";

/**
 * Creates or updates a user profile document in Firestore.
 * Uses Firebase UID as the document ID to prevent duplicates.
 */
export const createOrUpdateUserProfile = async ({ uid, fullName, email }) => {
  const userRef = doc(db, USERS_COLLECTION, uid);
  const existing = await getDoc(userRef);

  if (existing.exists()) {
    // Update only changed fields
    await setDoc(
      userRef,
      {
        fullName,
        email,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } else {
    // Create new user document
    await setDoc(userRef, {
      uid,
      fullName,
      email,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
};

/**
 * Fetches a user profile from Firestore by UID.
 * Returns null if not found.
 */
export const getUserProfile = async (uid) => {
  const userRef = doc(db, USERS_COLLECTION, uid);
  const docSnap = await getDoc(userRef);

  if (!docSnap.exists()) {
    return null;
  }

  return docSnap.data();
};

/**
 * Gets the display name for a user, preferring fullName from Firestore
 * and falling back to Firebase Auth displayName or email.
 */
export const getDisplayName = (userProfile, authUser) => {
  if (userProfile?.fullName) return userProfile.fullName;
  if (authUser?.displayName) return authUser.displayName;
  if (authUser?.email) return authUser.email;
  return "User";
};

/**
 * Gets initials from a display name.
 */
export const getInitials = (name) => {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};
