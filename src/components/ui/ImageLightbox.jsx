import { useEffect, useCallback, useRef } from "react";
import { RxCross2, RxChevronLeft, RxChevronRight } from "react-icons/rx";

const ImageLightbox = ({ images = [], currentIndex, isOpen, onClose, onNavigate }) => {
  const imageRef = useRef(null);

  // Clamp index to valid range
  const safeIndex = Math.min(Math.max(currentIndex, 0), Math.max(images.length - 1, 0));

  const handlePrev = useCallback(() => {
    if (safeIndex > 0) onNavigate(safeIndex - 1);
  }, [safeIndex, onNavigate]);

  const handleNext = useCallback(() => {
    if (safeIndex < images.length - 1) onNavigate(safeIndex + 1);
  }, [safeIndex, images.length, onNavigate]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "ArrowRight") handleNext();
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    // Focus the lightbox for keyboard events
    imageRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose, handlePrev, handleNext]);

  if (!isOpen || !images.length) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Image preview"
    >
      {/* Backdrop — z-0 layer */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-[fadeIn_200ms_ease-out]"
        onClick={onClose}
      />

      {/* Close Button — z-20, above image container */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20 p-2.5 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors duration-200"
        aria-label="Close lightbox"
      >
        <RxCross2 size={24} />
      </button>

      {/* Counter — z-20 */}
      <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-20 px-3 py-1.5 rounded-full bg-white/10 text-white text-sm font-medium backdrop-blur-sm select-none">
        {safeIndex + 1} / {images.length}
      </div>

      {/* Previous Button — z-20 */}
      {safeIndex > 0 && (
        <button
          onClick={handlePrev}
          className="absolute left-2 sm:left-4 z-20 p-2 sm:p-3 rounded-full bg-white/10 text-white hover:bg-white/25 transition-colors duration-200 backdrop-blur-sm"
          aria-label="Previous image"
        >
          <RxChevronLeft size={28} />
        </button>
      )}

      {/* Next Button — z-20 */}
      {safeIndex < images.length - 1 && (
        <button
          onClick={handleNext}
          className="absolute right-2 sm:right-4 z-20 p-2 sm:p-3 rounded-full bg-white/10 text-white hover:bg-white/25 transition-colors duration-200 backdrop-blur-sm"
          aria-label="Next image"
        >
          <RxChevronRight size={28} />
        </button>
      )}

      {/* Image Container — z-10, below buttons */}
      <div
        ref={imageRef}
        tabIndex={-1}
        className="relative z-10 flex items-center justify-center w-full h-full p-10 sm:p-16 animate-[scaleIn_200ms_ease-out] outline-none pointer-events-none"
      >
        <img
          src={images[safeIndex]}
          alt={`Preview ${safeIndex + 1}`}
          className="max-w-full max-h-full object-contain rounded-lg shadow-2xl select-none pointer-events-auto"
          draggable={false}
        />
      </div>
    </div>
  );
};

export default ImageLightbox;
