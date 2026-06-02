"use client";

import { useEffect } from "react";

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const buffer = new ArrayBuffer(rawData.length);
  const view = new Uint8Array(buffer);
  for (let i = 0; i < rawData.length; i++) view[i] = rawData.charCodeAt(i);
  return view;
}

export default function PushRegistration() {
  useEffect(() => {
    registerPush();
  }, []);

  async function registerPush() {
    try {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!publicKey) return;

      // Register service worker
      const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });

      // Check existing permission — don't re-prompt if denied
      if (Notification.permission === "denied") return;

      // Request permission (browser only shows the prompt once)
      const permission = await Notification.requestPermission();
      if (permission !== "granted") return;

      // Reuse existing subscription or create a new one
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });
      }

      // Save to backend
      const json = sub.toJSON();
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: sub.endpoint,
          p256dh: json.keys?.p256dh ?? "",
          auth: json.keys?.auth ?? "",
        }),
      });
    } catch (err) {
      // Non-fatal — push is optional
      console.warn("Push registration failed:", err);
    }
  }

  // Renders nothing — side-effect only
  return null;
}
