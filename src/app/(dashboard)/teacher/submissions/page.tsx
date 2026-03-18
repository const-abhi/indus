import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate, formatRelative, formatFileSize, subjectColor, cn } from "@/lib/utils";
import { ArrowLeft, FileText, ExternalLink, Users, FileCheck, Clock } from "lucide-react";

interface Props {
  searchParams: Promise<{ taskId?: string }>;
}

export default async function SubmissionsPage({ searchParams }: Props) {
  const { taskId } = await searchParams;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/login");
  if ((session.user as { role: string }).role !== "TEACHER") redirect("/student");

  if (!taskId) redirect("/teacher/tasks");

  const task = await prisma.task.findFirst({
    where: { id: taskId, createdById: session.user.id },
    include: {
      submissions: {
        include: {
          student: { select: { id: true, name: true, email: true } },
        },
        orderBy: { submittedAt: "desc" },
      },
    },
  });

  if (!task) redirect("/teacher/tasks");

  const totalStudents = await prisma.user.count({ where: { role: "STUDENT" } });

  return (
    <div className="animate-fade-in">
      <Link
        href="/teacher"
        className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-700 mb-6 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to dashboard
      </Link>

      {/* Task header */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className={cn("text-xs font-medium px-2.5 py-1 rounded-full", subjectColor(task.subject))}>
                {task.subject}
              </span>
              <span className="text-xs text-gray-400">Due {formatDate(task.dueDate)}</span>
            </div>
            <h1 className="font-serif text-3xl text-[#1a1a2e] mb-2">{task.title}</h1>
            <p className="text-sm text-gray-600 leading-relaxed max-w-2xl">{task.description}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-100">
          {[
            { icon: Users, label: "Total students", value: totalStudents },
            { icon: FileCheck, label: "Submitted", value: task.submissions.length },
            {
              icon: Clock,
              label: "Pending",
              value: Math.max(0, totalStudents - task.submissions.length),
            },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="text-center">
              <Icon className="w-4 h-4 text-gray-400 mx-auto mb-1" />
              <p className="text-2xl font-semibold text-[#1a1a2e]">{value}</p>
              <p className="text-xs text-gray-400">{label}</p>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
            <span>Submission progress</span>
            <span>
              {totalStudents > 0 ? Math.round((task.submissions.length / totalStudents) * 100) : 0}%
            </span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#1a1a2e] rounded-full transition-all"
              style={{
                width: `${totalStudents > 0 ? (task.submissions.length / totalStudents) * 100 : 0}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Submissions table */}
      <h2 className="text-base font-medium text-gray-900 mb-3">
        Submissions ({task.submissions.length})
      </h2>

      {task.submissions.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-200 rounded-xl p-12 text-center">
          <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500 text-sm">No submissions yet.</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">Student</th>
                <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-4">File</th>
                <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-4">Submitted</th>
                <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-4">Notes</th>
                <th className="px-4 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {task.submissions.map((sub) => (
                <tr key={sub.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900 text-sm">{sub.student.name}</p>
                    <p className="text-xs text-gray-400">{sub.student.email}</p>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span className="text-sm text-gray-700 truncate max-w-[180px]">
                        {sub.fileName}
                      </span>
                      {sub.fileSize && (
                        <span className="text-xs text-gray-400 shrink-0">
                          {formatFileSize(sub.fileSize)}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-500 whitespace-nowrap">
                    {formatRelative(sub.submittedAt)}
                  </td>
                  <td className="px-4 py-4">
                    {sub.notes ? (
                      <p className="text-sm text-gray-600 max-w-[200px] truncate" title={sub.notes}>
                        {sub.notes}
                      </p>
                    ) : (
                      <span className="text-xs text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <a
                      href={sub.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Open <ExternalLink className="w-3 h-3" />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
