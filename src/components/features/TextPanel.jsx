import { useEffect, useState, useRef } from "react";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { message } from "antd";
import { Link } from "react-router-dom";
import { db } from "../../config/firebase";
import {
  RxShare2,
  RxCheck,
  RxTrash,
} from "react-icons/rx";
import {
  saveGuestText,
  clearGuestText,
  subscribeToGuestData,
} from "../../services/guestService";

const getTextDocRef = (uid) => doc(db, "userText", uid);

const TextPanel = ({ user, onShareText, onDataLoaded }) => {
  const [inputValue, setInputValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isTextLoading, setIsTextLoading] = useState(true);
  const lastSavedValue = useRef("");

  // Derived: true when the textarea differs from the last persisted value
  const hasUnsavedChanges = inputValue !== lastSavedValue.current;

  // Real-time subscription for guest data
  useEffect(() => {
    if (user) {
      // Authenticated: fetch user-specific data
      const fetchData = async () => {
        try {
          const docRef = getTextDocRef(user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const text = docSnap.data().text || "";
            setInputValue(text);
            lastSavedValue.current = text;
          } else {
            setInputValue("");
            lastSavedValue.current = "";
          }
        } catch (err) {
          console.error("Error fetching text:", err);
          message.error("Failed to load your text.");
        } finally {
          setIsTextLoading(false);
          onDataLoaded?.();
        }
      };
      fetchData();
      return undefined;
    }

    // Guest: real-time subscription to guest board
    const unsubscribe = subscribeToGuestData(
      (data) => {
        const text = data.text || "";
        setInputValue(text);
        lastSavedValue.current = text;
        setIsTextLoading(false);
      },
      (err) => {
        console.error("Guest text subscription error:", err);
        message.error("Failed to load guest content.");
        setIsTextLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, onDataLoaded]);

  const handleSaveText = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      if (user) {
        const docRef = getTextDocRef(user.uid);
        await setDoc(
          docRef,
          {
            text: inputValue,
            userId: user.uid,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      } else {
        await saveGuestText(inputValue);
      }
      lastSavedValue.current = inputValue;
      message.success("Text saved successfully!");
    } catch (err) {
      console.error("Save text error:", err);
      message.error("Failed to save text. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearText = async () => {
    if (isClearing) return;
    setIsClearing(true);
    try {
      if (user) {
        const docRef = getTextDocRef(user.uid);
        await setDoc(
          docRef,
          {
            text: "",
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      } else {
        await clearGuestText();
      }
      setInputValue("");
      lastSavedValue.current = "";
      message.success("Text cleared successfully!");
    } catch (err) {
      console.error("Clear text error:", err);
      message.error("Failed to clear text. Please try again.");
    } finally {
      setIsClearing(false);
    }
  };

  const isBusy = isSaving || isClearing || isSharing;

  if (isTextLoading) {
    return (
      <div className="flex flex-col items-center justify-center w-full min-h-[280px] sm:min-h-[350px] md:min-h-[400px]">
        <div className="w-10 h-10 border-[3px] border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
        <p className="text-sm text-gray-400">Loading text...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-between w-full min-h-[280px] sm:min-h-[350px] md:min-h-[400px]">
      <div>
        <div className="flex items-center justify-between mb-4 sm:mb-6 md:mb-7">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900">
            Text
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
        <textarea
          value={inputValue}
          name="type-something"
          placeholder="Type something..."
          onChange={(e) => setInputValue(e.target.value)}
          className="w-full min-h-[160px] sm:min-h-[180px] md:min-h-40 resize-none border-none outline-none text-lg sm:text-[1.3rem] md:text-[1.4rem] text-gray-800 placeholder-gray-300 overflow-hidden leading-relaxed transition-colors duration-200 focus:ring-0"
        />
      </div>
      <div className="mt-4 sm:mt-5 flex flex-wrap items-center justify-end gap-2 sm:gap-3">
        <button
          className="px-6 sm:px-8 py-2.5 sm:py-3 border-2 hover:border-red-800 text-sm sm:text-[1rem] font-medium text-gray-400 bg-transparent cursor-pointer hover:text-red-800 hover:shadow-md hover:bg-red-100 rounded-xl transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
          disabled={isBusy || !inputValue.trim()}
          onClick={handleClearText}
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
          disabled={isBusy || !inputValue.trim()}
          onClick={handleSaveText}
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
          disabled={!inputValue.trim() || isBusy || hasUnsavedChanges}
          onClick={async () => {
            if (!inputValue.trim() || isSharing) return;
            setIsSharing(true);
            try {
              await onShareText(inputValue);
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
    </div>
  );
};

export default TextPanel;
