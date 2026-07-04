import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
  increment,
  updateDoc,
} from "firebase/firestore";
import { db } from "../config/firebase";

/**
 * Generates a URL-friendly unique share ID.
 * Uses timestamp + random chars for uniqueness and readability.
 */
export const generateShareId = () => {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).slice(2, 8);
  return `${timestamp}${randomPart}`;
};

/**
 * Creates a new share document in Firestore.
 * Uses the shareId as the document ID for efficient direct lookups.
 * @param {Object} params
 * @param {string} params.userId - The UID of the sharing user
 * @param {string} params.contentType - "text" | "files" | "mixed"
 * @param {string} [params.text] - Shared text content
 * @param {string[]} [params.imageUrls] - Array of Cloudinary image URLs
 * @returns {Promise<Object>} The created share data with shareId and URL
 */
export const createShare = async ({ userId, contentType, text, imageUrls }) => {
  const shareId = generateShareId();

  const shareData = {
    shareId,
    userId,
    contentType,
    text: text || "",
    imageUrls: imageUrls || [],
    createdAt: serverTimestamp(),
    isPublic: true,
    accessCount: 0,
  };

  // Use shareId as the document ID for O(1) lookups — no index needed
  await setDoc(doc(db, "shares", shareId), shareData);

  return {
    id: shareId,
    shareId,
    url: `/share/${shareId}`,
    ...shareData,
  };
};

/**
 * Fetches a share document by its shareId.
 * Direct document lookup — no query needed since shareId IS the document ID.
 * @param {string} shareId - The share ID to look up
 * @returns {Promise<Object|null>} The share data or null if not found
 */
export const getShareByShareId = async (shareId) => {
  const docSnap = await getDoc(doc(db, "shares", shareId));

  if (!docSnap.exists()) {
    return null;
  }

  const data = docSnap.data();

  // Increment access count (fire-and-forget)
  updateDoc(doc(db, "shares", shareId), {
    accessCount: increment(1),
  }).catch(() => {});

  return {
    id: docSnap.id,
    ...data,
    createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
  };
};
