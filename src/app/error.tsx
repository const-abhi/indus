"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#f8f8f6] flex items-center justify-center">
      <div className="text-center">
        <h2 className="font-serif text-3xl text-[#1a1a2e] mb-3">Something went wrong</h2>
        <p className="text-gray-500 text-sm mb-6">{error.message}</p>
        <button
          onClick={reset}
          className="bg-[#1a1a2e] text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-[#16213e] transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
