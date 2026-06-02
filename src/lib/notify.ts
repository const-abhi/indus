import { prisma } from "@/lib/prisma";
import { NotificationType } from "@prisma/client";
import { sendPushToUser } from "@/lib/webpush";

/**
 * Server-side utility called on dashboard page load.
 * Creates in-app notifications for new tasks and upcoming deadlines.
 * For NEWLY generated notifications, also fires a web push so the user
 * sees it in their OS notification tray even if the tab is closed.
 */
export async function generatePendingNotifications(
  userId: string,
  role: string
): Promise<void> {
  try {
    const now = new Date();

    if (role === "STUDENT") {
      const enrollments = await prisma.enrollment.findMany({
        where: { studentId: userId },
        select: { courseId: true },
      });
      const courseIds = enrollments.map((e) => e.courseId);
      if (courseIds.length === 0) return;

      // ── New tasks not yet notified ──────────────────────────────────────
      const tasks = await prisma.task.findMany({
        where: { courseId: { in: courseIds } },
        select: { id: true, title: true, postType: true },
      });

      for (const t of tasks) {
        const type = (t.postType === "ANNOUNCEMENT" ? "NEW_ANNOUNCEMENT" : "NEW_ASSIGNMENT") as NotificationType;
        const title = t.postType === "ANNOUNCEMENT" ? `📢 Announcement: ${t.title}` : `📋 New assignment: ${t.title}`;
        const body  = t.postType === "ANNOUNCEMENT"
          ? "Your teacher posted an announcement."
          : "A new assignment has been posted in your course.";

        // createMany skipDuplicates returns no count, so we use upsert pattern
        const result = await prisma.notification.upsert({
          where: { userId_type_taskId: { userId, type, taskId: t.id } },
          create: { userId, taskId: t.id, type, title, body },
          update: {}, // already exists — don't re-push
        });

        // Only push if this is a freshly created notification (createdAt ≈ now)
        const isNew = Date.now() - result.createdAt.getTime() < 30_000;
        if (isNew) {
          await sendPushToUser(userId, {
            title,
            body,
            url: t.postType === "ANNOUNCEMENT" ? "/student/courses" : `/student/tasks/${t.id}`,
          });
        }
      }

      // ── Upcoming submission deadlines (within 2 days, not yet submitted) ─
      const twoDaysFromNow = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
      const urgentTasks = await prisma.task.findMany({
        where: {
          courseId: { in: courseIds },
          postType: "ASSIGNMENT",
          dueDate: { gte: now, lte: twoDaysFromNow },
          submissions: { none: { studentId: userId } },
        },
        select: { id: true, title: true },
      });

      for (const t of urgentTasks) {
        const type = "SUBMISSION_DEADLINE" as NotificationType;
        const title = `⏰ Deadline soon: ${t.title}`;
        const body  = "Due in less than 2 days. Don't miss it!";

        const result = await prisma.notification.upsert({
          where: { userId_type_taskId: { userId, type, taskId: t.id } },
          create: { userId, taskId: t.id, type, title, body },
          update: {},
        });

        const isNew = Date.now() - result.createdAt.getTime() < 30_000;
        if (isNew) {
          await sendPushToUser(userId, { title, body, url: `/student/tasks/${t.id}` });
        }
      }

    } else if (role === "TEACHER") {
      // ── Upcoming evaluation deadlines (within 3 days) ───────────────────
      const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
      const evalTasks = await prisma.task.findMany({
        where: {
          createdById: userId,
          postType: "ASSIGNMENT",
          evaluationDeadline: { gte: now, lte: threeDaysFromNow },
        },
        select: { id: true, title: true },
      });

      for (const t of evalTasks) {
        const type = "EVALUATION_DEADLINE" as NotificationType;
        const title = `📊 Evaluate soon: ${t.title}`;
        const body  = "Evaluation deadline is within 3 days.";

        const result = await prisma.notification.upsert({
          where: { userId_type_taskId: { userId, type, taskId: t.id } },
          create: { userId, taskId: t.id, type, title, body },
          update: {},
        });

        const isNew = Date.now() - result.createdAt.getTime() < 30_000;
        if (isNew) {
          await sendPushToUser(userId, { title, body, url: `/teacher/tasks/${t.id}/evaluate` });
        }
      }
    }
  } catch (err) {
    // Non-fatal — don't crash the page
    console.error("generatePendingNotifications error:", err);
  }
}
