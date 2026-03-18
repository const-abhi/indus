"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardList,
  FilePlus,
  LogOut,
  GraduationCap,
  BookOpen,
} from "lucide-react";
import { cn, getInitials } from "@/lib/utils";
import { signOut } from "@/lib/auth-client";

interface SidebarProps {
  user: { id: string; name: string; email: string; role: string };
}

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isTeacher = user.role === "TEACHER";

  const teacherLinks = [
    { href: "/teacher", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/teacher/tasks", icon: ClipboardList, label: "All tasks" },
    { href: "/teacher/tasks/new", icon: FilePlus, label: "New task" },
  ];

  const studentLinks = [
    { href: "/student", icon: LayoutDashboard, label: "Dashboard" },
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
      {/* Brand */}
      <div className="px-6 py-5 border-b border-gray-100">
        <Link href={isTeacher ? "/teacher" : "/student"}>
          <span className="font-serif text-2xl text-[#1a1a2e]">Indus</span>
        </Link>
      </div>

      {/* Role badge */}
      <div className="px-6 pt-5 pb-2">
        <div className="flex items-center gap-2 text-xs font-medium text-gray-400 uppercase tracking-wider">
          {isTeacher ? (
            <BookOpen className="w-3.5 h-3.5" />
          ) : (
            <GraduationCap className="w-3.5 h-3.5" />
          )}
          {isTeacher ? "Teacher" : "Student"}
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-2">
        <ul className="space-y-0.5">
          {links.map(({ href, icon: Icon, label }) => {
            const active =
              href === (isTeacher ? "/teacher" : "/student")
                ? pathname === href
                : pathname.startsWith(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                    active
                      ? "bg-[#1a1a2e] text-white font-medium"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  )}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User info + signout */}
      <div className="px-4 py-4 border-t border-gray-100">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-50 transition-colors">
          <div className="w-8 h-8 rounded-full bg-[#1a1a2e] flex items-center justify-center text-white text-xs font-medium shrink-0">
            {getInitials(user.name)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
            <p className="text-xs text-gray-400 truncate">{user.email}</p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="mt-2 flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
