"use client";

import { useState, useEffect } from "react";

export default function LoadingScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    // Check if user is offline
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setIsOffline(true);
      setIsLoading(false);
      return;
    }

    // Listen for online/offline events
    const handleOffline = () => {
      setIsOffline(true);
      setIsLoading(false);
    };
    const handleOnline = () => {
      setIsOffline(false);
      // Reload page when coming back online
      window.location.reload();
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    // Hide loader once page is fully loaded
    const hideLoader = () => {
      setTimeout(() => setIsLoading(false), 300);
    };

    if (document.readyState === "complete") {
      hideLoader();
    } else {
      window.addEventListener("load", hideLoader);
    }

    // Safety timeout: hide loader after 8 seconds no matter what
    const timeout = setTimeout(() => setIsLoading(false), 8000);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("load", hideLoader);
      clearTimeout(timeout);
    };
  }, []);

  if (!isLoading && !isOffline) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white transition-opacity duration-500" style={{ opacity: isLoading || isOffline ? 1 : 0 }}>
      {isOffline ? (
        <div className="flex flex-col items-center gap-6 text-center px-6">
          <div className="w-20 h-20 bg-error/10 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728M5.636 18.364a9 9 0 010-12.728M12 12h.01M8.464 8.464a6 6 0 010 7.072M15.536 15.536a6 6 0 010-7.072M3 3l18 18" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-heading font-bold text-text-primary mb-2">No Internet Connection</h2>
            <p className="text-text-secondary text-sm max-w-xs">Please check your internet connection and try again. The page will reload automatically when you&apos;re back online.</p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="bg-primary text-white font-bold px-8 py-3 rounded-xl hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-md"
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="relative w-[4em] h-[4em]">
          <div className="loader"></div>
        </div>
      )}
    </div>
  );
}
