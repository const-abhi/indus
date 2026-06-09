/**
 * seed-submissions.mjs
 * Creates dummy submissions for enrolled students in LTMW62 and
 * auto-evaluates them with a random score (65–90).
 *
 * Strategy:
 *   - 85% of students submit at least one assignment
 *   - Each submitting student submits to a random subset (≥1) of assignments
 *     biased toward "half" of available assignments
 *   - Submission time: randomly between task creation and ~3 days after due date
 *     (70% on-time, 30% late)
 *   - Eval score: random integer in [65, 90]
 *   - Compound score computed using the same formula as src/lib/scoring.ts
 *
 * Run:  node prisma/seed-submissions.mjs
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const COURSE_CODE   = "LTMW62";
const SCORE_MIN     = 65;
const SCORE_MAX     = 90;
const SUBMIT_CHANCE = 0.85;   // 85% of students submit

// Fake CDN URLs (realistic-looking placeholder files)
const DUMMY_FILES = [
  { name: "solution.pdf",     size: 312_400 },
  { name: "assignment.pdf",   size: 287_150 },
  { name: "submission.docx",  size: 198_720 },
  { name: "report.pdf",       size: 423_680 },
  { name: "answer_sheet.pdf", size: 356_200 },
  { name: "cse_hw.pdf",       size: 274_300 },
  { name: "work.docx",        size: 215_800 },
  { name: "answers.pdf",      size: 389_100 },
];

const DUMMY_NOTES = [
  "Completed all required parts.",
  "Please check the last section for the extra credit.",
  "I followed the format from the lecture notes.",
  "Done. Let me know if anything needs clarification.",
  "Attached my solution. Some parts were challenging.",
  "",   // no note
  "",
  "",
];

// ── Scoring logic (mirrors src/lib/scoring.ts exactly) ───────────────────────
function getTimeScore(submittedAt, dueDate) {
  const days = (dueDate - submittedAt) / (1000 * 60 * 60 * 24);
  if (days < 0)  return 0;
  if (days >= 3) return 100;
  if (days >= 2) return 60;
  if (days >= 1) return 30;
  return 15;
}

function computeScores(evalScore, submittedAt, dueDate) {
  if (evalScore <= 40) return { submissionTimeScore: 0, compoundScore: evalScore };
  const isLate = dueDate ? submittedAt > dueDate : false;
  if (isLate || !dueDate) {
    const capped = Math.min(evalScore, 70);
    return { submissionTimeScore: 0, compoundScore: Math.round(capped * 0.8 * 10) / 10 };
  }
  const T = getTimeScore(submittedAt, dueDate);
  return {
    submissionTimeScore: T,
    compoundScore: Math.round((evalScore * 0.8 + T * 0.2) * 10) / 10,
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Random submission time:
 *  70% → somewhere between (createdAt + 1h) and dueDate (on-time)
 *  30% → between dueDate and (dueDate + 72h) (late)
 */
function randomSubmitTime(createdAt, dueDate) {
  const late = Math.random() > 0.70;
  if (!dueDate) {
    // No due date: submit 1–14 days after task creation
    return new Date(createdAt.getTime() + randInt(1, 14) * 86_400_000);
  }
  if (late) {
    // 1 min – 72 h after due date
    return new Date(dueDate.getTime() + randInt(1, 72 * 60) * 60_000);
  }
  // Between createdAt+1h and dueDate-1h (ensure window is positive)
  const lo = createdAt.getTime() + 3_600_000;
  const hi = dueDate.getTime() - 3_600_000;
  if (hi <= lo) return new Date(lo);
  return new Date(lo + Math.random() * (hi - lo));
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n📦 Seeding submissions for course ${COURSE_CODE}\n`);

  // 1. Course
  const course = await prisma.course.findUnique({ where: { code: COURSE_CODE } });
  if (!course) throw new Error(`Course "${COURSE_CODE}" not found.`);

  // 2. Teacher (evaluator)
  const teacher = await prisma.user.findUnique({
    where: { id: course.teacherId },
    select: { id: true, name: true },
  });
  console.log(`✅ Course : "${course.name}"  Teacher: ${teacher.name}\n`);

  // 3. ASSIGNMENT tasks only
  const tasks = await prisma.task.findMany({
    where: { courseId: course.id, postType: "ASSIGNMENT" },
    orderBy: { createdAt: "asc" },
  });
  if (!tasks.length) {
    console.log("⚠️  No assignments found in this course. Create some first.");
    return;
  }
  console.log(`📋 Assignments (${tasks.length}):`);
  tasks.forEach(t => console.log(`   • [${t.id.slice(0,8)}…] "${t.title}"  due: ${t.dueDate?.toISOString().slice(0,10) ?? "none"}`));

  // 4. Enrolled students
  const enrollments = await prisma.enrollment.findMany({
    where: { courseId: course.id },
    include: { student: { select: { id: true, name: true, rollNumber: true } } },
  });
  console.log(`\n👥 Enrolled students: ${enrollments.length}\n`);

  // 5. Work out which students submit to which tasks
  //    Each student submits to a random subset biased toward ~half the tasks
  let subCount = 0, evalCount = 0, skipCount = 0;

  for (const { student } of enrollments) {
    // 85% of students actually submit
    if (Math.random() > SUBMIT_CHANCE) {
      skipCount++;
      process.stdout.write(`   ⏭  Skip    [${student.rollNumber}] ${student.name}\n`);
      continue;
    }

    // How many tasks to submit to? At least 1, at most all
    // For 2 tasks: submit to 1 or 2 (50/50 weighted toward 1 or both)
    const maxSubmit = Math.max(1, Math.ceil(tasks.length / 2));
    // Randomly pick between 1 and maxSubmit tasks (inclusive)
    const numToSubmit = randInt(1, tasks.length);
    // Shuffle tasks and take the first numToSubmit
    const shuffled = [...tasks].sort(() => Math.random() - 0.5).slice(0, numToSubmit);

    for (const task of shuffled) {
      const file       = pick(DUMMY_FILES);
      const note       = pick(DUMMY_NOTES);
      const submittedAt = randomSubmitTime(task.createdAt, task.dueDate);
      const isLate     = task.dueDate ? submittedAt > task.dueDate : false;
      const evalScore  = randInt(SCORE_MIN, SCORE_MAX);
      const evalAt     = new Date(submittedAt.getTime() + randInt(12, 72) * 3_600_000);

      const { submissionTimeScore, compoundScore } = computeScores(
        evalScore, submittedAt, task.dueDate
      );

      // Upsert so re-running is safe
      await prisma.submission.upsert({
        where: {
          taskId_studentId: { taskId: task.id, studentId: student.id },
        },
        update: {
          fileUrl: `https://utfs.io/f/seed-placeholder-${student.rollNumber}-${task.id.slice(-6)}.pdf`,
          fileName: file.name,
          fileSize: file.size,
          notes: note || null,
          status: "GRADED",
          submittedAt,
          evalScore,
          submissionTimeScore,
          compoundScore,
          evaluatedAt: evalAt,
          evaluatedById: teacher.id,
        },
        create: {
          fileUrl: `https://utfs.io/f/seed-placeholder-${student.rollNumber}-${task.id.slice(-6)}.pdf`,
          fileName: file.name,
          fileSize: file.size,
          notes: note || null,
          status: "GRADED",
          submittedAt,
          evalScore,
          submissionTimeScore,
          compoundScore,
          evaluatedAt: evalAt,
          evaluatedById: teacher.id,
          taskId: task.id,
          studentId: student.id,
        },
      });

      subCount++;
      const tag = isLate ? "🔴 late" : "🟢 ontime";
      process.stdout.write(
        `   ✅ [${student.rollNumber}] ${student.name.padEnd(35)} "${task.title.slice(0,28)}"  ${tag}  eval=${evalScore}  compound=${compoundScore}\n`
      );
    }

    evalCount++;
  }

  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Done!
   Students who submitted  : ${evalCount} / ${enrollments.length}
   Students skipped (~15%) : ${skipCount}
   Submissions created     : ${subCount}
   Score range used        : ${SCORE_MIN}–${SCORE_MAX}
   All submissions status  : GRADED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
}

main()
  .catch(e => { console.error("❌ Error:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
