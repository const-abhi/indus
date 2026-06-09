/**
 * seed-students.mjs
 * Seeds 50 real students from the 22-03 batch and enrolls them
 * in the course with code LTMW62 (Abdul R's CSE 3101).
 *
 * Run:  node prisma/seed-students.mjs
 */

import { PrismaClient } from "@prisma/client";
import { scryptAsync } from "@noble/hashes/scrypt.js";

const prisma = new PrismaClient();

// ── Identical to better-auth's hashPassword ──────────────────────────────────
const HEX = "0123456789abcdef";
function bytesToHex(bytes) {
  let hex = "";
  for (const b of bytes) hex += HEX[b >> 4] + HEX[b & 15];
  return hex;
}
async function hashPassword(password) {
  const saltBytes = crypto.getRandomValues(new Uint8Array(16));
  const salt = bytesToHex(saltBytes);
  const key = await scryptAsync(password.normalize("NFKC"), salt, {
    N: 16384, r: 16, p: 1, dkLen: 64,
    maxmem: 128 * 16384 * 16 * 2,
  });
  return `${salt}:${bytesToHex(key)}`;
}

// ── Student list (first 50 entries) ──────────────────────────────────────────
const STUDENTS = [
  { roll: 2203001, name: "Abhishek Chowdhury Dipta" },
  { roll: 2203002, name: "Hamonta Biswas" },
  { roll: 2203003, name: "Md. Rejone Ahmed" },
  { roll: 2203004, name: "Nahyan Yasir Ibtee" },
  { roll: 2203005, name: "Md. Sadikur Rahman" },
  { roll: 2203006, name: "Aronno Kumar Ghosh" },
  { roll: 2203007, name: "Kazi Md. Tamzid Shikto" },
  { roll: 2203008, name: "Humayra Islam Maysha" },
  { roll: 2203009, name: "Md. Rohanul Hasan Rijon" },
  { roll: 2203010, name: "Anonnoy Oniket" },
  { roll: 2203011, name: "Md. Shams Shahariar" },
  { roll: 2203012, name: "Antu Biswas" },
  { roll: 2203013, name: "Md. Zahid Hasan" },
  { roll: 2203014, name: "Abdullah Hal Kafi Nafees" },
  { roll: 2203015, name: "Zuhayer Tajbid" },
  { roll: 2203016, name: "Md. Shifat Hasan" },
  { roll: 2203017, name: "Anik Ghosh" },
  { roll: 2203018, name: "Md. Fardin Khan" },
  { roll: 2203019, name: "Apon Datta" },
  { roll: 2203020, name: "Emon Islam" },
  { roll: 2203021, name: "Sanjida Tabassum" },
  { roll: 2203022, name: "Mubashir Ahamed Siam" },
  { roll: 2203023, name: "Mostafa Maruf Ifty" },
  { roll: 2203024, name: "Md. Adnan Towhid" },
  { roll: 2203025, name: "Rahul Chandraw Dash" },
  { roll: 2203026, name: "Md. Nayem" },
  { roll: 2203027, name: "Md. Yeanur Hossain Parvez" },
  { roll: 2203028, name: "Md. Mozahid Islam" },
  { roll: 2203029, name: "Afiujjaman" },
  { roll: 2203030, name: "Sadia Farhana" },
  { roll: 2203031, name: "Md. Mhafuz Taraq Farazi" },
  { roll: 2203032, name: "Fatema Tuz Zohora Binte Ahasan" },
  { roll: 2203033, name: "Abhishek Bhattacharjee" },
  { roll: 2203034, name: "Ashiqur Rahman" },
  { roll: 2203035, name: "Md. Talha Jubair" },
  { roll: 2203036, name: "Md. Rofaz Hasan Rafiu" },
  { roll: 2203037, name: "Md Nazmul Huda" },
  { roll: 2203038, name: "Suhail Ahmed Toha" },
  { roll: 2203039, name: "Shaym Imran" },
  { roll: 2203040, name: "M. M. Saklain" },
  { roll: 2203041, name: "Md. Rubaiat Islam Siam" },
  { roll: 2203042, name: "Mahamud-urr-rasheed" },
  { roll: 2203043, name: "Md Taufiqur Islam Rabbi" },
  { roll: 2203044, name: "Md. Isteak Ahamed Imon" },
  { roll: 2203045, name: "Md Eyamin Hossan Molla" },
  { roll: 2203046, name: "Shoumitro Dutta Orgho" },
  { roll: 2203047, name: "Tausif Ul Huda" },
  { roll: 2203048, name: "Md. Ruhul Amin Pappo" },
  { roll: 2203049, name: "Supti Pal" },
  { roll: 2203050, name: "Mirza Wajih Ali" },
];

// Default password for all seeded students
const DEFAULT_PASSWORD = "password123";
const COURSE_CODE = "LTMW62";

async function main() {
  console.log(`\n🌱 Seeding ${STUDENTS.length} students → course ${COURSE_CODE}\n`);

  // ── 1. Find the target course ──────────────────────────────────────────────
  const course = await prisma.course.findUnique({ where: { code: COURSE_CODE } });
  if (!course) {
    throw new Error(`Course with code "${COURSE_CODE}" not found. Make sure it exists before seeding.`);
  }
  console.log(`✅ Found course: "${course.name}" (${course.id})\n`);

  // ── 2. Pre-hash the shared password once ──────────────────────────────────
  console.log("🔐 Hashing password (scrypt)…");
  const hashed = await hashPassword(DEFAULT_PASSWORD);
  console.log("   Done.\n");

  // ── 3. Upsert each student ────────────────────────────────────────────────
  let created = 0, existing = 0;

  for (const s of STUDENTS) {
    const email = `${s.roll}@ruet.ac.bd`;
    const rollStr = String(s.roll);

    // Upsert User
    const user = await prisma.user.upsert({
      where: { email },
      update: {},          // don't overwrite if already exists
      create: {
        name: s.name,
        email,
        emailVerified: true,
        role: "STUDENT",
        rollNumber: rollStr,
      },
    });

    // Upsert Account (holds the hashed password — Better Auth's email provider)
    const existingAccount = await prisma.account.findFirst({
      where: { userId: user.id, providerId: "credential" },
    });
    if (!existingAccount) {
      await prisma.account.create({
        data: {
          userId: user.id,
          accountId: user.id,   // Better Auth uses userId as accountId for credentials
          providerId: "credential",
          password: hashed,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
      created++;
      process.stdout.write(`   ✨ Created  [${rollStr}] ${s.name}\n`);
    } else {
      existing++;
      process.stdout.write(`   ⏭  Skipped  [${rollStr}] ${s.name} (already exists)\n`);
    }

    // Upsert Enrollment
    await prisma.enrollment.upsert({
      where: {
        courseId_studentId: { courseId: course.id, studentId: user.id },
      },
      update: {},
      create: { courseId: course.id, studentId: user.id },
    });
  }

  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Done!
   New accounts created : ${created}
   Already existed      : ${existing}
   Enrolled in course   : "${course.name}" (${COURSE_CODE})
   Default password     : ${DEFAULT_PASSWORD}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Login as any student:
  email   : <roll>@ruet.ac.bd   (e.g. 2203001@ruet.ac.bd)
  password: ${DEFAULT_PASSWORD}
`);
}

main()
  .catch((e) => { console.error("❌ Seed failed:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
