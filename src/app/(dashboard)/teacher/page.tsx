import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate, isOverdue, subjectColor } from "@/lib/utils";
import { FilePlus, ChevronRight, Users, ClipboardList, FileCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export default async function TeacherDashboard() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/login");
  if ((session.user as { role: string }).role !== "TEACHER") redirect("/student");

  const tasks = await prisma.task.findMany({
    where: { createdById: session.user.id },
    include: {
      submissions: {
        include: { student: { select: { id: true, name: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const totalSubmissions = tasks.reduce((acc, t) => acc + t.submissions.length, 0);
  const uniqueStudents = new Set(
    tasks.flatMap((t) => t.submissions.map((s) => s.studentId))
  ).size;

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-serif text-4xl text-[#1a1a2e] mb-1">Dashboard</h1>
          <p className="text-gray-500 text-sm">Welcome back, {session.user.name}</p>
        </div>
        <Link
          href="/teacher/tasks/new"
          className="flex items-center gap-2 bg-[#1a1a2e] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[#16213e] transition-colors"
        >
          <FilePlus className="w-4 h-4" />
          New task
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-10">
        {[
          { icon: ClipboardList, label: "Tasks created", value: tasks.length },
          { icon: FileCheck, label: "Total submissions", value: totalSubmissions },
          { icon: Users, label: "Students enrolled", value: uniqueStudents },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-center gap-2 text-gray-400 mb-3">
              <Icon className="w-4 h-4" />
              <span className="text-xs font-medium uppercase tracking-wider">{label}</span>
            </div>
            <p className="text-3xl font-semibold text-[#1a1a2e] tracking-tight">{value}</p>
          </div>
        ))}
      </div>

      {/* Tasks */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium text-gray-900">Your tasks</h2>
        <Link href="/teacher/tasks" className="text-sm text-gray-400 hover:text-gray-700 flex items-center gap-1">
          View all <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {tasks.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-200 rounded-xl p-16 text-center">
          <ClipboardList className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm mb-4">No tasks yet. Create your first one.</p>
          <Link
            href="/teacher/tasks/new"
            className="inline-flex items-center gap-2 bg-[#1a1a2e] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[#16213e] transition-colors"
          >
            <FilePlus className="w-4 h-4" />
            Create task
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {tasks.slice(0, 6).map((task) => {
            const subCount = task.submissions.length;
            const overdue = isOverdue(task.dueDate);
            return (
              <Link
                key={task.id}
                href={`/teacher/submissions?taskId=${task.id}`}
                className="bg-white border border-gray-200 rounded-xl p-5 hover:border-gray-400 transition-colors group"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className={cn("text-xs font-medium px-2.5 py-1 rounded-full", subjectColor(task.subject))}>
                    {task.subject}
                  </span>
                  {overdue && task.dueDate && (
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-50 text-red-600">
                      Overdue
                    </span>
                  )}
                </div>
                <h3 className="font-medium text-gray-900 mb-1.5 group-hover:text-[#1a1a2e]">
                  {task.title}
                </h3>
                <p className="text-sm text-gray-500 line-clamp-2 mb-4">{task.description}</p>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>Due {formatDate(task.dueDate)}</span>
                  <span className="font-medium text-gray-700">
                    {subCount} submission{subCount !== 1 ? "s" : ""}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
