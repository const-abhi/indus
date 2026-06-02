import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { Plus, Users, ClipboardList, FileCheck, BookOpen } from "lucide-react";
import CopyCodeButton from "@/components/ui/CopyCodeButton";

export default async function TeacherDashboard() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/login");
  if ((session.user as { role: string }).role !== "TEACHER") redirect("/student");

  const courses = await prisma.course.findMany({
    where: { teacherId: session.user.id },
    include: {
      _count: { select: { tasks: true, enrollments: true } },
      tasks: {
        include: { _count: { select: { submissions: true } } },
        orderBy: { createdAt: "desc" },
        take: 3,
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const totalTasks = courses.reduce((a, c) => a + c._count.tasks, 0);
  const totalStudents = courses.reduce((a, c) => a + c._count.enrollments, 0);
  const totalSubmissions = courses.reduce(
    (a, c) => a + c.tasks.reduce((b, t) => b + t._count.submissions, 0),
    0
  );

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-serif text-4xl text-[#1a1a2e] mb-1">Dashboard</h1>
          <p className="text-gray-500 text-sm">Welcome back, {session.user.name}</p>
        </div>
        <Link
          href="/teacher/courses/new"
          className="flex items-center gap-2 bg-[#1a1a2e] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[#16213e] transition-colors"
        >
          <Plus className="w-4 h-4" />
          New course
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-10">
        {[
          { icon: BookOpen, label: "Courses", value: courses.length },
          { icon: ClipboardList, label: "Tasks created", value: totalTasks },
          { icon: FileCheck, label: "Submissions", value: totalSubmissions },
          { icon: Users, label: "Students enrolled", value: totalStudents },
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

      {/* Courses */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium text-gray-900">Your courses</h2>
        <Link
          href="/teacher/courses"
          className="text-sm text-gray-400 hover:text-gray-700"
        >
          View all →
        </Link>
      </div>

      {courses.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-200 rounded-xl p-16 text-center">
          <BookOpen className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm mb-4">No courses yet. Create your first one.</p>
          <Link
            href="/teacher/courses/new"
            className="inline-flex items-center gap-2 bg-[#1a1a2e] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[#16213e] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create course
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {courses.map((course) => (
            <div
              key={course.id}
              className="bg-white border border-gray-200 rounded-xl p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 bg-[#1a1a2e]/5 rounded-lg px-2.5 py-1">
                  <span className="font-mono text-xs font-bold tracking-widest text-[#1a1a2e]">
                    {course.code}
                  </span>
                  <CopyCodeButton code={course.code} />
                </div>
                <span className="text-xs text-gray-400">
                  {course._count.enrollments} student{course._count.enrollments !== 1 ? "s" : ""}
                </span>
              </div>
              <h3 className="font-medium text-gray-900 mb-1">{course.name}</h3>
              <p className="text-xs text-gray-400 mb-3">{course._count.tasks} task{course._count.tasks !== 1 ? "s" : ""}</p>

              {course.tasks.length > 0 && (
                <ul className="space-y-1 border-t border-gray-50 pt-3">
                  {course.tasks.map((task) => (
                    <li key={task.id} className="flex items-center justify-between text-xs text-gray-500">
                      <span className="truncate max-w-[200px]">{task.title}</span>
                      <span className="shrink-0 ml-2 text-gray-400">
                        Due {formatDate(task.dueDate)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              <div className="flex gap-2 mt-4">
                <Link
                  href={`/teacher/tasks?courseId=${course.id}`}
                  className="flex-1 text-center text-xs font-medium text-[#1a1a2e] border border-gray-200 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Tasks
                </Link>
                <Link
                  href={`/teacher/tasks/new?courseId=${course.id}`}
                  className="flex-1 text-center text-xs font-medium bg-[#1a1a2e] text-white py-1.5 rounded-lg hover:bg-[#16213e] transition-colors"
                >
                  + Add task
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
