"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, KeyRound } from "lucide-react";

export default function JoinCourseForm({ onSuccess }: { onSuccess?: () => void }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = code.trim().toUpperCase();
    if (trimmed.length !== 6) {
      setError("Course code must be exactly 6 characters");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/courses/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to join course");
        return;
      }
      toast.success(`Enrolled in "${data.course.name}" successfully!`);
      setCode("");
      onSuccess?.();
      router.refresh();
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Course code <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            id="join-course-code"
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 6))}
            placeholder="e.g. CS101A"
            maxLength={6}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm font-mono tracking-widest focus:outline-none focus:border-gray-400 transition-colors bg-gray-50 focus:bg-white uppercase"
          />
        </div>
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        <p className="mt-1.5 text-xs text-gray-400">
          Your name and roll number will be pulled from your account automatically.
        </p>
      </div>
      <button
        type="submit"
        disabled={loading}
        id="join-course-submit"
        className="w-full flex items-center justify-center gap-2 bg-[#1a1a2e] text-white py-3 rounded-lg text-sm font-medium hover:bg-[#16213e] transition-colors disabled:opacity-60"
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        Join course
      </button>
    </form>
  );
}
