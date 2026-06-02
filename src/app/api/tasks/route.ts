import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createTaskSchema } from "@/lib/validations";
import { NotificationType } from "@prisma/client";
import { sendPushToMany } from "@/lib/webpush";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  if (user.role === "TEACHER") {
    const tasks = await prisma.task.findMany({
      where: { createdById: user.id },
      include: {
        createdBy: { select: { name: true } },
        course: { select: { id: true, name: true } },
        _count: { select: { submissions: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(tasks);
  }

  // Student: only tasks from enrolled courses
  const enrollments = await prisma.enrollment.findMany({
    where: { studentId: user.id },
    select: { courseId: true },
  });
  const courseIds = enrollments.map((e) => e.courseId);

  const tasks = await prisma.task.findMany({
    where: { courseId: { in: courseIds } },
    include: {
      createdBy: { select: { name: true } },
      course: { select: { id: true, name: true } },
      _count: { select: { submissions: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(tasks);
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || user.role !== "TEACHER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = createTaskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { title, description, postType, dueDate, evaluationDeadline, courseId, attachments } = parsed.data;

  const course = await prisma.course.findFirst({ where: { id: courseId, teacherId: user.id } });
  if (!course) return NextResponse.json({ error: "Course not found or access denied" }, { status: 403 });

  const task = await prisma.task.create({
    data: {
      title,
      description,
      postType,
      dueDate: dueDate ? new Date(dueDate) : null,
      evaluationDeadline: evaluationDeadline ? new Date(evaluationDeadline) : null,
      attachments: attachments ?? undefined,
      createdById: user.id,
      courseId,
    },
  });

  // Notify all enrolled students immediately
  const enrollments = await prisma.enrollment.findMany({
    where: { courseId },
    select: { studentId: true },
  });

  if (enrollments.length > 0) {
    const studentIds = enrollments.map((e) => e.studentId);

    await prisma.notification.createMany({
      data: studentIds.map((uid) => ({
        userId: uid,
        taskId: task.id,
        type: (postType === "ANNOUNCEMENT" ? "NEW_ANNOUNCEMENT" : "NEW_ASSIGNMENT") as NotificationType,
        title: postType === "ANNOUNCEMENT" ? `📢 Announcement: ${title}` : `📋 New assignment: ${title}`,
        body: `Posted in ${course.name}`,
      })),
      skipDuplicates: true,
    });

    // Web push — arrives even if the user has the tab closed
    const pushTitle = postType === "ANNOUNCEMENT" ? `📢 ${title}` : `📋 New assignment: ${title}`;
    const pushUrl  = postType === "ANNOUNCEMENT" ? "/student/courses" : `/student/tasks/${task.id}`;
    await sendPushToMany(studentIds, {
      title: pushTitle,
      body: `${course.name} — ${description.slice(0, 80)}${description.length > 80 ? "…" : ""}`,
      url: pushUrl,
    });
  }

  return NextResponse.json(task, { status: 201 });
}
