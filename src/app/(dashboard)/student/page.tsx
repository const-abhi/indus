import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate, isOverdue, subjectColor, cn } from "@/lib/utils";
import { ClipboardList, CheckCircle2, Clock, AlertCircle } from "lucide-react";

export default async function StudentDashboard() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/login");
  if ((session.user as { role: string }).role !== "STUDENT") redirect("/teacher");

  const tasks = await prisma.task.findMany({
    include: {
      createdBy: { select: { name: true } },
      submissions: {
        where: { studentId: session.user.id },
        select: { id: true, status: true, submittedAt: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const submitted = tasks.filter((t) => t.submissions.length > 0).length;
  const pending = tasks.filter((t) => t.submissions.length === 0).length;
  const overduePending = tasks.filter(
    (t) => t.submissions.length === 0 && isOverdue(t.dueDate)
  ).length;

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="font-serif text-4xl text-[#1a1a2e] mb-1">My assignments</h1>
        <p className="text-gray-500 text-sm">Welcome back, {session.user.name}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-10">
        {[
          { icon: ClipboardList, label: "Total", value: tasks.length, color: "text-gray-700" },
          { icon: CheckCircle2, label: "Submitted", value: submitted, color: "text-green-700" },
          { icon: Clock, label: "Pending", value: pending, color: "text-amber-700" },
          { icon: AlertCircle, label: "Overdue", value: overduePending, color: "text-red-700" },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="bg-white border border-gray-200 rounded-xl p-5">
            <Icon className={cn("w-4 h-4 mb-3", color)} />
            <p className="text-3xl font-semibold text-[#1a1a2e] tracking-tight">{value}</p>
            <p className="text-xs text-gray-400 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Task list */}
      <h2 className="text-base font-medium text-gray-900 mb-4">All tasks</h2>

      {tasks.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-200 rounded-xl p-16 text-center">
          <ClipboardList className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No tasks assigned yet. Check back soon.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {tasks.map((task) => {
            const mySubmission = task.submissions[0];
            const overdue = isOverdue(task.dueDate);
            const isDone = !!mySubmission;

            return (
              <Link
                key={task.id}
                href={`/student/tasks/${task.id}`}
                className="bg-white border border-gray-200 rounded-xl p-5 hover:border-gray-400 transition-colors group block"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className={cn("text-xs font-medium px-2.5 py-1 rounded-full", subjectColor(task.subject))}>
                    {task.subject}
                  </span>
                  {isDone ? (
                    <span className="flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 px-2.5 py-1 rounded-full">
                      <CheckCircle2 className="w-3 h-3" />
                      Submitted
                    </span>
                  ) : overdue && task.dueDate ? (
                    <span className="text-xs font-medium text-red-600 bg-red-50 px-2.5 py-1 rounded-full">
                      Overdue
                    </span>
                  ) : (
                    <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full">
                      Pending
                    </span>
                  )}
                </div>

                <h3 className="font-medium text-gray-900 mb-1.5 group-hover:text-[#1a1a2e]">
                  {task.title}
                </h3>
                <p className="text-sm text-gray-500 line-clamp-2 mb-4">{task.description}</p>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>Due {formatDate(task.dueDate)}</span>
                  <span>{task.createdBy.name}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
