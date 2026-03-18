"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, UploadCloud, FileText, X } from "lucide-react";
import { generateReactHelpers } from "@uploadthing/react";
import type { OurFileRouter } from "@/lib/uploadthing";

const { useUploadThing } = generateReactHelpers<OurFileRouter>();

interface Props {
  taskId: string;
}

export default function SubmitTaskForm({ taskId }: Props) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [notes, setNotes] = useState("");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const { startUpload } = useUploadThing("submissionUploader");

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) setFile(f);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      toast.error("Please select a file to upload.");
      return;
    }

    setUploading(true);
    try {
      const uploaded = await startUpload([file]);
      if (!uploaded?.[0]) {
        toast.error("Upload failed. Please try again.");
        return;
      }

      setUploading(false);
      setSubmitting(true);

      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId,
          fileUrl: uploaded[0].url,
          fileName: file.name,
          fileSize: file.size,
          notes: notes.trim() || undefined,
        }),
      });

      if (!res.ok) {
        toast.error("Failed to submit. Please try again.");
        return;
      }

      toast.success("Assignment submitted successfully!");
      router.refresh();
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setUploading(false);
      setSubmitting(false);
    }
  }

  const isLoading = uploading || submitting;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* File drop zone */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Upload your work <span className="text-red-500">*</span>
        </label>

        {file ? (
          <div className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl bg-gray-50">
            <FileText className="w-5 h-5 text-gray-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">{file.name}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            <button
              type="button"
              onClick={() => setFile(null)}
              className="text-gray-400 hover:text-gray-600 transition-colors shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <label
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
              dragOver
                ? "border-[#1a1a2e] bg-blue-50"
                : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
            }`}
          >
            <UploadCloud className={`w-8 h-8 ${dragOver ? "text-[#1a1a2e]" : "text-gray-300"}`} />
            <div className="text-center">
              <p className="text-sm font-medium text-gray-700">
                Drop your file here, or{" "}
                <span className="text-[#1a1a2e] underline">browse</span>
              </p>
              <p className="text-xs text-gray-400 mt-1">PDF, DOCX, DOC, PNG, JPG — up to 16 MB</p>
            </div>
            <input
              type="file"
              accept=".pdf,.docx,.doc,.png,.jpg,.jpeg"
              className="hidden"
              onChange={handleFileChange}
            />
          </label>
        )}
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Notes for teacher{" "}
          <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          maxLength={500}
          placeholder="Any notes or comments for your teacher…"
          className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400 transition-colors bg-gray-50 focus:bg-white resize-none"
        />
        <p className="text-xs text-gray-400 text-right mt-1">{notes.length}/500</p>
      </div>

      <button
        type="submit"
        disabled={isLoading || !file}
        className="w-full flex items-center justify-center gap-2 bg-[#1a1a2e] text-white py-3 rounded-lg text-sm font-medium hover:bg-[#16213e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
        {uploading ? "Uploading…" : submitting ? "Submitting…" : "Submit assignment"}
      </button>
    </form>
  );
}
