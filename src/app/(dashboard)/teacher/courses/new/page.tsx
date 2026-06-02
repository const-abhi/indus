import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import CreateCourseForm from "@/components/forms/CreateCourseForm";

export default async function NewCoursePage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/login");
  if ((session.user as { role: string }).role !== "TEACHER") redirect("/student");

  return (
    <div className="animate-fade-in max-w-2xl">
      <div className="mb-8">
        <Link
          href="/teacher/courses"
          className="text-sm text-gray-400 hover:text-gray-700 transition-colors mb-4 inline-block"
        >
          ← Back to courses
        </Link>
        <h1 className="font-serif text-4xl text-[#1a1a2e] mb-1">Create a course</h1>
        <p className="text-gray-500 text-sm">
          A unique join code will be generated — share it with your students.
        </p>
      </div>
      <CreateCourseForm />
    </div>
  );
}
