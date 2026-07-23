"use client";

import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { timeToMinutes } from "@/lib/time";
import type { task } from "@/db/schema";

type Task = typeof task.$inferSelect;

const LEAD_MINUTES = 5;
const CHECK_INTERVAL_MS = 15_000;

export function TaskReminders({ tasks }: { tasks: Task[] }) {
  const [permission, setPermission] = useState<NotificationPermission | null>(null);
  const notifiedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;

    let status: PermissionStatus | undefined;

    const query =
      navigator.permissions?.query({ name: "notifications" as PermissionName }) ??
      Promise.resolve(null);

    // PermissionStatus.state pakai kosakata "prompt", beda dari
    // Notification.permission yang pakai "default" - disamakan di sini
    // supaya sisa komponen cukup pakai satu kosakata (NotificationPermission).
    function toNotificationPermission(state: PermissionState): NotificationPermission {
      return state === "prompt" ? "default" : state;
    }

    query
      .then((result) => {
        if (result) {
          status = result;
          setPermission(toNotificationPermission(result.state));
          result.onchange = () => setPermission(toNotificationPermission(result.state));
        } else {
          setPermission(Notification.permission);
        }
      })
      .catch(() => setPermission(Notification.permission));

    return () => {
      if (status) status.onchange = null;
    };
  }, []);

  useEffect(() => {
    if (permission !== "granted") return;

    function checkReminders() {
      const now = new Date();
      const nowMinutes = now.getHours() * 60 + now.getMinutes();

      for (const t of tasks) {
        if (!t.startTime || t.status === "done") continue;
        if (notifiedRef.current.has(t.id)) continue;

        const diff = timeToMinutes(t.startTime) - nowMinutes;
        if (diff >= 0 && diff <= LEAD_MINUTES) {
          new Notification(`Segera dimulai: ${t.title}`, {
            body: `Dijadwalkan jam ${t.startTime}`,
            tag: t.id,
          });
          notifiedRef.current.add(t.id);
        }
      }
    }

    checkReminders();
    const interval = setInterval(checkReminders, CHECK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [permission, tasks]);

  if (permission !== "default") return null;

  return (
    <button
      type="button"
      onClick={async () => {
        const result = await Notification.requestPermission();
        setPermission(result);
      }}
      className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl border border-primary/40 bg-primary/5 px-3 py-2 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
    >
      <Bell className="h-3.5 w-3.5" />
      Aktifkan notifikasi reminder
    </button>
  );
}
