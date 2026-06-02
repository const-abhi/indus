import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate, isOverdue, cn } from "@/lib/utils";
import { BookOpen, ClipboardList, CheckCircle2, Clock, AlertCircle, Plus } from "lucide-react";
import JoinCourseForm from "@/components/forms/JoinCourseForm";

export default async function StudentCoursesPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/login");
  if ((session.user as { role: string }).role !== "STUDENT") redirect("/teacher");

  // Pull student's roll from their user record
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
          _count: { select: { tasks: true } },
        },
      },
    },
    orderBy: { enrolledAt: "desc" },
  });

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="font-serif text-4xl text-[#1a1a2e] mb-1">My courses</h1>
        <p className="text-gray-500 text-sm">
          {enrollments.length === 0
            ? "You haven't joined any courses yet."
            : `Enrolled in ${enrollments.length} course${enrollments.length !== 1 ? "s" : ""}`}
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left: enrolled courses */}
        <div className="lg:col-span-2 space-y-4">
          {enrollments.length === 0 ? (
            <div className="bg-white border border-dashed border-gray-200 rounded-xl p-16 text-center">
              <BookOpen className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-700 font-medium mb-1">No courses enrolled</p>
              <p className="text-gray-500 text-sm">Enter a course code from your teacher to get started.</p>
            </div>
          ) : (
            enrollments.map(({ course, enrolledAt }) => {
              const allAssignments = course.tasks.filter((t) => t.postType === "ASSIGNMENT");
              const announcements = course.tasks.filter((t) => t.postType === "ANNOUNCEMENT");
              const submitted = allAssignments.filter((t) => t.submissions.length > 0).length;
              const pending = allAssignments.filter((t) => t.submissions.length === 0 && !isOverdue(t.dueDate)).length;
              const overdue = allAssignments.filter((t) => t.submissions.length === 0 && isOverdue(t.dueDate)).length;

              return (
                <div key={course.id} className="bg-white border border-gray-200 rounded-xl p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="font-semibold text-gray-900 text-lg leading-tight">{course.name}</h2>
                      <p className="text-xs text-gray-400 mt-0.5">
                        by {course.teacher.name} · Enrolled {formatDate(enrolledAt)}
                      </p>
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <p className="text-xs text-gray-400">Roll</p>
                      <p className="font-mono text-sm font-semibold text-[#1a1a2e]">{currentUser?.rollNumber ?? "—"}</p>
                    </div>
                  </div>

                  {course.description && <p className="text-sm text-gray-500 mb-4 line-clamp-2">{course.description}</p>}

                  {/* Announcements */}
                  {announcements.length > 0 && (
                    <div className="mb-4 space-y-1.5">
                      {announcements.slice(0, 2).map((ann) => (
                        <Link key={ann.id} href={`/student/tasks/${ann.id}`}
                          className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-800 hover:bg-blue-100 transition-colors">
                          📢 {ann.title}
                        </Link>
                      ))}
                    </div>
                  )}

                  {/* Stats */}
                  <div className="flex gap-4 text-xs mb-5">
                    <span className="flex items-center gap-1.5 text-green-700"><CheckCircle2 className="w-3.5 h-3.5" />{submitted} submitted</span>
                    <span className="flex items-center gap-1.5 text-amber-700"><Clock className="w-3.5 h-3.5" />{pending} pending</span>
                    {overdue > 0 && <span className="flex items-center gap-1.5 text-red-600"><AlertCircle className="w-3.5 h-3.5" />{overdue} overdue</span>}
                  </div>

                  {/* Recent tasks */}
                  {allAssignments.length > 0 && (
                    <ul className="space-y-1.5 border-t border-gray-50 pt-4 mb-4">
                      {allAssignments.slice(0, 3).map((task) => {
                        const isDone = task.submissions.length > 0;
                        const late = !isDone && isOverdue(task.dueDate);
                        return (
                          <li key={task.id} className="flex items-center justify-between">
                            <Link href={`/student/tasks/${task.id}`}
                              className="text-sm text-gray-700 hover:text-[#1a1a2e] hover:underline truncate max-w-[260px]">
                              {task.title}
                            </Link>
                            <span className={cn("text-xs font-medium ml-2 shrink-0",
                              isDone ? "text-green-700" : late ? "text-red-600" : "text-amber-700")}>
                              {isDone ? "✓ Done" : late ? "Overdue" : "Pending"}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  )}

                  <Link href={`/student/tasks?courseId=${course.id}`}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-[#1a1a2e] hover:underline">
                    <ClipboardList className="w-3.5 h-3.5" />
                    View all {course._count.tasks} post{course._count.tasks !== 1 ? "s" : ""}
                  </Link>
                </div>
              );
            })
          )}
        </div>

        {/* Right: join form */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-gray-200 rounded-xl p-6 sticky top-6">
            <div className="flex items-center gap-2 mb-4">
              <Plus className="w-4 h-4 text-[#1a1a2e]" />
              <h3 className="font-semibold text-gray-900">Join a course</h3>
            </div>
            <p className="text-xs text-gray-500 mb-5">
              Enter the 6-character code from your teacher. Your name and roll number are pulled from your account automatically.
            </p>
            <JoinCourseForm />
          </div>
        </div>
      </div>
    </div>
  );
}
