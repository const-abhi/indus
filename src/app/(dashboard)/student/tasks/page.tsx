import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate, isOverdue, cn } from "@/lib/utils";
import { ClipboardList, CheckCircle2, Clock, AlertCircle, BookOpen } from "lucide-react";

interface Props {
  searchParams: Promise<{ courseId?: string }>;
}

export default async function StudentTasksPage({ searchParams }: Props) {
  const { courseId } = await searchParams;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/login");
  if ((session.user as { role: string }).role !== "STUDENT") redirect("/teacher");

  // Get all enrollments
  const enrollments = await prisma.enrollment.findMany({
    where: { studentId: session.user.id },
    include: { course: { select: { id: true, name: true, code: true } } },
    orderBy: { enrolledAt: "asc" },
  });

  if (enrollments.length === 0) {
    return (
      <div className="animate-fade-in">
        <h1 className="font-serif text-4xl text-[#1a1a2e] mb-8">My tasks</h1>
        <div className="bg-white border border-dashed border-gray-200 rounded-xl p-16 text-center">
          <BookOpen className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-700 font-medium mb-1">No courses enrolled</p>
          <p className="text-gray-500 text-sm mb-5">
            Join a course first to see your assignments.
          </p>
          <Link
            href="/student/courses"
            className="inline-flex items-center gap-2 bg-[#1a1a2e] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[#16213e] transition-colors"
          >
            Join a course
          </Link>
        </div>
      </div>
    );
  }

  const activeCourseId = courseId ?? enrollments[0].course.id;

  const tasks = await prisma.task.findMany({
    where: { courseId: activeCourseId },
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
      <div className="mb-6">
        <h1 className="font-serif text-4xl text-[#1a1a2e] mb-1">My tasks</h1>
        <p className="text-gray-500 text-sm">Select a course to see your assignments</p>
      </div>

      {/* Course tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {enrollments.map(({ course }) => (
          <Link
            key={course.id}
            href={`/student/tasks?courseId=${course.id}`}
            className={cn(
              "flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors border",
              activeCourseId === course.id
                ? "bg-[#1a1a2e] text-white border-[#1a1a2e]"
                : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
            )}
          >
            {course.name}
          </Link>
        ))}
      </div>

      {tasks.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-200 rounded-xl p-16 text-center">
          <ClipboardList className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No tasks in this course yet. Check back soon.</p>
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
                      <span className={cn("text-xs font-medium px-2.5 py-1 rounded-full",
                        task.postType === "ANNOUNCEMENT" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"
                      )}>
                        {task.postType === "ANNOUNCEMENT" ? "📢 Announcement" : "Assignment"}
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
