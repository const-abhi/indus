import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import CreateTaskForm from "@/components/forms/CreateTaskForm";

export default async function NewTaskPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/login");
  if ((session.user as { role: string }).role !== "TEACHER") redirect("/student");

  return (
    <div className="animate-fade-in max-w-2xl">
      <div className="mb-8">
        <h1 className="font-serif text-4xl text-[#1a1a2e] mb-1">Create a new task</h1>
        <p className="text-gray-500 text-sm">
          Fill in the details below to assign work to your students.
        </p>
      </div>
      <CreateTaskForm />
    </div>
  );
}
