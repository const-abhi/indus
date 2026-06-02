import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import Sidebar from "@/components/layout/Sidebar";
import PushRegistration from "@/components/ui/PushRegistration";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/login");

  return (
    <div className="flex min-h-screen bg-[#f8f8f6]">
      <Sidebar user={session.user as { id: string; name: string; email: string; role: string }} />
      {/* Registers SW + push subscription silently on every authenticated load */}
      <PushRegistration />
      <main className="flex-1 ml-64 min-h-screen">
        <div className="max-w-5xl mx-auto px-8 py-10">{children}</div>
      </main>
    </div>
  );
}
