import { useEffect, useState, useRef, useCallback } from "react";
import {
  arrayUnion,
  arrayRemove,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { message } from "antd";
import { Link } from "react-router-dom";
import { db } from "../../config/firebase";
import { RxShare2, RxCross2, RxTrash, RxCheck } from "react-icons/rx";
import ImageLightbox from "../ui/ImageLightbox";
import {
  saveGuestImages,
  clearGuestImages,
  removeGuestImage,
  subscribeToGuestData,
} from "../../services/guestService";

/**
 * Extracts the Cloudinary public_id from a secure_url.
 */
const extractPublicId = (url) => {
  try {
    const parts = url.split("/");
    const uploadIndex = parts.indexOf("upload");
    if (uploadIndex === -1) return null;
    const pathAfterUpload = parts.slice(uploadIndex + 1).join("/");
    const withoutVersion = pathAfterUpload.replace(/^v\d+\//, "");
    const lastDotIndex = withoutVersion.lastIndexOf(".");
    return lastDotIndex > 0 ? withoutVersion.substring(0, lastDotIndex) : withoutVersion;
  } catch {
    return null;
  }
};

const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
const CLOUDINARY_API_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}`;

const deleteFromCloudinary = async (publicId) => {
  const res = await fetch(`${CLOUDINARY_API_URL}/image/destroy`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      public_id: publicId,
      upload_preset: CLOUDINARY_UPLOAD_PRESET,
    }),
  });
  return res.json();
};

const getFilesDocRef = (uid) => doc(db, "userFiles", uid);

const FilePanel = ({ user, onShareFiles }) => {
  // Each item: { id: string, url: string, type: "local" | "firebase" }
  const [items, setItems] = useState([]);
  const [localFiles, setLocalFiles] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [lightbox, setLightbox] = useState({ isOpen: false, index: 0 });
  const idCounter = useRef(0);

  // Load images: real-time for guests, one-time for authenticated
  useEffect(() => {
    if (user) {
      const fetchData = async () => {
        try {
          const docRef = getFilesDocRef(user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const urls = docSnap.data()["imagesURLs"] || [];
            setItems(
              urls.map((url) => ({
                id: `fb-${url}`,
                url,
                type: "firebase",
              }))
            );
          } else {
            setItems([]);
          }
        } catch (err) {
          console.error("Error fetching files:", err);
          message.error("Failed to load your files.");
        }
      };
      fetchData();
      return undefined;
    }

    // Guest: real-time subscription
    const unsubscribe = subscribeToGuestData(
      (data) => {
        const urls = data.imageUrls || [];
        setItems(
          urls.map((url) => ({
            id: `fb-${url}`,
            url,
            type: "firebase",
          }))
        );
      },
      (err) => {
        console.error("Guest files subscription error:", err);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      items.forEach((item) => {
        if (item.type === "local" && item.url.startsWith("blob:")) {
          URL.revokeObjectURL(item.url);
        }
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshFromFirebase = useCallback(async () => {
    if (user) {
      try {
        const docRef = getFilesDocRef(user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const urls = docSnap.data()["imagesURLs"] || [];
          items.forEach((item) => {
            if (item.type === "local" && item.url.startsWith("blob:")) {
              URL.revokeObjectURL(item.url);
            }
          });
          setItems(
            urls.map((url) => ({
              id: `fb-${url}`,
              url,
              type: "firebase",
            }))
          );
          setLocalFiles([]);
        }
      } catch (err) {
        console.error("Error refreshing from Firebase:", err);
      }
    }
    // Guest: data is real-time, no manual refresh needed
  }, [user, items]);

  const handleSaveDatas = async () => {
    const localItems = items.filter((item) => item.type === "local");
    if (!localItems.length) {
      message.warning("Please select files first.");
      return;
    }
    if (isSaving) return;
    setIsSaving(true);

    let uploadCount = 0;
    let failCount = 0;

    try {
      for (const item of localItems) {
        const localIndex = localItems.indexOf(item);
        const file = localFiles[localIndex];
        if (!file) continue;

        const data = new FormData();
        data.append("file", file);
        data.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
        data.append("cloud_name", CLOUDINARY_CLOUD_NAME);

        try {
          const res = await fetch(`${CLOUDINARY_API_URL}/image/upload`, {
            method: "POST",
            body: data,
          });
          const result = await res.json();

          if (result.secure_url) {
            if (user) {
              const docRef = getFilesDocRef(user.uid);
              await setDoc(
                docRef,
                {
                  imagesURLs: arrayUnion(result.secure_url),
                  userId: user.uid,
                  createdAt: serverTimestamp(),
                  updatedAt: serverTimestamp(),
                },
                { merge: true }
              );
            } else {
              await saveGuestImages([result.secure_url]);
            }
            uploadCount++;
          } else {
            failCount++;
            console.error("Upload failed:", result.error);
          }
        } catch (err) {
          failCount++;
          console.error("Upload error:", err);
        }
      }

      if (!user) {
        // Guest: revoke local blobs (real-time will update items)
        localItems.forEach((item) => {
          if (item.url.startsWith("blob:")) URL.revokeObjectURL(item.url);
        });
        setLocalFiles([]);
        setItems((prev) => prev.filter((it) => it.type === "firebase"));
      } else {
        await refreshFromFirebase();
      }

      if (failCount === 0) {
        message.success(`${uploadCount} file(s) saved successfully!`);
      } else {
        message.warning(`${uploadCount} saved, ${failCount} failed.`);
      }
    } catch (err) {
      console.error("Save error:", err);
      message.error("Failed to save files. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCheckFiles = (e) => {
    const selected = Array.from(e.target.files);
    if (!selected.length) return;

    const newItems = selected.map((file) => ({
      id: `local-${idCounter.current++}`,
      url: URL.createObjectURL(file),
      type: "local",
    }));

    setItems((prev) => [...prev, ...newItems]);
    setLocalFiles((prev) => [...prev, ...selected]);
  };

  const clearFiles = async () => {
    if (isClearing) return;
    setIsClearing(true);
    try {
      items.forEach((item) => {
        if (item.type === "local" && item.url.startsWith("blob:")) {
          URL.revokeObjectURL(item.url);
        }
      });

      // Delete Firebase images from Cloudinary
      const firebaseItems = items.filter((item) => item.type === "firebase");
      for (const item of firebaseItems) {
        try {
          const publicId = extractPublicId(item.url);
          if (publicId) {
            await deleteFromCloudinary(publicId);
          }
        } catch (err) {
          console.error("Failed to delete from Cloudinary:", err);
        }
      }

      if (user) {
        const docRef = getFilesDocRef(user.uid);
        await setDoc(
          docRef,
          { imagesURLs: [], updatedAt: serverTimestamp() },
          { merge: true }
        );
      } else {
        await clearGuestImages();
      }

      setItems([]);
      setLocalFiles([]);
      message.success("Files cleared successfully!");
    } catch {
      message.error("Failed to clear files. Please try again.");
    } finally {
      setIsClearing(false);
    }
  };

  const removeItem = async (index) => {
    const item = items[index];
    if (!item) return;

    setItems((prev) => prev.filter((_, i) => i !== index));

    if (item.type === "local") {
      if (item.url.startsWith("blob:")) {
        URL.revokeObjectURL(item.url);
      }
      const localItemsFiltered = items
        .filter((it) => it.type === "local")
        .slice(0, items.indexOf(item) + 1);
      const localIndex = localItemsFiltered.length - 1;
      setLocalFiles((prev) => prev.filter((_, i) => i !== localIndex));
    }

    setLightbox((prev) => {
      if (!prev.isOpen) return prev;
      const newLength = items.length - 1;
      if (newLength <= 0) return { isOpen: false, index: 0 };
      return { ...prev, index: Math.min(prev.index, newLength - 1) };
    });

    // For firebase items: delete from Cloudinary + Firestore
    if (item.type === "firebase") {
      setDeletingId(item.id);
      try {
        const publicId = extractPublicId(item.url);
        if (publicId) {
          await deleteFromCloudinary(publicId);
        }

        if (user) {
          const docRef = getFilesDocRef(user.uid);
          await setDoc(
            docRef,
            {
              imagesURLs: arrayRemove(item.url),
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          );
        } else {
          await removeGuestImage(item.url);
        }
      } catch (err) {
        console.error("Delete failed:", err);
        message.error("Failed to delete image. Please try again.");
        if (!user) {
          // Guest: real-time will re-sync
        } else {
          await refreshFromFirebase();
        }
      } finally {
        setDeletingId(null);
      }
    }
  };

  const isBusy = isSaving || isClearing || isSharing || deletingId !== null;
  const hasLocalItems = items.some((it) => it.type === "local");

  return (
    <div className="w-full min-h-[280px] sm:min-h-[350px] md:min-h-[400px]">
      <div>
        <div className="flex items-center justify-between mb-4 sm:mb-6 md:mb-7">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900">
            Files
          </h1>
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${user ? "bg-blue-50 text-blue-600" : "bg-amber-50 text-amber-600"}`}>
            {user ? "Personal" : "Guest"}
          </span>
        </div>

        {!user && (
          <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 mb-4">
            You&apos;re sharing as a guest. This content is visible to everyone.{" "}
            <Link to="/login" className="font-semibold underline hover:text-amber-700">Log in</Link> for private storage.
          </p>
        )}

        {items.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 sm:gap-3 mb-4 sm:mb-5">
            {items.map((item, i) => (
              <div
                key={item.id}
                className="relative group aspect-square rounded-xl overflow-hidden bg-gray-100 cursor-pointer"
                onClick={() => setLightbox({ isOpen: true, index: i })}
              >
                <img
                  src={item.url}
                  alt={`Preview ${i + 1}`}
                  className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200" />
                {deletingId === item.id && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  </div>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeItem(i);
                  }}
                  className="absolute top-1.5 right-1.5 p-1 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-black/70 disabled:opacity-50"
                  aria-label="Remove image"
                  disabled={deletingId !== null}
                >
                  <RxCross2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        <label className="flex flex-col items-center justify-center w-full min-h-[140px] sm:min-h-[160px] md:min-h-60 border-2 border-dashed border-gray-300 rounded-2xl cursor-pointer bg-gray-50/50 hover:bg-gray-50 hover:border-primary/40 transition-all duration-200 group">
          <div className="flex flex-col items-center gap-2 sm:gap-3 p-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-sm sm:text-[0.95rem] font-medium text-gray-600">
                Click to upload images
              </p>
              <p className="text-xs sm:text-[0.8rem] text-gray-400 mt-1">
                PNG, JPG, GIF up to 10MB
              </p>
            </div>
          </div>
          <input
            onChange={handleCheckFiles}
            type="file"
            accept="image/*"
            name="upload-files"
            multiple
            className="sr-only"
          />
        </label>
      </div>

      <div className="mt-4 sm:mt-5 flex flex-wrap items-center justify-end gap-2 sm:gap-3">
        <button
          className="px-6 sm:px-8 py-2.5 sm:py-3 border-2 hover:border-red-800 text-sm sm:text-[1rem] font-medium text-gray-400 bg-transparent cursor-pointer hover:text-red-800 hover:shadow-md hover:bg-red-100 rounded-xl transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
          disabled={isBusy || items.length === 0}
          onClick={clearFiles}
        >
          {isClearing ? (
            <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-500 rounded-full animate-spin" />
          ) : (
            <RxTrash size={16} />
          )}
          {isClearing ? "Clearing..." : "Clear"}
        </button>
        <button
          className="px-6 sm:px-8 lg:px-10 py-2.5 sm:py-3 font-bold text-sm sm:text-[1rem] border-2 border-gray-900 text-gray-900 bg-transparent cursor-pointer hover:text-primary-dark hover:border-primary-dark rounded-xl transition-all duration-200 hover:shadow-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
          disabled={isBusy || !hasLocalItems}
          onClick={handleSaveDatas}
        >
          {isSaving ? (
            <div className="w-4 h-4 border-2 border-gray-400 border-t-gray-900 rounded-full animate-spin" />
          ) : (
            <RxCheck size={16} />
          )}
          {isSaving ? "Saving..." : "Save"}
        </button>
        <button
          className="px-5 sm:px-6 py-2.5 sm:py-3 font-semibold text-sm sm:text-[1rem] bg-primary text-white rounded-xl cursor-pointer hover:bg-primary-dark transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-primary flex items-center gap-2 hover:shadow-md active:scale-[0.98]"
          disabled={!hasLocalItems || isBusy}
          onClick={async () => {
            const localItems = items.filter((it) => it.type === "local");
            if (!localItems.length || isSharing) return;
            setIsSharing(true);
            try {
              const uploadedUrls = [];
              for (const item of localItems) {
                const localIndex = localItems.indexOf(item);
                const file = localFiles[localIndex];
                if (!file) continue;

                const data = new FormData();
                data.append("file", file);
                data.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
                data.append("cloud_name", CLOUDINARY_CLOUD_NAME);
                const res = await fetch(`${CLOUDINARY_API_URL}/image/upload`, {
                  method: "POST",
                  body: data,
                });
                const result = await res.json();
                if (result.secure_url) {
                  uploadedUrls.push(result.secure_url);
                }
              }
              if (uploadedUrls.length > 0) {
                await onShareFiles(uploadedUrls);
              }
            } catch {
              // Error handled by parent
            } finally {
              setIsSharing(false);
            }
          }}
        >
          {isSharing && (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          )}
          <RxShare2 size={16} className="sm:w-[18px] sm:h-[18px]" />
          {isSharing ? "Sharing..." : "Share"}
        </button>
      </div>

      {/* Image Lightbox */}
      <ImageLightbox
        images={items.map((it) => it.url)}
        currentIndex={lightbox.index}
        isOpen={lightbox.isOpen}
        onClose={() => setLightbox({ isOpen: false, index: 0 })}
        onNavigate={(index) => setLightbox((prev) => ({ ...prev, index }))}
      />
    </div>
  );
};

export default FilePanel;
