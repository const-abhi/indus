import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/courses/[courseId]
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const { courseId } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Teachers can see their own courses; students must be enrolled
  if (user.role === "TEACHER") {
    const course = await prisma.course.findFirst({
      where: { id: courseId, teacherId: user.id },
      include: {
        tasks: { orderBy: { createdAt: "desc" } },
        _count: { select: { enrollments: true } },
      },
    });
    if (!course) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(course);
  }

  // Student: must be enrolled
  const enrollment = await prisma.enrollment.findUnique({
    where: { courseId_studentId: { courseId, studentId: user.id } },
  });
  if (!enrollment) return NextResponse.json({ error: "Not enrolled" }, { status: 403 });

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      teacher: { select: { name: true } },
      tasks: {
        include: {
          submissions: {
            where: { studentId: user.id },
            select: { id: true, status: true, submittedAt: true },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!course) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(course);
}

// DELETE /api/courses/[courseId]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const { courseId } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || user.role !== "TEACHER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const course = await prisma.course.findFirst({
    where: { id: courseId, teacherId: user.id },
  });
  if (!course) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.course.delete({ where: { id: courseId } });
  return NextResponse.json({ success: true });
}
