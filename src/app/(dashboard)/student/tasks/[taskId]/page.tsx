import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate, formatRelative, subjectColor, cn } from "@/lib/utils";
import { ArrowLeft, CheckCircle2, FileText, ExternalLink, Users } from "lucide-react";
import SubmitTaskForm from "@/components/forms/SubmitTaskForm";

interface Props {
  params: Promise<{ taskId: string }>;
}

export default async function TaskDetailPage({ params }: Props) {
  const { taskId } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/login");
  if ((session.user as { role: string }).role !== "STUDENT") redirect("/teacher");

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      createdBy: { select: { name: true } },
      submissions: { select: { id: true, studentId: true } },
    },
  });

  if (!task) redirect("/student/tasks");

  const mySubmission = await prisma.submission.findUnique({
    where: { taskId_studentId: { taskId, studentId: session.user.id } },
  });

  const totalStudents = await prisma.user.count({ where: { role: "STUDENT" } });
  const submittedCount = task.submissions.length;

  return (
    <div className="animate-fade-in">
      <Link
        href="/student/tasks"
        className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-700 mb-6 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to tasks
      </Link>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Left: task info + submission form */}
        <div className="lg:col-span-3 space-y-5">
          {/* Task card */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className={cn("text-xs font-medium px-2.5 py-1 rounded-full", subjectColor(task.subject))}>
                {task.subject}
              </span>
              <span className="text-xs text-gray-400">Due {formatDate(task.dueDate)}</span>
              <span className="text-xs text-gray-400">by {task.createdBy.name}</span>
            </div>
            <h1 className="font-serif text-3xl text-[#1a1a2e] mb-3">{task.title}</h1>
            <p className="text-sm text-gray-600 leading-relaxed">{task.description}</p>
          </div>

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
                  <a
                    href={mySubmission.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-auto"
                  >
                    <ExternalLink className="w-4 h-4 text-green-600 hover:text-green-800" />
                  </a>
                </div>
                {mySubmission.notes && (
                  <p className="text-xs text-green-700 pl-6">{mySubmission.notes}</p>
                )}
                <p className="text-xs text-green-600 pl-6">
                  Submitted {formatRelative(mySubmission.submittedAt)}
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h2 className="font-medium text-gray-900 mb-5">Submit your work</h2>
              <SubmitTaskForm taskId={task.id} />
            </div>
          )}
        </div>

        {/* Right: class stats */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h3 className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-400" />
              Class progress
            </h3>
            <div className="text-center mb-4">
              <p className="text-3xl font-semibold text-[#1a1a2e]">
                {submittedCount}
                <span className="text-lg font-normal text-gray-400"> / {totalStudents}</span>
              </p>
              <p className="text-xs text-gray-400 mt-1">students submitted</p>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-2">
              <div
                className="h-full bg-[#1a1a2e] rounded-full transition-all duration-700"
                style={{
                  width: `${totalStudents > 0 ? (submittedCount / totalStudents) * 100 : 0}%`,
                }}
              />
            </div>
            <p className="text-xs text-gray-400 text-right">
              {totalStudents > 0 ? Math.round((submittedCount / totalStudents) * 100) : 0}% complete
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Task details</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-400">Subject</dt>
                <dd className="font-medium text-gray-700">{task.subject}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-400">Set by</dt>
                <dd className="font-medium text-gray-700">{task.createdBy.name}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-400">Due date</dt>
                <dd className="font-medium text-gray-700">{formatDate(task.dueDate)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-400">Your status</dt>
                <dd>
                  {mySubmission ? (
                    <span className="text-green-700 font-medium">Submitted</span>
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
