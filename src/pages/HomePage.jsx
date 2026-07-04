import { useState, useCallback, useRef, useEffect } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { message } from "antd";
import { auth } from "../config/firebase";
import { createShare } from "../services/shareService";
import Navbar from "../components/layout/Navbar";
import Sidebar from "../components/layout/Sidebar";
import ShareModal from "../components/features/ShareModal";
import Loader from "../components/ui/Loader";

const HomePage = () => {
  const [user, authLoading] = useAuthState(auth);
  const [shareModal, setShareModal] = useState({
    isOpen: false,
    isLoading: false,
    shareUrl: null,
    error: null,
  });
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const dataLoadedRef = useRef(false);

  // Reset loading state when user changes (login/logout/re-login)
  useEffect(() => {
    dataLoadedRef.current = false;
    setIsDataLoaded(false);
  }, [user?.uid]);

  const handleDataLoaded = useCallback(() => {
    if (!dataLoadedRef.current) {
      dataLoadedRef.current = true;
      setIsDataLoaded(true);
    }
  }, []);

  // Show loader during auth init or while authenticated user's data is loading
  const isDataLoading = authLoading || (!!user && !isDataLoaded);

  // Guests: copy home URL to clipboard. Auth: create unique share link.
  const copyHomeUrl = async () => {
    const homeUrl = window.location.origin;
    try {
      await navigator.clipboard.writeText(homeUrl);
      message.success("Share link copied successfully.");
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = homeUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      message.success("Share link copied successfully.");
    }
  };

  const handleShareText = async (text) => {
    if (!user) {
      await copyHomeUrl();
      return;
    }

    setShareModal({ isOpen: true, isLoading: true, shareUrl: null, error: null });

    try {
      const result = await createShare({
        userId: user.uid,
        contentType: "text",
        text,
      });

      setShareModal({
        isOpen: true,
        isLoading: false,
        shareUrl: result.url,
        error: null,
      });
      message.success(result.isNew ? "Share link created successfully!" : "Share link updated successfully!");
    } catch (err) {
      console.error("Error creating share:", err);
      setShareModal({
        isOpen: true,
        isLoading: false,
        shareUrl: null,
        error: "Failed to create share link. Please try again.",
      });
    }
  };

  const handleShareFiles = async (imageUrls) => {
    if (!user) {
      await copyHomeUrl();
      return;
    }

    setShareModal({ isOpen: true, isLoading: true, shareUrl: null, error: null });

    try {
      const result = await createShare({
        userId: user.uid,
        contentType: "files",
        imageUrls,
      });

      setShareModal({
        isOpen: true,
        isLoading: false,
        shareUrl: result.url,
        error: null,
      });
      message.success(result.isNew ? "Share link created successfully!" : "Share link updated successfully!");
    } catch (err) {
      console.error("Error creating share:", err);
      setShareModal({
        isOpen: true,
        isLoading: false,
        shareUrl: null,
        error: "Failed to create share link. Please try again.",
      });
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative">
      {isDataLoading && <Loader />}
      <div className={isDataLoading ? "invisible" : ""}>
        <Navbar />
        <Sidebar
          user={user}
          onShareText={handleShareText}
          onShareFiles={handleShareFiles}
          onDataLoaded={handleDataLoaded}
        />
        <ShareModal
          isOpen={shareModal.isOpen}
          onClose={() => setShareModal((prev) => ({ ...prev, isOpen: false }))}
          shareUrl={shareModal.shareUrl}
          isLoading={shareModal.isLoading}
          error={shareModal.error}
        />
      </div>
    </div>
  );
};

export default HomePage;
