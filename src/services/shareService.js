import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
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
 * Finds an existing share document for a given user.
 * Queries the shares collection by userId — one query per user max.
 * @param {string} userId - The UID of the sharing user
 * @returns {Promise<Object|null>} The share data or null if not found
 */
export const getShareByUserId = async (userId) => {
  const q = query(
    collection(db, "shares"),
    where("userId", "==", userId)
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const shareDoc = snapshot.docs[0];
  const data = shareDoc.data();
  return {
    id: shareDoc.id,
    ...data,
    createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
  };
};

/**
 * Creates or updates a share document for a user.
 * If the user already has a share document, it is updated (preserving shareId and createdAt).
 * Otherwise, a new share document is created.
 * Each authenticated user has at most one active share document.
 * @param {Object} params
 * @param {string} params.userId - The UID of the sharing user
 * @param {string} params.contentType - "text" | "files" | "mixed"
 * @param {string} [params.text] - Shared text content
 * @param {string[]} [params.imageUrls] - Array of Cloudinary image URLs
 * @returns {Promise<Object>} The share data with shareId and URL
 */
export const createShare = async ({ userId, contentType, text, imageUrls }) => {
  // Check for existing share document for this user
  const existing = await getShareByUserId(userId);

  if (existing) {
    // Update existing document — preserve shareId and createdAt
    const updateData = {
      contentType,
      text: text || "",
      imageUrls: imageUrls || [],
      updatedAt: serverTimestamp(),
    };
    await updateDoc(doc(db, "shares", existing.id), updateData);

    return {
      id: existing.id,
      shareId: existing.shareId,
      url: `/share/${existing.shareId}`,
      isNew: false,
      ...existing,
      ...updateData,
    };
  }

  // No existing share — create a new one
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
    isNew: true,
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
