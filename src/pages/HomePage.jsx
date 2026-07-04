import { useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { message } from "antd";
import { auth } from "../config/firebase";
import { createShare } from "../services/shareService";
import Navbar from "../components/layout/Navbar";
import Sidebar from "../components/layout/Sidebar";
import ShareModal from "../components/features/ShareModal";

const HomePage = () => {
  const [user] = useAuthState(auth);
  const [shareModal, setShareModal] = useState({
    isOpen: false,
    isLoading: false,
    shareUrl: null,
    error: null,
  });

  const handleShareText = async (text) => {
    setShareModal({ isOpen: true, isLoading: true, shareUrl: null, error: null });

    try {
      const result = await createShare({
        userId: user ? user.uid : "guest",
        contentType: "text",
        text,
      });

      setShareModal({
        isOpen: true,
        isLoading: false,
        shareUrl: result.url,
        error: null,
      });
      message.success("Share link created successfully!");
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
    setShareModal({ isOpen: true, isLoading: true, shareUrl: null, error: null });

    try {
      const result = await createShare({
        userId: user ? user.uid : "guest",
        contentType: "files",
        imageUrls,
      });

      setShareModal({
        isOpen: true,
        isLoading: false,
        shareUrl: result.url,
        error: null,
      });
      message.success("Share link created successfully!");
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
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      <Navbar />
      <Sidebar
        user={user}
        onShareText={handleShareText}
        onShareFiles={handleShareFiles}
      />
      <ShareModal
        isOpen={shareModal.isOpen}
        onClose={() => setShareModal((prev) => ({ ...prev, isOpen: false }))}
        shareUrl={shareModal.shareUrl}
        isLoading={shareModal.isLoading}
        error={shareModal.error}
      />
    </div>
  );
};

export default HomePage;
