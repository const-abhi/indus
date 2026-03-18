import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#f8f8f6] flex items-center justify-center">
      <div className="text-center">
        <h1 className="font-serif text-8xl text-[#1a1a2e] mb-4">404</h1>
        <p className="text-gray-500 text-lg mb-8">Page not found.</p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-[#1a1a2e] text-white px-6 py-3 rounded-lg text-sm font-medium hover:bg-[#16213e] transition-colors"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
