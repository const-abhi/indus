import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate, isOverdue, subjectColor, cn } from "@/lib/utils";
import { CheckCircle2, Clock, AlertCircle } from "lucide-react";

export default async function StudentTasksPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/login");
  if ((session.user as { role: string }).role !== "STUDENT") redirect("/teacher");

  const tasks = await prisma.task.findMany({
    include: {
      createdBy: { select: { name: true } },
      submissions: {
        where: { studentId: session.user.id },
        select: { id: true, submittedAt: true, fileName: true },
      },
    },
    orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
  });

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="font-serif text-4xl text-[#1a1a2e] mb-1">My tasks</h1>
        <p className="text-gray-500 text-sm">{tasks.length} tasks assigned</p>
      </div>

      {tasks.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-200 rounded-xl p-16 text-center">
          <p className="text-gray-500 text-sm">No tasks assigned yet.</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">Task</th>
                <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-4">Subject</th>
                <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-4">Due date</th>
                <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-4">Status</th>
                <th className="px-4 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {tasks.map((task) => {
                const submission = task.submissions[0];
                const overdue = isOverdue(task.dueDate);
                const isDone = !!submission;

                return (
                  <tr key={task.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <Link
                        href={`/student/tasks/${task.id}`}
                        className="font-medium text-gray-900 hover:text-[#1a1a2e] hover:underline text-sm"
                      >
                        {task.title}
                      </Link>
                      <p className="text-xs text-gray-400 mt-0.5">{task.createdBy.name}</p>
                    </td>
                    <td className="px-4 py-4">
                      <span className={cn("text-xs font-medium px-2.5 py-1 rounded-full", subjectColor(task.subject))}>
                        {task.subject}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={cn("text-sm", overdue && !isDone ? "text-red-600 font-medium" : "text-gray-600")}>
                        {formatDate(task.dueDate)}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      {isDone ? (
                        <span className="flex items-center gap-1.5 text-xs font-medium text-green-700">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Submitted
                        </span>
                      ) : overdue && task.dueDate ? (
                        <span className="flex items-center gap-1.5 text-xs font-medium text-red-600">
                          <AlertCircle className="w-3.5 h-3.5" />
                          Overdue
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-xs font-medium text-amber-700">
                          <Clock className="w-3.5 h-3.5" />
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <Link
                        href={`/student/tasks/${task.id}`}
                        className="text-xs font-medium text-[#1a1a2e] hover:underline"
                      >
                        {isDone ? "View" : "Submit →"}
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
