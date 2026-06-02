"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Copy, Check } from "lucide-react";
import { createCourseSchema, type CreateCourseInput } from "@/lib/validations";

export default function CreateCourseForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateCourseInput>({
    resolver: zodResolver(createCourseSchema),
  });

  async function onSubmit(data: CreateCourseInput) {
    setLoading(true);
    try {
      const res = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err?.error ?? "Failed to create course");
        return;
      }

      const course = await res.json();
      setCreatedCode(course.code);
      toast.success("Course created!");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function copyCode() {
    if (!createdCode) return;
    await navigator.clipboard.writeText(createdCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (createdCode) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-8 text-center space-y-6">
        <div>
          <p className="text-sm text-gray-500 mb-2">Course created! Share this code with your students:</p>
          <div className="inline-flex items-center gap-3 bg-[#1a1a2e] text-white px-6 py-4 rounded-xl">
            <span className="font-mono text-3xl font-bold tracking-[0.3em]">{createdCode}</span>
            <button
              onClick={copyCode}
              className="ml-2 p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
              title="Copy code"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-3">
            Students enter this code to enroll. Keep it safe!
          </p>
        </div>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => router.push("/teacher/courses")}
            className="px-5 py-2.5 bg-[#1a1a2e] text-white rounded-lg text-sm font-medium hover:bg-[#16213e] transition-colors"
          >
            Go to Courses
          </button>
          <button
            onClick={() => setCreatedCode(null)}
            className="px-5 py-2.5 border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Create another
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="bg-white border border-gray-200 rounded-xl p-8 space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Course name <span className="text-red-500">*</span>
        </label>
        <input
          {...register("name")}
          type="text"
          placeholder="e.g. Computer Science — Grade 10"
          className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400 transition-colors bg-gray-50 focus:bg-white"
        />
        {errors.name && (
          <p className="mt-1.5 text-xs text-red-600">{errors.name.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Description <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <textarea
          {...register("description")}
          rows={3}
          placeholder="A brief overview of what this course covers…"
          className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400 transition-colors bg-gray-50 focus:bg-white resize-none"
        />
        {errors.description && (
          <p className="mt-1.5 text-xs text-red-600">{errors.description.message}</p>
        )}
      </div>

      <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-5 py-2.5 border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 px-6 py-2.5 bg-[#1a1a2e] text-white rounded-lg text-sm font-medium hover:bg-[#16213e] transition-colors disabled:opacity-60"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          Create course
        </button>
      </div>
    </form>
  );
}
