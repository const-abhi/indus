"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, ClipboardList, FilePlus, LogOut, GraduationCap, BookOpen, Plus } from "lucide-react";
import { cn, getInitials } from "@/lib/utils";
import { signOut } from "@/lib/auth-client";
import NotificationBell from "@/components/ui/NotificationBell";

interface SidebarProps {
  user: { id: string; name: string; email: string; role: string };
}

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isTeacher = user.role === "TEACHER";

  const teacherLinks = [
    { href: "/teacher", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/teacher/courses", icon: BookOpen, label: "Courses" },
    { href: "/teacher/tasks", icon: ClipboardList, label: "All tasks" },
    { href: "/teacher/tasks/new", icon: FilePlus, label: "New post" },
  ];

  const studentLinks = [
    { href: "/student", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/student/courses", icon: BookOpen, label: "My courses" },
    { href: "/student/tasks", icon: ClipboardList, label: "My tasks" },
  ];

  const links = isTeacher ? teacherLinks : studentLinks;

  async function handleSignOut() {
    await signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="px-6 py-5 border-b border-gray-100">
        <Link href={isTeacher ? "/teacher" : "/student"}>
          <span className="font-serif text-2xl text-[#1a1a2e]">Indus</span>
        </Link>
      </div>

      <div className="px-6 pt-5 pb-2">
        <div className="flex items-center gap-2 text-xs font-medium text-gray-400 uppercase tracking-wider">
          {isTeacher ? <BookOpen className="w-3.5 h-3.5" /> : <GraduationCap className="w-3.5 h-3.5" />}
          {isTeacher ? "Teacher" : "Student"}
        </div>
      </div>

      <nav className="flex-1 px-3 py-2">
        <ul className="space-y-0.5">
          {links.map(({ href, icon: Icon, label }) => {
            const isRoot = href === (isTeacher ? "/teacher" : "/student");
            const active = isRoot ? pathname === href : pathname.startsWith(href);
            return (
              <li key={href}>
                <Link href={href} className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                  active ? "bg-[#1a1a2e] text-white font-medium" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                )}>
                  <Icon className="w-4 h-4 shrink-0" />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="mt-4 pt-4 border-t border-gray-100">
          {isTeacher ? (
            <Link href="/teacher/courses/new"
              className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-500 hover:text-[#1a1a2e] rounded-lg hover:bg-gray-50 transition-colors">
              <Plus className="w-3.5 h-3.5" /> New course
            </Link>
          ) : (
            <Link href="/student/courses"
              className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-500 hover:text-[#1a1a2e] rounded-lg hover:bg-gray-50 transition-colors">
              <Plus className="w-3.5 h-3.5" /> Join a course
            </Link>
          )}
        </div>
      </nav>

      {/* Bottom: bell + user */}
      <div className="px-4 py-4 border-t border-gray-100 space-y-1">
        {/* Notification bell row */}
        <div className="flex items-center gap-2 px-2 py-1.5">
          <NotificationBell />
          <span className="text-xs text-gray-500">Notifications</span>
        </div>

        <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-50 transition-colors">
          <div className="w-8 h-8 rounded-full bg-[#1a1a2e] flex items-center justify-center text-white text-xs font-medium shrink-0">
            {getInitials(user.name)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
            <p className="text-xs text-gray-400 truncate">{user.email}</p>
          </div>
        </div>
        <button onClick={handleSignOut}
          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
          <LogOut className="w-4 h-4" /> Sign out
        </button>
      </div>
    </aside>
  );
}
