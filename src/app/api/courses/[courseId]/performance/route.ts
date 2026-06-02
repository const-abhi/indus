import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/courses/[courseId]/performance — teacher performance table
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const { courseId } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || user.role !== "TEACHER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const course = await prisma.course.findFirst({
    where: { id: courseId, teacherId: user.id },
  });
  if (!course) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // All assignments in this course
  const assignments = await prisma.task.findMany({
    where: { courseId, postType: "ASSIGNMENT" },
    select: { id: true, dueDate: true },
  });
  const assignmentIds = assignments.map((t) => t.id);
  const totalAssignments = assignmentIds.length;

  // All enrolled students
  const enrollments = await prisma.enrollment.findMany({
    where: { courseId },
    include: { student: { select: { id: true, name: true, rollNumber: true } } },
  });

  // All submissions for this course
  const allSubmissions = await prisma.submission.findMany({
    where: { taskId: { in: assignmentIds } },
    select: {
      studentId: true,
      taskId: true,
      submittedAt: true,
      evalScore: true,
      compoundScore: true,
    },
  });

  const rows = enrollments.map(({ student }) => {
    const studentSubs = allSubmissions.filter((s) => s.studentId === student.id);

    const onTime = studentSubs.filter((s) => {
      const task = assignments.find((t) => t.id === s.taskId);
      return !task?.dueDate || s.submittedAt <= task.dueDate;
    }).length;

    const late = studentSubs.filter((s) => {
      const task = assignments.find((t) => t.id === s.taskId);
      return task?.dueDate && s.submittedAt > task.dueDate;
    }).length;

    const missing = totalAssignments - studentSubs.length;
    const evaluated = studentSubs.filter((s) => s.evalScore !== null);
    const avgEval =
      evaluated.length > 0
        ? Math.round((evaluated.reduce((a, s) => a + (s.evalScore ?? 0), 0) / evaluated.length) * 10) / 10
        : null;

    const scored = studentSubs.filter((s) => s.compoundScore !== null);
    const avgCompound =
      scored.length > 0
        ? Math.round((scored.reduce((a, s) => a + (s.compoundScore ?? 0), 0) / scored.length) * 10) / 10
        : null;

    const onTimeRate = totalAssignments > 0 ? (onTime / totalAssignments) * 100 : 0;
    let tier: "High" | "Medium" | "Low" = "Low";
    if (onTimeRate > 80 && (avgCompound ?? 0) > 70) tier = "High";
    else if (onTimeRate > 50 || (avgCompound ?? 0) > 50) tier = "Medium";

    return {
      id: student.id,
      name: student.name,
      rollNumber: student.rollNumber ?? "—",
      onTime,
      late,
      missing,
      avgEval,
      avgCompound,
      tier,
    };
  });

  return NextResponse.json({ course: { id: course.id, name: course.name }, rows, totalAssignments });
}
