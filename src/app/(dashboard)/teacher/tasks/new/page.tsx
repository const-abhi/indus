import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import CreateTaskForm from "@/components/forms/CreateTaskForm";

export default async function NewTaskPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/login");
  if ((session.user as { role: string }).role !== "TEACHER") redirect("/student");

  const courses = await prisma.course.findMany({
    where: { teacherId: session.user.id },
    select: { id: true, name: true, code: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="animate-fade-in max-w-2xl">
      <div className="mb-8">
        <h1 className="font-serif text-4xl text-[#1a1a2e] mb-1">Create a new task</h1>
        <p className="text-gray-500 text-sm">
          Fill in the details below to assign work to students in a course.
        </p>
      </div>
      <CreateTaskForm courses={courses} />
    </div>
  );
}
