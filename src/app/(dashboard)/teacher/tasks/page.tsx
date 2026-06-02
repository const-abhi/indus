import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate, isOverdue, cn } from "@/lib/utils";
import { FilePlus, ClipboardList, BookOpen } from "lucide-react";
import DeleteTaskButton from "@/components/forms/DeleteTaskButton";

interface Props {
  searchParams: Promise<{ courseId?: string }>;
}

export default async function TeacherTasksPage({ searchParams }: Props) {
  const { courseId } = await searchParams;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/login");
  if ((session.user as { role: string }).role !== "TEACHER") redirect("/student");

  // Fetch teacher's courses for the filter tabs
  const courses = await prisma.course.findMany({
    where: { teacherId: session.user.id },
    select: { id: true, name: true, code: true },
    orderBy: { createdAt: "asc" },
  });

  const activeCourseId = courseId ?? courses[0]?.id ?? null;

  const tasks = activeCourseId
    ? await prisma.task.findMany({
        where: { createdById: session.user.id, courseId: activeCourseId },
        include: { submissions: true },
        orderBy: { createdAt: "desc" },
      })
    : [];

  return (
    <div className="animate-fade-in">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-serif text-4xl text-[#1a1a2e] mb-1">Tasks</h1>
          <p className="text-gray-500 text-sm">Select a course to view and manage its tasks</p>
        </div>
        {activeCourseId && (
          <Link
            href={`/teacher/tasks/new?courseId=${activeCourseId}`}
            className="flex items-center gap-2 bg-[#1a1a2e] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[#16213e] transition-colors"
          >
            <FilePlus className="w-4 h-4" />
            New task
          </Link>
        )}
      </div>

      {/* Course tabs */}
      {courses.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-200 rounded-xl p-16 text-center">
          <BookOpen className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm mb-4">No courses yet.</p>
          <Link
            href="/teacher/courses/new"
            className="inline-flex items-center gap-2 bg-[#1a1a2e] text-white px-5 py-2.5 rounded-lg text-sm font-medium"
          >
            Create a course first
          </Link>
        </div>
      ) : (
        <>
          <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
            {courses.map((course) => (
              <Link
                key={course.id}
                href={`/teacher/tasks?courseId=${course.id}`}
                className={cn(
                  "flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors border",
                  activeCourseId === course.id
                    ? "bg-[#1a1a2e] text-white border-[#1a1a2e]"
                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                )}
              >
                {course.name}
                <span className="ml-2 font-mono text-xs opacity-60">{course.code}</span>
              </Link>
            ))}
          </div>

          {tasks.length === 0 ? (
            <div className="bg-white border border-dashed border-gray-200 rounded-xl p-16 text-center">
              <ClipboardList className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm mb-4">No tasks in this course yet.</p>
              {activeCourseId && (
                <Link
                  href={`/teacher/tasks/new?courseId=${activeCourseId}`}
                  className="inline-flex items-center gap-2 bg-[#1a1a2e] text-white px-5 py-2.5 rounded-lg text-sm font-medium"
                >
                  <FilePlus className="w-4 h-4" />
                  Create first task
                </Link>
              )}
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">Task</th>
                    <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-4">Type</th>
                    <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-4">Due date</th>
                    <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-4">Submissions</th>
                    <th className="px-4 py-4">Actions</th>
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
                          <span className={cn("text-xs font-medium px-2.5 py-1 rounded-full",
                            task.postType === "ANNOUNCEMENT" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"
                          )}>
                            {task.postType === "ANNOUNCEMENT" ? "📢 Announcement" : "Assignment"}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span className={cn("text-sm", overdue && task.dueDate ? "text-red-600 font-medium" : "text-gray-600")}>
                            {task.postType === "ANNOUNCEMENT" ? "—" : formatDate(task.dueDate)}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          {task.postType === "ASSIGNMENT" ? (
                            <Link href={`/teacher/submissions?taskId=${task.id}`}
                              className="text-sm font-medium text-gray-700 hover:text-[#1a1a2e]">
                              {task.submissions.length} submission{task.submissions.length !== 1 ? "s" : ""}
                            </Link>
                          ) : <span className="text-xs text-gray-400">—</span>}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            {task.postType === "ASSIGNMENT" && (
                              <Link href={`/teacher/tasks/${task.id}/evaluate`}
                                className="text-xs font-medium text-[#1a1a2e] hover:underline whitespace-nowrap">
                                Evaluate
                              </Link>
                            )}
                            <DeleteTaskButton taskId={task.id} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
