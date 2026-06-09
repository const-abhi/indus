/**
 * merge-and-rename.mjs
 *
 * 1. Finds students with duplicate roll numbers (real account + seeded @ruet.ac.bd account)
 * 2. Keeps the REAL account, transfers data from seeded account, deletes the seeded account
 * 3. Renames all remaining seeded accounts to short format: "FirstName L" (e.g. "Rohanul R")
 *
 * Run:  node prisma/merge-and-rename.mjs
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ── Short name formatter ──────────────────────────────────────────────────────
// Rules:
//  - Strip leading title words (Md., Mst., Most:, A.B.M, A.N.M, S.M., M.M., etc.)
//  - Strip single-letter tokens
//  - Result: "{first meaningful word} {initial of last meaningful word}"
//  - If only one meaningful word: just that word
function shortName(fullName) {
  if (!fullName) return fullName;

  const skipPatterns = [
    /^md\.?$/i,
    /^mst\.?$/i,
    /^most:?$/i,
    /^a\.?b\.?m\.?$/i,
    /^a\.?n\.?m\.?$/i,
    /^a\.?t\.?m\.?$/i,
    /^s\.?m\.?$/i,
    /^m\.?m\.?$/i,
    /^m\.?s\.?$/i,
    /^khan$/i,
    /^dr\.?$/i,
  ];

  const parts = fullName.split(/\s+/);

  const meaningful = parts.filter(w => {
    if (w.length <= 1) return false;                    // single letters
    if (/^[a-z]\.$/.test(w)) return false;              // "a.", "b.", etc.
    if (skipPatterns.some(p => p.test(w))) return false;
    return true;
  });

  if (meaningful.length === 0) return parts.find(w => w.length > 0) || fullName;
  if (meaningful.length === 1) return meaningful[0];

  const first = meaningful[0];
  const last  = meaningful[meaningful.length - 1];
  return `${first} ${last[0].toUpperCase()}`;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log("\n🔀 Step 1: Merge duplicate accounts (same roll number)\n");
  console.log("   Strategy: keep REAL account, delete SEEDED (@ruet.ac.bd) account\n");
  console.log("─".repeat(70));

  // Fetch all students with a roll number
  const all = await prisma.user.findMany({
    where: { role: "STUDENT", rollNumber: { not: null } },
    select: { id: true, name: true, email: true, rollNumber: true },
    orderBy: { rollNumber: "asc" },
  });

  // Group by roll number
  const byRoll = {};
  for (const s of all) { (byRoll[s.rollNumber] ??= []).push(s); }
  const duplicates = Object.entries(byRoll).filter(([, users]) => users.length > 1);

  if (duplicates.length === 0) {
    console.log("   ✅ No duplicates found.\n");
  }

  let mergeCount = 0;

  for (const [roll, users] of duplicates) {
    const seeded = users.find(u => u.email.endsWith("@ruet.ac.bd"));
    const real   = users.find(u => !u.email.endsWith("@ruet.ac.bd"));

    if (!seeded || !real) {
      console.log(`⚠️  Roll ${roll}: could not distinguish seeded vs real. Skipping.`);
      continue;
    }

    console.log(`\n  Roll ${roll}`);
    console.log(`  KEEP   : ${real.name.padEnd(38)} <${real.email}>`);
    console.log(`  DELETE : ${seeded.name.padEnd(38)} <${seeded.email}>`);

    // ── Transfer enrollments ────────────────────────────────────────────────
    const seededEnrollments = await prisma.enrollment.findMany({
      where: { studentId: seeded.id },
    });
    for (const e of seededEnrollments) {
      const exists = await prisma.enrollment.findUnique({
        where: { courseId_studentId: { courseId: e.courseId, studentId: real.id } },
      });
      if (exists) {
        await prisma.enrollment.delete({ where: { id: e.id } });
        console.log(`  ✓ Enrollment in course ${e.courseId.slice(-6)}: real already enrolled → deleted seeded duplicate`);
      } else {
        await prisma.enrollment.update({ where: { id: e.id }, data: { studentId: real.id } });
        console.log(`  ✓ Enrollment in course ${e.courseId.slice(-6)}: transferred to real account`);
      }
    }

    // ── Transfer submissions ────────────────────────────────────────────────
    const seededSubs = await prisma.submission.findMany({
      where: { studentId: seeded.id },
      select: { id: true, taskId: true, evalScore: true, compoundScore: true },
    });
    for (const s of seededSubs) {
      const exists = await prisma.submission.findUnique({
        where: { taskId_studentId: { taskId: s.taskId, studentId: real.id } },
      });
      if (exists) {
        await prisma.submission.delete({ where: { id: s.id } });
        console.log(`  ✓ Submission task ${s.taskId.slice(-6)}: real already has one → deleted seeded duplicate`);
      } else {
        await prisma.submission.update({ where: { id: s.id }, data: { studentId: real.id } });
        console.log(`  ✓ Submission task ${s.taskId.slice(-6)}: transferred (eval=${s.evalScore}, compound=${s.compoundScore})`);
      }
    }

    // ── Transfer notifications ──────────────────────────────────────────────
    const notifCount = await prisma.notification.count({ where: { userId: seeded.id } });
    if (notifCount > 0) {
      await prisma.notification.updateMany({
        where: { userId: seeded.id },
        data: { userId: real.id },
      });
      console.log(`  ✓ ${notifCount} notification(s) transferred`);
    }

    // ── Clean up seeded user's auth records ────────────────────────────────
    await prisma.pushSubscription.deleteMany({ where: { userId: seeded.id } });
    await prisma.session.deleteMany({ where: { userId: seeded.id } });
    await prisma.account.deleteMany({ where: { userId: seeded.id } });

    // ── Delete seeded user ─────────────────────────────────────────────────
    await prisma.user.delete({ where: { id: seeded.id } });
    console.log(`  ✅ Deleted seeded account`);
    mergeCount++;
  }

  console.log(`\n  Merged ${mergeCount} duplicate(s)\n`);

  // ──────────────────────────────────────────────────────────────────────────
  console.log("─".repeat(70));
  console.log("\n📝 Step 2: Rename remaining seeded accounts to short format\n");
  console.log('   Format: "FirstName L" (e.g. "Rohanul R", "Sadia F")\n');
  console.log("─".repeat(70));

  const seededRemaining = await prisma.user.findMany({
    where: { email: { endsWith: "@ruet.ac.bd" } },
    select: { id: true, name: true, email: true },
    orderBy: { email: "asc" },
  });

  console.log(`\n  Updating ${seededRemaining.length} seeded accounts:\n`);

  let renamedCount = 0;
  for (const u of seededRemaining) {
    const short = shortName(u.name);
    if (short !== u.name) {
      await prisma.user.update({ where: { id: u.id }, data: { name: short } });
      console.log(`  ${u.name.padEnd(42)} →  ${short}`);
      renamedCount++;
    } else {
      console.log(`  ${u.name.padEnd(42)}    (already short)`);
    }
  }

  console.log(`
─────────────────────────────────────────────────────────────────────
✅  All done!
    Accounts merged  : ${mergeCount}
    Names updated    : ${renamedCount}
─────────────────────────────────────────────────────────────────────
`);
}

main()
  .catch(e => { console.error("❌", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
