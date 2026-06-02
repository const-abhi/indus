"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, UploadCloud, Link2, X, FileText, Megaphone, ClipboardList } from "lucide-react";
import { createTaskSchema, type CreateTaskInput, type Attachment } from "@/lib/validations";
import { generateReactHelpers } from "@uploadthing/react";
import type { OurFileRouter } from "@/lib/uploadthing";
import { cn } from "@/lib/utils";

const { useUploadThing } = generateReactHelpers<OurFileRouter>();

interface Course { id: string; name: string; code: string }

export default function CreateTaskForm({ courses }: { courses: Course[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultCourseId = searchParams.get("courseId") ?? courses[0]?.id ?? "";

  const [loading, setLoading] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [linkName, setLinkName] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [uploading, setUploading] = useState(false);

  const { startUpload } = useUploadThing("taskAttachmentUploader");

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<CreateTaskInput>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: { courseId: defaultCourseId, postType: "ASSIGNMENT" },
  });

  const postType = watch("postType");

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploading(true);
    try {
      const uploaded = await startUpload(files);
      if (uploaded) {
        setAttachments((prev) => [
          ...prev,
          ...uploaded.map((f) => ({ type: "file" as const, url: f.url, name: f.name })),
        ]);
        toast.success(`${uploaded.length} file(s) attached`);
      }
    } catch { toast.error("Upload failed"); }
    finally { setUploading(false); }
  }

  function addLink() {
    if (!linkUrl.trim()) { toast.error("Please enter a URL"); return; }
    try { new URL(linkUrl); } catch { toast.error("Invalid URL"); return; }
    setAttachments((prev) => [
      ...prev,
      { type: "link", url: linkUrl.trim(), name: linkName.trim() || linkUrl.trim() },
    ]);
    setLinkName("");
    setLinkUrl("");
  }

  function removeAttachment(i: number) {
    setAttachments((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function onSubmit(data: CreateTaskInput) {
    setLoading(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, attachments: attachments.length > 0 ? attachments : undefined }),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err?.error?.formErrors?.[0] ?? "Failed to create");
        return;
      }
      toast.success(postType === "ANNOUNCEMENT" ? "Announcement published!" : "Task created!");
      router.push("/teacher");
      router.refresh();
    } catch { toast.error("Something went wrong."); }
    finally { setLoading(false); }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="bg-white border border-gray-200 rounded-xl p-8 space-y-6">

      {/* Post type toggle */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Post type</label>
        <div className="grid grid-cols-2 gap-3">
          {(["ASSIGNMENT", "ANNOUNCEMENT"] as const).map((type) => (
            <button key={type} type="button" onClick={() => setValue("postType", type)}
              className={cn("flex items-center gap-2.5 p-3.5 rounded-xl border text-sm font-medium transition-all",
                postType === type
                  ? "bg-[#1a1a2e] text-white border-[#1a1a2e]"
                  : "bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-300")}>
              {type === "ASSIGNMENT" ? <ClipboardList className="w-4 h-4" /> : <Megaphone className="w-4 h-4" />}
              {type === "ASSIGNMENT" ? "Assignment" : "Announcement"}
            </button>
          ))}
        </div>
        {postType === "ANNOUNCEMENT" && (
          <p className="mt-2 text-xs text-blue-600 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
            📢 Announcements are informational only — no submission required from students.
          </p>
        )}
      </div>

      {/* Course selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Course <span className="text-red-500">*</span></label>
        {courses.length === 0 ? (
          <p className="text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-4 py-3">
            No courses yet. <a href="/teacher/courses/new" className="underline">Create one first</a>.
          </p>
        ) : (
          <select {...register("courseId")}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400 bg-gray-50 focus:bg-white">
            {courses.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
          </select>
        )}
      </div>

      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Title <span className="text-red-500">*</span></label>
        <input {...register("title")} type="text" placeholder="e.g. Essay on Climate Change"
          className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400 bg-gray-50 focus:bg-white" />
        {errors.title && <p className="mt-1.5 text-xs text-red-600">{errors.title.message}</p>}
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Description <span className="text-red-500">*</span></label>
        <textarea {...register("description")} rows={4}
          placeholder={postType === "ANNOUNCEMENT" ? "Write your announcement here…" : "Describe the task requirements…"}
          className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400 bg-gray-50 focus:bg-white resize-y" />
        {errors.description && <p className="mt-1.5 text-xs text-red-600">{errors.description.message}</p>}
      </div>

      {/* Assignment-only fields */}
      {postType === "ASSIGNMENT" && (
        <div className="grid grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Submission deadline</label>
            <input {...register("dueDate")} type="date"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400 bg-gray-50 focus:bg-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Evaluation deadline</label>
            <input {...register("evaluationDeadline")} type="date"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400 bg-gray-50 focus:bg-white" />
            <p className="mt-1 text-xs text-gray-400">When you plan to finish grading.</p>
          </div>
        </div>
      )}

      {/* Attachments */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">Attachments <span className="text-gray-400 font-normal">(optional)</span></label>

        {/* File upload */}
        <label className={cn("flex items-center gap-3 px-4 py-3 border-2 border-dashed rounded-xl cursor-pointer transition-colors",
          uploading ? "opacity-60 pointer-events-none" : "border-gray-200 hover:border-gray-300 hover:bg-gray-50")}>
          {uploading ? <Loader2 className="w-4 h-4 animate-spin text-gray-400" /> : <UploadCloud className="w-4 h-4 text-gray-400" />}
          <span className="text-sm text-gray-600">{uploading ? "Uploading…" : "Upload files (PDF, DOCX, images)"}</span>
          <input type="file" multiple accept=".pdf,.docx,.doc,.png,.jpg,.jpeg" className="hidden" onChange={handleFileUpload} disabled={uploading} />
        </label>

        {/* Link input */}
        <div className="flex gap-2">
          <input type="text" placeholder="Link name (optional)" value={linkName} onChange={(e) => setLinkName(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400 bg-gray-50" />
          <input type="url" placeholder="https://…" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400 bg-gray-50"
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addLink())} />
          <button type="button" onClick={addLink}
            className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors shrink-0">
            <Link2 className="w-3.5 h-3.5" /> Add
          </button>
        </div>

        {/* Attachment chips */}
        {attachments.length > 0 && (
          <ul className="space-y-1.5">
            {attachments.map((a, i) => (
              <li key={i} className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg">
                {a.type === "link" ? <Link2 className="w-3.5 h-3.5 text-blue-500 shrink-0" /> : <FileText className="w-3.5 h-3.5 text-red-500 shrink-0" />}
                <span className="text-sm text-gray-700 truncate flex-1">{a.name}</span>
                <button type="button" onClick={() => removeAttachment(i)} className="text-gray-400 hover:text-red-500 transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
        <button type="button" onClick={() => router.back()}
          className="px-5 py-2.5 border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
          Cancel
        </button>
        <button type="submit" disabled={loading || courses.length === 0}
          className="flex items-center gap-2 px-6 py-2.5 bg-[#1a1a2e] text-white rounded-lg text-sm font-medium hover:bg-[#16213e] transition-colors disabled:opacity-60">
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {postType === "ANNOUNCEMENT" ? "Publish announcement" : "Create task"}
        </button>
      </div>
    </form>
  );
}
