import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { submitTaskSchema } from "@/lib/validations";

// POST /api/submissions — create a submission (student only)
export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || user.role !== "STUDENT") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = submitTaskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { taskId, fileUrl, fileName, fileSize, notes } = parsed.data;

  // Check task exists
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

  // Upsert so students can resubmit
  const submission = await prisma.submission.upsert({
    where: { taskId_studentId: { taskId, studentId: user.id } },
    create: {
      taskId,
      studentId: user.id,
      fileUrl,
      fileName,
      fileSize,
      notes,
      status: "SUBMITTED",
    },
    update: {
      fileUrl,
      fileName,
      fileSize,
      notes,
      status: "SUBMITTED",
      submittedAt: new Date(),
    },
  });

  return NextResponse.json(submission, { status: 201 });
}
