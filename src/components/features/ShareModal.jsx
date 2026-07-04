import { useState } from "react";
import { message } from "antd";
import { RxCross2, RxCopy, RxCheck, RxLink2 } from "react-icons/rx";

const ShareModal = ({ isOpen, onClose, shareUrl, isLoading, error }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const fullUrl = shareUrl ? `${window.location.origin}${shareUrl}` : "";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      message.success("Link copied successfully.");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = fullUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      message.success("Link copied successfully.");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px] animate-[fadeIn_200ms_ease-out]"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-[scaleIn_200ms_ease-out]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-gray-100">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900">
            Share Link Generated
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
            aria-label="Close"
          >
            <RxCross2 size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 sm:px-6 py-5 sm:py-6">
          {isLoading && (
            <div className="flex flex-col items-center py-6 sm:py-8">
              <div className="w-10 h-10 border-[3px] border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
              <p className="text-sm text-gray-500">Generating share link...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-4">
              <p className="text-red-600 text-sm leading-relaxed">{error}</p>
            </div>
          )}

          {!isLoading && !error && shareUrl && (
            <>
              <p className="text-xs sm:text-sm text-gray-500 mb-3">
                Anyone with this link can view the shared content:
              </p>
              <div className="flex items-stretch gap-2 bg-gray-50 rounded-xl p-2 border border-gray-200 focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/10 transition-all duration-200">
                <div className="flex items-center gap-2 flex-1 min-w-0 px-2">
                  <RxLink2 size={14} className="text-gray-400 shrink-0" />
                  <input
                    type="text"
                    value={fullUrl}
                    readOnly
                    className="flex-1 min-w-0 bg-transparent text-xs sm:text-sm text-gray-700 outline-none truncate"
                  />
                </div>
                <button
                  onClick={handleCopy}
                  className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 shrink-0 ${
                    copied
                      ? "bg-green-500 text-white"
                      : "bg-primary text-white hover:bg-primary-dark hover:shadow-sm active:scale-[0.98]"
                  }`}
                >
                  {copied ? (
                    <>
                      <RxCheck size={14} />
                      Copied
                    </>
                  ) : (
                    <>
                      <RxCopy size={14} />
                      Copy
                    </>
                  )}
                </button>
              </div>
              <p className="text-[11px] sm:text-xs text-gray-400 mt-3 text-center leading-relaxed">
                This link is publicly accessible from any device or network.
              </p>
            </>
          )}
        </div>

        {/* Footer */}
        {!isLoading && (
          <div className="px-5 sm:px-6 py-3 bg-gray-50/80 border-t border-gray-100">
            <button
              onClick={onClose}
              className="w-full py-2.5 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors duration-200 rounded-lg hover:bg-gray-100"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShareModal;
