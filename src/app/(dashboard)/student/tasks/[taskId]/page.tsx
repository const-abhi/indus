import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate, formatRelative, cn } from "@/lib/utils";
import { ArrowLeft, CheckCircle2, FileText, ExternalLink, Users, Lock, Megaphone } from "lucide-react";
import SubmitTaskForm from "@/components/forms/SubmitTaskForm";
import AttachmentList from "@/components/ui/AttachmentList";
import type { Attachment } from "@/lib/validations";

interface Props { params: Promise<{ taskId: string }> }

export default async function TaskDetailPage({ params }: Props) {
  const { taskId } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/login");
  if ((session.user as { role: string }).role !== "STUDENT") redirect("/teacher");

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      createdBy: { select: { name: true } },
      course: { select: { id: true, name: true } },
      submissions: { select: { id: true, studentId: true } },
    },
  });
  if (!task) redirect("/student/tasks");

  // Guard: student must be enrolled
  const enrollment = await prisma.enrollment.findUnique({
    where: { courseId_studentId: { courseId: task.courseId, studentId: session.user.id } },
  });

  // Fetch student roll number from their user record
  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { rollNumber: true },
  });

  if (!enrollment) {
    return (
      <div className="animate-fade-in flex flex-col items-center justify-center py-24 text-center">
        <Lock className="w-12 h-12 text-gray-300 mb-4" />
        <h1 className="font-serif text-2xl text-[#1a1a2e] mb-2">Access denied</h1>
        <p className="text-gray-500 text-sm mb-6">You are not enrolled in this course.</p>
        <Link href="/student/courses" className="bg-[#1a1a2e] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[#16213e] transition-colors">
          Join a course
        </Link>
      </div>
    );
  }

  // Announcement: no submission needed
  if (task.postType === "ANNOUNCEMENT") {
    return (
      <div className="animate-fade-in max-w-2xl">
        <Link href={`/student/tasks?courseId=${task.courseId}`}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-700 mb-6 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to {task.course.name}
        </Link>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <Megaphone className="w-5 h-5 text-blue-600" />
            <span className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Announcement</span>
          </div>
          <h1 className="font-serif text-3xl text-[#1a1a2e] mb-3">{task.title}</h1>
          <p className="text-sm text-gray-600 leading-relaxed mb-4">{task.description}</p>
          <p className="text-xs text-gray-400">By {task.createdBy.name} · {formatRelative(task.createdAt)}</p>
        </div>
        {task.attachments && (
          <div className="mt-5">
            <AttachmentList attachments={task.attachments as Attachment[]} />
          </div>
        )}
      </div>
    );
  }

  // Assignment
  const mySubmission = await prisma.submission.findUnique({
    where: { taskId_studentId: { taskId, studentId: session.user.id } },
  });
  const totalStudents = await prisma.enrollment.count({ where: { courseId: task.courseId } });
  const submittedCount = task.submissions.length;

  return (
    <div className="animate-fade-in">
      <Link href={`/student/tasks?courseId=${task.courseId}`}
        className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-700 mb-6 transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to {task.course.name}
      </Link>

      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-5">
          {/* Task info */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-700">
                {task.postType === "ASSIGNMENT" ? "Assignment" : "📢 Announcement"}
              </span>
              <span className="text-xs text-gray-400">Due {formatDate(task.dueDate)}</span>
              <span className="text-xs text-gray-400">by {task.createdBy.name}</span>
            </div>
            <h1 className="font-serif text-3xl text-[#1a1a2e] mb-3">{task.title}</h1>
            <p className="text-sm text-gray-600 leading-relaxed">{task.description}</p>
          </div>

          {/* Attachments */}
          {task.attachments && (task.attachments as Attachment[]).length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <AttachmentList attachments={task.attachments as Attachment[]} />
            </div>
          )}

          {/* Submission section */}
          {mySubmission ? (
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <h2 className="font-medium text-gray-900">Submitted</h2>
              </div>
              <div className="bg-green-50 border border-green-100 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-green-700" />
                  <span className="text-sm font-medium text-green-800">{mySubmission.fileName}</span>
                  <a href={mySubmission.fileUrl} target="_blank" rel="noopener noreferrer" className="ml-auto">
                    <ExternalLink className="w-4 h-4 text-green-600 hover:text-green-800" />
                  </a>
                </div>
                {mySubmission.notes && <p className="text-xs text-green-700 pl-6">{mySubmission.notes}</p>}
                <p className="text-xs text-green-600 pl-6">Submitted {formatRelative(mySubmission.submittedAt)}</p>
              </div>

              {/* Score section */}
              {mySubmission.compoundScore !== null && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Your results</p>
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-2xl font-semibold text-[#1a1a2e]">{mySubmission.evalScore}</p>
                      <p className="text-xs text-gray-400">Eval score</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-semibold text-[#1a1a2e]">{mySubmission.submissionTimeScore}</p>
                      <p className="text-xs text-gray-400">Time score</p>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-bold text-green-700">{mySubmission.compoundScore}</p>
                      <p className="text-xs text-gray-400">Compound score</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h2 className="font-medium text-gray-900 mb-5">Submit your work</h2>
              <SubmitTaskForm taskId={task.id} />
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h3 className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-400" /> Class progress
            </h3>
            <div className="text-center mb-4">
              <p className="text-3xl font-semibold text-[#1a1a2e]">
                {submittedCount}<span className="text-lg font-normal text-gray-400"> / {totalStudents}</span>
              </p>
              <p className="text-xs text-gray-400 mt-1">students submitted</p>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-2">
              <div className="h-full bg-[#1a1a2e] rounded-full transition-all duration-700"
                style={{ width: `${totalStudents > 0 ? (submittedCount / totalStudents) * 100 : 0}%` }} />
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Task details</h3>
            <dl className="space-y-2 text-sm">
              {[
                ["Course", task.course.name],
                ["Due date", formatDate(task.dueDate)],
                ["Your roll", currentUser?.rollNumber ?? "—"],
              ].map(([k, v]) => v && (
                <div key={String(k)} className="flex justify-between">
                  <dt className="text-gray-400">{k}</dt>
                  <dd className="font-medium text-gray-700">{v}</dd>
                </div>
              ))}
              <div className="flex justify-between">
                <dt className="text-gray-400">Status</dt>
                <dd>
                  {mySubmission?.compoundScore !== null && mySubmission?.compoundScore !== undefined ? (
                    <span className="text-green-700 font-medium">Graded ({mySubmission.compoundScore})</span>
                  ) : mySubmission ? (
                    <span className="text-blue-700 font-medium">Submitted</span>
                  ) : (
                    <span className="text-amber-700 font-medium">Pending</span>
                  )}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
