import { PrismaClient, Role, PostType } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Indus v2…");

  // Teacher
  const teacher = await prisma.user.upsert({
    where: { email: "teacher@indus.edu" },
    update: {},
    create: { name: "Ms. Sarah Smith", email: "teacher@indus.edu", emailVerified: true, role: Role.TEACHER },
  });

  // Students (with roll numbers)
  const s1 = await prisma.user.upsert({
    where: { email: "student1@indus.edu" },
    update: {},
    create: { name: "Rahul Sharma", email: "student1@indus.edu", emailVerified: true, role: Role.STUDENT, rollNumber: "2203033" },
  });

  const s2 = await prisma.user.upsert({
    where: { email: "student2@indus.edu" },
    update: {},
    create: { name: "Priya Patel", email: "student2@indus.edu", emailVerified: true, role: Role.STUDENT, rollNumber: "2203034" },
  });

  // Courses
  const cse = await prisma.course.create({
    data: { name: "Computer Science — Grade 10", description: "Programming and computational thinking.", code: "CS101A", teacherId: teacher.id },
  });

  const eng = await prisma.course.create({
    data: { name: "English Literature", description: "Reading, writing and critical analysis.", code: "ENG42B", teacherId: teacher.id },
  });

  // Enroll students (simplified — just courseId + studentId)
  await prisma.enrollment.createMany({
    data: [
      { courseId: cse.id, studentId: s1.id },
      { courseId: eng.id, studentId: s1.id },
      { courseId: cse.id, studentId: s2.id },
    ],
    skipDuplicates: true,
  });

  // Tasks — ASSIGNMENT
  const task1 = await prisma.task.create({
    data: {
      title: "Algebra Problem Set — Chapter 5",
      description: "Complete problems 1–20. Show all working clearly. Submit as scanned PDF.",
      subject: "Mathematics",
      postType: PostType.ASSIGNMENT,
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      evaluationDeadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      attachments: [{ type: "link", url: "https://example.com/chapter5.pdf", name: "Chapter 5 PDF" }],
      createdById: teacher.id,
      courseId: cse.id,
    },
  });

  await prisma.task.create({
    data: {
      title: "Python Turtle Graphics",
      description: "Draw a house using turtle module. Submit as .py file.",
      subject: "Computer Science",
      postType: PostType.ASSIGNMENT,
      dueDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
      evaluationDeadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      createdById: teacher.id,
      courseId: cse.id,
    },
  });

  // ANNOUNCEMENT
  await prisma.task.create({
    data: {
      title: "Mid-term exam schedule",
      description: "Mid-term exams will be held from June 15–20. Check the portal for your timetable. Bring your ID cards.",
      postType: PostType.ANNOUNCEMENT,
      createdById: teacher.id,
      courseId: cse.id,
    },
  });

  await prisma.task.create({
    data: {
      title: "Essay on Climate Change",
      description: "Write a 1000-word essay. Include 3 peer-reviewed references.",
      subject: "English",
      postType: PostType.ASSIGNMENT,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      evaluationDeadline: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
      createdById: teacher.id,
      courseId: eng.id,
    },
  });

  // Sample submission from Rahul
  await prisma.submission.create({
    data: {
      fileUrl: "https://example.com/algebra_rahul.pdf",
      fileName: "algebra_ch5_rahul.pdf",
      fileSize: 245000,
      notes: "Completed all 20 problems.",
      taskId: task1.id,
      studentId: s1.id,
    },
  });

  console.log("✅ Seed complete");
  console.log(`Teacher: teacher@indus.edu`);
  console.log(`Students: student1@indus.edu (roll: 2203033), student2@indus.edu (roll: 2203034)`);
  console.log(`Courses: CS101A, ENG42B`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
