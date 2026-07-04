import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";

const HomePage = lazy(() => import("./pages/HomePage"));
const AuthPage = lazy(() => import("./pages/AuthPage"));
const SharePage = lazy(() => import("./pages/SharePage"));

function App() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-bg">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-[3px] border-primary/20 border-t-primary rounded-full animate-spin" />
            <p className="text-sm text-gray-400 font-medium">Loading...</p>
          </div>
        </div>
      }
    >
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<AuthPage />} />
        <Route path="/signup" element={<AuthPage />} />
        <Route path="/share/:shareId" element={<SharePage />} />
        <Route
          path="*"
          element={
            <div className="min-h-screen flex items-center justify-center bg-bg px-4">
              <div className="text-center">
                <p className="text-7xl sm:text-8xl font-bold text-gray-200 mb-2">
                  404
                </p>
                <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-3">
                  Page not found
                </h1>
                <p className="text-sm text-gray-500 mb-8 max-w-xs mx-auto">
                  The page you&apos;re looking for doesn&apos;t exist or has been moved.
                </p>
                <a
                  href="/"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark transition-all duration-200 hover:shadow-md active:scale-[0.98]"
                >
                  Go Home
                </a>
              </div>
            </div>
          }
        />
      </Routes>
    </Suspense>
  );
}

export default App;
