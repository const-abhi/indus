import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { Plus, Users, ClipboardList, BookOpen, BarChart2 } from "lucide-react";
import CopyCodeButton from "@/components/ui/CopyCodeButton";

export default async function TeacherCoursesPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/login");
  if ((session.user as { role: string }).role !== "TEACHER") redirect("/student");

  const courses = await prisma.course.findMany({
    where: { teacherId: session.user.id },
    include: {
      _count: { select: { tasks: true, enrollments: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="animate-fade-in">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-serif text-4xl text-[#1a1a2e] mb-1">Courses</h1>
          <p className="text-gray-500 text-sm">
            {courses.length} course{courses.length !== 1 ? "s" : ""} created
          </p>
        </div>
        <Link
          href="/teacher/courses/new"
          className="flex items-center gap-2 bg-[#1a1a2e] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[#16213e] transition-colors"
        >
          <Plus className="w-4 h-4" />
          New course
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
              className="bg-white border border-gray-200 rounded-xl p-6 flex flex-col gap-4"
            >
              {/* Code badge */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2 bg-[#1a1a2e]/5 rounded-lg px-3 py-1.5">
                  <span className="font-mono text-sm font-bold tracking-widest text-[#1a1a2e]">
                    {course.code}
                  </span>
                  <CopyCodeButton code={course.code} />
                </div>
                <span className="text-xs text-gray-400">{formatDate(course.createdAt)}</span>
              </div>

              <div>
                <h2 className="font-semibold text-gray-900 text-base mb-1">{course.name}</h2>
                {course.description && (
                  <p className="text-sm text-gray-500 line-clamp-2">{course.description}</p>
                )}
              </div>

              <div className="flex items-center gap-4 text-xs text-gray-500 mt-auto pt-2 border-t border-gray-50">
                <span className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" />
                  {course._count.enrollments} student{course._count.enrollments !== 1 ? "s" : ""}
                </span>
                <span className="flex items-center gap-1.5">
                  <ClipboardList className="w-3.5 h-3.5" />
                  {course._count.tasks} task{course._count.tasks !== 1 ? "s" : ""}
                </span>
                <div className="ml-auto flex items-center gap-3">
                  <Link
                    href={`/teacher/courses/${course.id}/performance`}
                    className="flex items-center gap-1 text-gray-500 hover:text-[#1a1a2e] font-medium"
                  >
                    <BarChart2 className="w-3.5 h-3.5" /> Performance
                  </Link>
                  <Link
                    href={`/teacher/tasks?courseId=${course.id}`}
                    className="text-[#1a1a2e] font-medium hover:underline"
                  >
                    Tasks →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
