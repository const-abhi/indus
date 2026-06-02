import webpush from "web-push";
import { prisma } from "@/lib/prisma";

interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

function initVapid() {
  const subject = process.env.VAPID_SUBJECT;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!subject || !publicKey || !privateKey) return false;
  webpush.setVapidDetails(subject, publicKey, privateKey);
  return true;
}

export async function sendPushToUser(userId: string, payload: PushPayload) {
  if (!initVapid()) return;
  const subs = await prisma.pushSubscription.findMany({ where: { userId } });
  if (!subs.length) return;

  const message = JSON.stringify({ ...payload, icon: "/icon-192.png" });

  await Promise.allSettled(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          message
        );
      } catch (err: unknown) {
        if (err && typeof err === "object" && "statusCode" in err && (err as { statusCode: number }).statusCode === 410) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => { });
        }
      }
    })
  );
}

export async function sendPushToMany(userIds: string[], payload: PushPayload) {
  await Promise.allSettled(userIds.map((uid) => sendPushToUser(uid, payload)));
}