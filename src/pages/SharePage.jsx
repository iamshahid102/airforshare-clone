import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getShareByShareId } from "../services/shareService";
import { RxCopy, RxCheck, RxLink2 } from "react-icons/rx";

const SharePage = () => {
  const { shareId } = useParams();
  const [shareData, setShareData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchShare = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getShareByShareId(shareId);
        if (!data) {
          setError("not_found");
        } else if (!data.isPublic) {
          setError("private");
        } else {
          setShareData(data);
        }
      } catch {
        setError("fetch_error");
      } finally {
        setLoading(false);
      }
    };

    if (shareId) {
      fetchShare();
    }
  }, [shareId]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = window.location.href;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-bg to-[#e8ecf1]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-[3px] border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-sm text-gray-400 font-medium">Loading shared content...</p>
        </div>
      </div>
    );
  }

  // Error States
  const errorStates = {
    not_found: { emoji: "🔍", title: "Share Not Found", desc: "This share link doesn't exist or has been removed." },
    private: { emoji: "🔒", title: "Private Share", desc: "This share is private and not publicly accessible." },
    fetch_error: { emoji: "⚠️", title: "Something went wrong", desc: "We couldn't load the shared content. Please try again later." },
  };

  if (error) {
    const state = errorStates[error];
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-bg to-[#e8ecf1] px-4">
        <div className="text-center max-w-sm mx-auto">
          <div className="text-5xl sm:text-6xl mb-5">{state.emoji}</div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
            {state.title}
          </h1>
          <p className="text-sm sm:text-base text-gray-500 mb-8 leading-relaxed">
            {state.desc}
          </p>
          {error === "fetch_error" ? (
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark transition-all duration-200 hover:shadow-md active:scale-[0.98]"
            >
              Try Again
            </button>
          ) : (
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark transition-all duration-200 hover:shadow-md active:scale-[0.98]"
            >
              Go to Home
            </Link>
          )}
        </div>
      </div>
    );
  }

  // Shared Content Display
  return (
    <div className="min-h-screen bg-gradient-to-br from-bg to-[#e8ecf1] py-8 sm:py-10 md:py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-10">
          <Link
            to="/"
            className="inline-block text-xl sm:text-2xl font-bold bg-gradient-to-br from-primary to-primary-dark bg-clip-text text-transparent mb-2 hover:opacity-80 transition-opacity"
          >
            AirForShare
          </Link>
          <p className="text-xs sm:text-sm text-gray-400">
            Shared{" "}
            {shareData.createdAt
              ? new Date(shareData.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })
              : ""}
          </p>
        </div>

        {/* Text Content */}
        {shareData.text && (
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-[0_2px_20px_rgba(0,0,0,0.06)] p-5 sm:p-6 md:p-8 mb-4 sm:mb-6">
            <h2 className="text-base sm:text-lg font-semibold text-gray-700 mb-3 sm:mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
              Shared Text
            </h2>
            <div className="bg-gray-50 rounded-xl p-4 sm:p-5 whitespace-pre-wrap text-sm sm:text-base text-gray-800 leading-relaxed">
              {shareData.text}
            </div>
          </div>
        )}

        {/* Image Content */}
        {shareData.imageUrls && shareData.imageUrls.length > 0 && (
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-[0_2px_20px_rgba(0,0,0,0.06)] p-5 sm:p-6 md:p-8">
            <h2 className="text-base sm:text-lg font-semibold text-gray-700 mb-3 sm:mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
              Shared Files ({shareData.imageUrls.length})
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {shareData.imageUrls.map((url, index) => (
                <div
                  key={index}
                  className="rounded-xl sm:rounded-2xl overflow-hidden border border-gray-100 bg-gray-50 group"
                >
                  <img
                    src={url}
                    alt={`Shared file ${index + 1}`}
                    loading="lazy"
                    className="w-full h-auto object-cover max-h-64 sm:max-h-80 transition-transform duration-300 group-hover:scale-[1.02]"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Copy Link Button */}
        <div className="mt-6 sm:mt-8 flex justify-center">
          <button
            onClick={handleCopyLink}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              copied
                ? "bg-green-50 text-green-600 border border-green-200"
                : "bg-white text-gray-600 border border-gray-200 hover:border-primary/40 hover:text-primary hover:shadow-sm"
            }`}
          >
            {copied ? (
              <>
                <RxCheck size={16} />
                Link Copied!
              </>
            ) : (
              <>
                <RxLink2 size={16} />
                Copy Share Link
              </>
            )}
          </button>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 sm:mt-10">
          <Link
            to="/"
            className="text-xs sm:text-sm text-gray-400 hover:text-primary transition-colors duration-200"
          >
            ← Create your own share on AirForShare
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SharePage;
