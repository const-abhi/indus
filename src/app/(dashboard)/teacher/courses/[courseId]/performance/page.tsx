"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Download, TrendingUp, TrendingDown, Minus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface PerformanceRow {
  id: string;
  name: string;
  rollNumber: string;
  onTime: number;
  late: number;
  missing: number;
  avgEval: number | null;
  avgCompound: number | null;
  tier: "High" | "Medium" | "Low";
}

interface CourseInfo { id: string; name: string }

const TIER_STYLE: Record<string, string> = {
  High: "bg-green-100 text-green-800",
  Medium: "bg-amber-100 text-amber-800",
  Low: "bg-red-100 text-red-800",
};
const TIER_ICON: Record<string, typeof TrendingUp> = {
  High: TrendingUp,
  Medium: Minus,
  Low: TrendingDown,
};

export default function PerformancePage() {
  const params = useParams<{ courseId: string }>();
  const courseId = params.courseId;

  const [rows, setRows] = useState<PerformanceRow[]>([]);
  const [course, setCourse] = useState<CourseInfo | null>(null);
  const [totalAssignments, setTotalAssignments] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/courses/${courseId}/performance`)
      .then((r) => r.json())
      .then((d) => {
        setRows(d.rows ?? []);
        setCourse(d.course ?? null);
        setTotalAssignments(d.totalAssignments ?? 0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [courseId]);

  function exportCSV() {
    const headers = ["Name", "Roll", "On Time", "Late", "Missing", "Avg Eval", "Avg Compound", "Tier"];
    const csvRows = rows.map((r) => [
      `"${r.name}"`, r.rollNumber, r.onTime, r.late, r.missing,
      r.avgEval ?? "", r.avgCompound ?? "", r.tier,
    ]);
    const csv = [headers, ...csvRows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${course?.name ?? "performance"}_report.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function exportPDF() {
    // Dynamic import — jsPDF is browser-only
    const { default: jsPDF } = await import("jspdf");
    const { default: autoTable } = await import("jspdf-autotable");

    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(`Student Performance — ${course?.name ?? ""}`, 14, 16);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`Total assignments: ${totalAssignments}`, 14, 24);

    autoTable(doc, {
      startY: 30,
      head: [["Name", "Roll", "On Time", "Late", "Missing", "Avg Eval", "Avg Compound", "Tier"]],
      body: rows.map((r) => [
        r.name, r.rollNumber, r.onTime, r.late, r.missing,
        r.avgEval ?? "—", r.avgCompound ?? "—", r.tier,
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [26, 26, 46] },
    });

    doc.save(`${course?.name ?? "performance"}_report.pdf`);
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
    </div>
  );

  return (
    <div className="animate-fade-in">
      <div className="flex items-start justify-between mb-6">
        <div>
          <Link href="/teacher/courses" className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-700 mb-2 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to courses
          </Link>
          <h1 className="font-serif text-3xl text-[#1a1a2e] mb-1">
            Performance — {course?.name ?? "…"}
          </h1>
          <p className="text-gray-500 text-sm">{rows.length} student{rows.length !== 1 ? "s" : ""} · {totalAssignments} assignment{totalAssignments !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4" /> CSV
          </button>
          <button onClick={exportPDF}
            className="flex items-center gap-2 px-4 py-2 bg-[#1a1a2e] text-white rounded-lg text-sm hover:bg-[#16213e] transition-colors">
            <Download className="w-4 h-4" /> PDF
          </button>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-200 rounded-xl p-12 text-center text-sm text-gray-400">
          No enrolled students yet.
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                {["Student", "Roll", "On Time", "Late", "Missing", "Avg Eval", "Avg Compound", "Tier"].map((h) => (
                  <th key={h} className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-5 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {rows.map((row) => {
                const TierIcon = TIER_ICON[row.tier];
                return (
                  <tr key={row.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3 text-sm font-medium text-gray-900">{row.name}</td>
                    <td className="px-5 py-3 font-mono text-xs text-gray-600">{row.rollNumber}</td>
                    <td className="px-5 py-3 text-sm text-green-700 font-medium">{row.onTime}</td>
                    <td className="px-5 py-3 text-sm text-amber-700 font-medium">{row.late}</td>
                    <td className="px-5 py-3 text-sm text-red-600 font-medium">{row.missing}</td>
                    <td className="px-5 py-3 text-sm text-gray-700">{row.avgEval ?? "—"}</td>
                    <td className="px-5 py-3 text-sm font-semibold text-[#1a1a2e]">{row.avgCompound ?? "—"}</td>
                    <td className="px-5 py-3">
                      <span className={cn("inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full", TIER_STYLE[row.tier])}>
                        <TierIcon className="w-3 h-3" />
                        {row.tier}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Legend */}
      <div className="mt-4 text-xs text-gray-400 space-y-0.5">
        <p><span className="font-medium text-green-700">High:</span> on-time rate &gt;80% and avg compound &gt;70</p>
        <p><span className="font-medium text-amber-700">Medium:</span> on-time rate &gt;50% or avg compound &gt;50</p>
        <p><span className="font-medium text-red-600">Low:</span> everything else</p>
      </div>
    </div>
  );
}
