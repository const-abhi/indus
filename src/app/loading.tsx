export default function Loading() {
  return (
    <div className="min-h-screen bg-[#f8f8f6] flex items-center justify-center">
      <div className="flex items-center gap-3 text-gray-400">
        <div className="w-5 h-5 border-2 border-gray-300 border-t-[#1a1a2e] rounded-full animate-spin" />
        <span className="text-sm">Loading…</span>
      </div>
    </div>
  );
}
