import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create teacher
  const teacher = await prisma.user.upsert({
    where: { email: "teacher@indus.edu" },
    update: {},
    create: {
      name: "Ms. Sarah Smith",
      email: "teacher@indus.edu",
      emailVerified: true,
      role: Role.TEACHER,
    },
  });

  // Create students
  const student1 = await prisma.user.upsert({
    where: { email: "student1@indus.edu" },
    update: {},
    create: {
      name: "Rahul Sharma",
      email: "student1@indus.edu",
      emailVerified: true,
      role: Role.STUDENT,
    },
  });

  const student2 = await prisma.user.upsert({
    where: { email: "student2@indus.edu" },
    update: {},
    create: {
      name: "Priya Patel",
      email: "student2@indus.edu",
      emailVerified: true,
      role: Role.STUDENT,
    },
  });

  // Create tasks
  const task1 = await prisma.task.create({
    data: {
      title: "Essay on Climate Change",
      description:
        "Write a 1000-word essay on the causes and effects of climate change. Include at least 3 peer-reviewed references. Discuss both the scientific and socioeconomic impacts.",
      subject: "English",
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      createdById: teacher.id,
    },
  });

  const task2 = await prisma.task.create({
    data: {
      title: "Algebra Problem Set — Chapter 5",
      description:
        "Complete problems 1–20 from Chapter 5 of your textbook. Show all working clearly. You may use the formula sheet provided in class. Submit as a scanned PDF.",
      subject: "Mathematics",
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      createdById: teacher.id,
    },
  });

  await prisma.task.create({
    data: {
      title: "World War I Research Report",
      description:
        "Research and write about the primary causes of World War I. Your report should be a minimum of 800 words, structured with an introduction, body sections, and conclusion. Cite all sources.",
      subject: "History",
      dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      createdById: teacher.id,
    },
  });

  // Create a sample submission
  await prisma.submission.create({
    data: {
      fileUrl: "https://example.com/algebra_rahul.pdf",
      fileName: "algebra_chapter5_rahul.pdf",
      fileSize: 245000,
      notes: "Completed all 20 problems. Used graphing for Q15-18.",
      taskId: task2.id,
      studentId: student1.id,
    },
  });

  console.log("Seed complete.");
  console.log(`Teacher: ${teacher.email}`);
  console.log(`Students: ${student1.email}, ${student2.email}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
