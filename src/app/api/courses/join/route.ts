import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { joinCourseSchema } from "@/lib/validations";
import { NotificationType } from "@prisma/client";

// POST /api/courses/join — student joins with just the course code
export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || user.role !== "STUDENT") {
    return NextResponse.json({ error: "Only students can join courses" }, { status: 403 });
  }

  if (!user.rollNumber) {
    return NextResponse.json(
      { error: "Your account does not have a roll number. Please contact support." },
      { status: 400 }
    );
  }

  const body = await req.json();
  const parsed = joinCourseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const code = parsed.data.code.toUpperCase();
  const course = await prisma.course.findUnique({ where: { code } });
  if (!course) {
    return NextResponse.json(
      { error: "Invalid course code. Please double-check and try again." },
      { status: 404 }
    );
  }

  const existing = await prisma.enrollment.findUnique({
    where: { courseId_studentId: { courseId: course.id, studentId: user.id } },
  });
  if (existing) {
    return NextResponse.json(
      { error: "You are already enrolled in this course." },
      { status: 409 }
    );
  }

  const enrollment = await prisma.enrollment.create({
    data: { courseId: course.id, studentId: user.id },
    include: { course: { select: { id: true, name: true, code: true } } },
  });

  // Create new-assignment/announcement notifications for all existing tasks in this course
  const existingTasks = await prisma.task.findMany({
    where: { courseId: course.id },
    select: { id: true, title: true, postType: true },
  });

  if (existingTasks.length > 0) {
    await prisma.notification.createMany({
      data: existingTasks.map((t) => ({
        userId: user.id,
        taskId: t.id,
        type: (t.postType === "ANNOUNCEMENT" ? "NEW_ANNOUNCEMENT" : "NEW_ASSIGNMENT") as NotificationType,
        title: t.postType === "ANNOUNCEMENT" ? `📢 Announcement: ${t.title}` : `📋 Assignment: ${t.title}`,
        body: `From course: ${course.name}`,
      })),
      skipDuplicates: true,
    });
  }

  return NextResponse.json(enrollment, { status: 201 });
}
