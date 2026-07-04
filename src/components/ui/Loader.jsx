const Loader = ({ message = "Loading your data..." }) => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[var(--color-bg)]">
      {/* Spinner */}
      <div className="relative w-14 h-14 mb-6">
        <div className="absolute inset-0 rounded-full border-4 border-gray-200" />
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[var(--color-primary)] animate-spin" />
      </div>

      {/* Message */}
      <p className="text-base sm:text-lg font-medium text-gray-500 animate-pulse">
        {message}
      </p>
    </div>
  );
};

export default Loader;
