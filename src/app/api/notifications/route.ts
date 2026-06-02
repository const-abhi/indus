import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generatePendingNotifications } from "@/lib/notify";

// GET /api/notifications — fetch notifications, generate pending ones first
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Generate any new pending notifications
  await generatePendingNotifications(user.id, user.role);

  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    include: { task: { select: { id: true, courseId: true, postType: true } } },
    orderBy: [{ read: "asc" }, { createdAt: "desc" }],
    take: 50,
  });

  const unreadCount = await prisma.notification.count({
    where: { userId: user.id, read: false },
  });

  return NextResponse.json({ notifications, unreadCount });
}
