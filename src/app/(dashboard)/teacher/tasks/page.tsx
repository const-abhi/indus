import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate, isOverdue, subjectColor, cn } from "@/lib/utils";
import { FilePlus, ClipboardList, Trash2 } from "lucide-react";
import DeleteTaskButton from "@/components/forms/DeleteTaskButton";

export default async function TeacherTasksPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/login");
  if ((session.user as { role: string }).role !== "TEACHER") redirect("/student");

  const tasks = await prisma.task.findMany({
    where: { createdById: session.user.id },
    include: { submissions: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="animate-fade-in">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-serif text-4xl text-[#1a1a2e] mb-1">All tasks</h1>
          <p className="text-gray-500 text-sm">{tasks.length} task{tasks.length !== 1 ? "s" : ""} created</p>
        </div>
        <Link
          href="/teacher/tasks/new"
          className="flex items-center gap-2 bg-[#1a1a2e] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[#16213e] transition-colors"
        >
          <FilePlus className="w-4 h-4" />
          New task
        </Link>
      </div>

      {tasks.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-200 rounded-xl p-16 text-center">
          <ClipboardList className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm mb-4">No tasks yet.</p>
          <Link
            href="/teacher/tasks/new"
            className="inline-flex items-center gap-2 bg-[#1a1a2e] text-white px-5 py-2.5 rounded-lg text-sm font-medium"
          >
            <FilePlus className="w-4 h-4" />
            Create your first task
          </Link>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">Task</th>
                <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-4">Subject</th>
                <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-4">Due date</th>
                <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-4">Submissions</th>
                <th className="px-4 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {tasks.map((task) => {
                const overdue = isOverdue(task.dueDate);
                return (
                  <tr key={task.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <Link
                        href={`/teacher/submissions?taskId=${task.id}`}
                        className="font-medium text-gray-900 hover:text-[#1a1a2e] hover:underline"
                      >
                        {task.title}
                      </Link>
                      <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{task.description}</p>
                    </td>
                    <td className="px-4 py-4">
                      <span className={cn("text-xs font-medium px-2.5 py-1 rounded-full", subjectColor(task.subject))}>
                        {task.subject}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={cn("text-sm", overdue && task.dueDate ? "text-red-600 font-medium" : "text-gray-600")}>
                        {formatDate(task.dueDate)}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <Link
                        href={`/teacher/submissions?taskId=${task.id}`}
                        className="text-sm font-medium text-gray-700 hover:text-[#1a1a2e]"
                      >
                        {task.submissions.length} submission{task.submissions.length !== 1 ? "s" : ""}
                      </Link>
                    </td>
                    <td className="px-4 py-4">
                      <DeleteTaskButton taskId={task.id} />
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
