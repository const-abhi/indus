"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Clock, AlertCircle, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { formatDate, formatRelative } from "@/lib/utils";

interface Student { id: string; name: string; rollNumber: string | null }
interface Submission {
  id: string;
  fileUrl: string;
  fileName: string;
  submittedAt: string;
  evalScore: number | null;
  compoundScore: number | null;
  submissionTimeScore: number | null;
  student: Student;
}
interface Task {
  id: string;
  title: string;
  dueDate: string | null;
  evaluationDeadline: string | null;
}

export default function EvaluatePage() {
  const params = useParams<{ taskId: string }>();
  const taskId = params.taskId;

  const [task, setTask] = useState<Task | null>(null);
  const [onTime, setOnTime] = useState<Submission[]>([]);
  const [late, setLate] = useState<Submission[]>([]);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<"ontime" | "late">("ontime");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/tasks/${taskId}/evaluate`)
      .then((r) => r.json())
      .then((data) => {
        setTask(data.task);
        setOnTime(data.onTime);
        setLate(data.late);
        const init: Record<string, number> = {};
        [...data.onTime, ...data.late].forEach((s: Submission) => {
          if (s.evalScore !== null) init[s.id] = s.evalScore;
        });
        setScores(init);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [taskId]);

  async function handleSave(subset: Submission[]) {
    const evals = subset
      .filter((s) => scores[s.id] !== undefined)
      .map((s) => ({ submissionId: s.id, evalScore: scores[s.id] }));

    if (evals.length === 0) { toast.error("Enter at least one score"); return; }
    setSaving(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}/evaluate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ evaluations: evals }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      toast.success(`${data.updated} submission(s) saved`);
    } catch { toast.error("Save failed"); }
    finally { setSaving(false); }
  }

  function SubmissionRow({ sub, isLate }: { sub: Submission; isLate: boolean }) {
    const score = scores[sub.id];
    const compound = sub.compoundScore;
    return (
      <tr className="border-b border-gray-50 hover:bg-gray-50/50">
        <td className="px-5 py-3">
          <p className="text-sm font-medium text-gray-900">{sub.student.name}</p>
          <p className="text-xs font-mono text-gray-400">{sub.student.rollNumber ?? "—"}</p>
        </td>
        <td className="px-4 py-3">
          <p className="text-xs text-gray-600">{formatRelative(sub.submittedAt)}</p>
          {isLate && <span className="text-[10px] font-medium text-red-600">LATE</span>}
        </td>
        <td className="px-4 py-3">
          <a href={sub.fileUrl} target="_blank" rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:underline truncate max-w-[140px] block">{sub.fileName}</a>
        </td>
        <td className="px-4 py-3 w-28">
          <input
            type="number" min={0} max={100} placeholder="0–100"
            value={score ?? ""}
            onChange={(e) => setScores((p) => ({ ...p, [sub.id]: Number(e.target.value) }))}
            className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm text-center focus:outline-none focus:border-gray-400 bg-gray-50"
          />
        </td>
        <td className="px-4 py-3 text-center">
          {compound !== null ? (
            <span className="text-sm font-semibold text-[#1a1a2e]">{compound}</span>
          ) : (
            <span className="text-xs text-gray-400">—</span>
          )}
        </td>
      </tr>
    );
  }

  function TabContent({ list, isLate }: { list: Submission[]; isLate: boolean }) {
    if (list.length === 0) {
      return (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-sm text-gray-400">
          No {isLate ? "late" : "on-time"} submissions
        </div>
      );
    }
    return (
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-5 py-3">Student</th>
              <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Submitted</th>
              <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">File</th>
              <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Score /100</th>
              <th className="text-center text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Compound</th>
            </tr>
          </thead>
          <tbody>
            {list.map((sub) => <SubmissionRow key={sub.id} sub={sub} isLate={isLate} />)}
          </tbody>
        </table>
        <div className="px-5 py-4 border-t border-gray-100 flex justify-end">
          <button onClick={() => handleSave(list)} disabled={saving}
            className="flex items-center gap-2 px-5 py-2 bg-[#1a1a2e] text-white rounded-lg text-sm font-medium hover:bg-[#16213e] transition-colors disabled:opacity-60">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save scores
          </button>
        </div>
      </div>
    );
  }

  if (loading) return <div className="flex items-center justify-center py-20 text-gray-400 text-sm">Loading…</div>;
  if (!task) return <div className="text-gray-500 text-sm">Task not found.</div>;

  return (
    <div className="animate-fade-in">
      <Link href="/teacher/tasks" className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-700 mb-6 transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to tasks
      </Link>

      <div className="mb-6">
        <h1 className="font-serif text-3xl text-[#1a1a2e] mb-1">Evaluate: {task.title}</h1>
        <div className="flex items-center gap-4 text-xs text-gray-400">
          {task.dueDate && (
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> Submission deadline: {formatDate(task.dueDate)}
            </span>
          )}
          {task.evaluationDeadline && (
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Eval deadline: {formatDate(task.evaluationDeadline)}
            </span>
          )}
        </div>
        <div className="flex gap-3 mt-3 text-xs text-gray-500">
          <span className="flex items-center gap-1 text-green-700"><CheckCircle2 className="w-3.5 h-3.5" />{onTime.length} on time</span>
          <span className="flex items-center gap-1 text-red-600"><AlertCircle className="w-3.5 h-3.5" />{late.length} late</span>
        </div>
      </div>

      {/* Scoring note */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl px-5 py-4 mb-6 text-xs text-blue-800 space-y-1">
        <p className="font-semibold">Compound scoring rules</p>
        <p>Score &gt; 40 → compound = eval×0.8 + timeScore×0.2 (time score: 3+ days early=100, 2d=60, 1d=30, same day=15)</p>
        <p>Late submissions → eval capped at 70, time component = 0, max compound = 56</p>
        <p>Score ≤ 40 → compound = eval score only, no bonus</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {(["ontime", "late"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${tab === t ? "bg-[#1a1a2e] text-white border-[#1a1a2e]" : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"}`}>
            {t === "ontime" ? `On Time (${onTime.length})` : `Late (${late.length})`}
          </button>
        ))}
      </div>

      {tab === "ontime" ? <TabContent list={onTime} isLate={false} /> : <TabContent list={late} isLate={true} />}
    </div>
  );
}
