import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isOverdue } from "@/lib/utils";
import { BookOpen, CheckCircle2, Clock, AlertCircle, Plus } from "lucide-react";

export default async function StudentDashboard() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/login");
  if ((session.user as { role: string }).role !== "STUDENT") redirect("/teacher");

  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { rollNumber: true },
  });

  const enrollments = await prisma.enrollment.findMany({
    where: { studentId: session.user.id },
    include: {
      course: {
        include: {
          teacher: { select: { name: true } },
          tasks: {
            include: {
              submissions: {
                where: { studentId: session.user.id },
                select: { id: true },
              },
            },
          },
        },
      },
    },
    orderBy: { enrolledAt: "desc" },
  });

  const allTasks = enrollments.flatMap((e) => e.course.tasks).filter((t) => t.postType === "ASSIGNMENT");
  const submitted = allTasks.filter((t) => t.submissions.length > 0).length;
  const pending = allTasks.filter((t) => t.submissions.length === 0).length;
  const overduePending = allTasks.filter(
    (t) => t.submissions.length === 0 && isOverdue(t.dueDate)
  ).length;

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="font-serif text-4xl text-[#1a1a2e] mb-1">Dashboard</h1>
        <p className="text-gray-500 text-sm">Welcome back, {session.user.name}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-10">
        {[
          { icon: BookOpen, label: "Courses", value: enrollments.length, color: "text-[#1a1a2e]" },
          { icon: CheckCircle2, label: "Submitted", value: submitted, color: "text-green-700" },
          { icon: Clock, label: "Pending", value: pending, color: "text-amber-700" },
          { icon: AlertCircle, label: "Overdue", value: overduePending, color: "text-red-700" },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="bg-white border border-gray-200 rounded-xl p-5">
            <Icon className={`w-4 h-4 mb-3 ${color}`} />
            <p className="text-3xl font-semibold text-[#1a1a2e] tracking-tight">{value}</p>
            <p className="text-xs text-gray-400 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Courses */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-medium text-gray-900">My courses</h2>
        <Link href="/student/courses" className="text-sm text-gray-400 hover:text-gray-700">
          View all →
        </Link>
      </div>

      {enrollments.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-200 rounded-xl p-16 text-center">
          <BookOpen className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-700 font-medium mb-1">No courses enrolled yet</p>
          <p className="text-gray-500 text-sm mb-5">
            Enter a course code from your teacher to get started.
          </p>
          <Link
            href="/student/courses"
            className="inline-flex items-center gap-2 bg-[#1a1a2e] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[#16213e] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Join a course
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {enrollments.slice(0, 4).map(({ course }) => {
            const assignments = course.tasks.filter((t) => t.postType === "ASSIGNMENT");
            const courseSubmitted = assignments.filter((t) => t.submissions.length > 0).length;
            const coursePending = assignments.filter((t) => t.submissions.length === 0).length;
            return (
              <Link
                key={course.id}
                href={`/student/tasks?courseId=${course.id}`}
                className="bg-white border border-gray-200 rounded-xl p-5 hover:border-gray-400 transition-colors block"
              >
                <h3 className="font-medium text-gray-900 mb-0.5">{course.name}</h3>
                <p className="text-xs text-gray-400 mb-4">
                  {course.teacher.name} · Roll: {currentUser?.rollNumber ?? "—"}
                </p>
                <div className="flex gap-4 text-xs">
                  <span className="text-green-700">{courseSubmitted} done</span>
                  <span className="text-amber-700">{coursePending} pending</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
