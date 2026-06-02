import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { evaluateSchema } from "@/lib/validations";
import { computeScores } from "@/lib/scoring";

// GET /api/tasks/[taskId]/evaluate — teacher: submissions split by on-time / late
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const { taskId } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || user.role !== "TEACHER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const task = await prisma.task.findFirst({
    where: { id: taskId, createdById: user.id },
    select: { id: true, title: true, dueDate: true, evaluationDeadline: true },
  });
  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const submissions = await prisma.submission.findMany({
    where: { taskId },
    include: { student: { select: { id: true, name: true, rollNumber: true } } },
    orderBy: { submittedAt: "asc" },
  });

  const onTime = submissions.filter(
    (s) => !task.dueDate || s.submittedAt <= task.dueDate
  );
  const late = submissions.filter(
    (s) => task.dueDate && s.submittedAt > task.dueDate
  );

  return NextResponse.json({ task, onTime, late });
}

// POST /api/tasks/[taskId]/evaluate — save evaluation scores
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const { taskId } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || user.role !== "TEACHER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const task = await prisma.task.findFirst({
    where: { id: taskId, createdById: user.id },
    select: { id: true, dueDate: true },
  });
  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const parsed = evaluateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const results = await Promise.all(
    parsed.data.evaluations.map(async ({ submissionId, evalScore }) => {
      const sub = await prisma.submission.findUnique({ where: { id: submissionId } });
      if (!sub) return null;

      const { submissionTimeScore, compoundScore } = computeScores(
        evalScore,
        sub.submittedAt,
        task.dueDate
      );

      return prisma.submission.update({
        where: { id: submissionId },
        data: {
          evalScore,
          submissionTimeScore,
          compoundScore,
          status: "GRADED",
          evaluatedAt: new Date(),
          evaluatedById: user.id,
        },
      });
    })
  );

  return NextResponse.json({ updated: results.filter(Boolean).length });
}
