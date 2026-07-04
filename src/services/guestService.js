import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteField,
  arrayRemove,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../config/firebase";

const GUEST_COLLECTION = "guest_shared_data";

/**
 * Gets the guest shared data document.
 * Uses a single document for the collaborative guest board.
 */
const getGuestDocRef = () => doc(db, GUEST_COLLECTION, "board");

/**
 * Fetches the guest shared data (one-time read).
 */
export const getGuestData = async () => {
  const docRef = getGuestDocRef();
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return { text: "", imageUrls: [] };
  }

  return docSnap.data();
};

/**
 * Subscribes to real-time guest data updates.
 * @param {Function} callback - Called with { text, imageUrls } on every update
 * @param {Function} onError - Called on error
 * @returns {Function} Unsubscribe function
 */
export const subscribeToGuestData = (callback, onError) => {
  const docRef = getGuestDocRef();

  return onSnapshot(
    docRef,
    (docSnap) => {
      if (docSnap.exists()) {
        callback(docSnap.data());
      } else {
        callback({ text: "", imageUrls: [] });
      }
    },
    (error) => {
      console.error("Guest data subscription error:", error);
      if (onError) onError(error);
    }
  );
};

/**
 * Saves text to the guest board.
 */
export const saveGuestText = async (text) => {
  const docRef = getGuestDocRef();
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    await updateDoc(docRef, {
      text,
      updatedAt: serverTimestamp(),
      updatedBy: "guest",
    });
  } else {
    await setDoc(docRef, {
      text,
      imageUrls: [],
      createdBy: "guest",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
};

/**
 * Clears text from the guest board.
 */
export const clearGuestText = async () => {
  const docRef = getGuestDocRef();
  await updateDoc(docRef, {
    text: deleteField(),
    updatedAt: serverTimestamp(),
    updatedBy: "guest",
  });
};

/**
 * Saves image URLs to the guest board.
 */
export const saveGuestImages = async (imageUrls) => {
  const docRef = getGuestDocRef();
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    const existing = docSnap.data().imageUrls || [];
    await updateDoc(docRef, {
      imageUrls: [...existing, ...imageUrls],
      updatedAt: serverTimestamp(),
      updatedBy: "guest",
    });
  } else {
    await setDoc(docRef, {
      text: "",
      imageUrls,
      createdBy: "guest",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
};

/**
 * Clears all image URLs from the guest board.
 */
export const clearGuestImages = async () => {
  const docRef = getGuestDocRef();
  await updateDoc(docRef, {
    imageUrls: deleteField(),
    updatedAt: serverTimestamp(),
    updatedBy: "guest",
  });
};

/**
 * Removes a single image URL from the guest board.
 */
export const removeGuestImage = async (imageUrl) => {
  const docRef = getGuestDocRef();
  await updateDoc(docRef, {
    imageUrls: arrayRemove(imageUrl),
    updatedAt: serverTimestamp(),
    updatedBy: "guest",
  });
};
