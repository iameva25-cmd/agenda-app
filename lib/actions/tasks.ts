"use server";

import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { task } from "@/db/schema";
import { getTodayDateString } from "@/lib/tasks";
import { minutesToTime, timeToMinutes } from "@/lib/time";
import { getTimeZone } from "@/lib/timezone-server";

export async function requireUserId() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session.user.id;
}

function parseEstimatedMinutes(formData: FormData) {
  const raw = formData.get("estimatedMinutes");
  if (typeof raw !== "string" || raw.trim() === "") return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

const PRIORITY_VALUES = ["urgent", "priority", "normal", "low"];

export async function createTask(formData: FormData) {
  const userId = await requireUserId();
  const title = (formData.get("title") as string)?.trim();
  if (!title) return;

  const dateRaw = formData.get("date");
  const date = typeof dateRaw === "string" && dateRaw.trim() !== ""
    ? dateRaw
    : getTodayDateString(await getTimeZone());

  const channelRaw = formData.get("channel");
  const channel = typeof channelRaw === "string" && channelRaw.trim() !== "" ? channelRaw : null;

  const channelIdRaw = formData.get("channelId");
  const channelId =
    typeof channelIdRaw === "string" && channelIdRaw.trim() !== "" ? channelIdRaw : null;

  const contextIdRaw = formData.get("contextId");
  const contextId =
    typeof contextIdRaw === "string" && contextIdRaw.trim() !== "" ? contextIdRaw : null;

  const weeklyObjectiveIdRaw = formData.get("weeklyObjectiveId");
  const weeklyObjectiveId =
    typeof weeklyObjectiveIdRaw === "string" && weeklyObjectiveIdRaw.trim() !== ""
      ? weeklyObjectiveIdRaw
      : null;

  const priorityRaw = formData.get("priority");
  const priority =
    typeof priorityRaw === "string" && PRIORITY_VALUES.includes(priorityRaw)
      ? priorityRaw
      : "normal";

  const estimatedMinutes = parseEstimatedMinutes(formData);

  const startTimeRaw = formData.get("startTime");
  const startTime =
    typeof startTimeRaw === "string" && startTimeRaw.trim() !== "" ? startTimeRaw : null;
  const endTime = startTime
    ? minutesToTime(timeToMinutes(startTime) + (estimatedMinutes ?? 30))
    : null;

  await db.insert(task).values({
    userId,
    title,
    date,
    estimatedMinutes,
    channel,
    channelId,
    contextId,
    priority,
    startTime,
    endTime,
    weeklyObjectiveId,
  });

  revalidatePath("/today");
}

export async function updateTask(id: string, formData: FormData) {
  const userId = await requireUserId();
  const title = (formData.get("title") as string)?.trim();
  if (!title) return;

  const updates: { title: string; estimatedMinutes?: number | null; description?: string | null } = {
    title,
  };

  if (formData.has("estimatedMinutes")) {
    updates.estimatedMinutes = parseEstimatedMinutes(formData);
  }

  if (formData.has("description")) {
    const description = (formData.get("description") as string).trim();
    updates.description = description === "" ? null : description;
  }

  await db
    .update(task)
    .set(updates)
    .where(and(eq(task.id, id), eq(task.userId, userId)));

  revalidatePath("/today");
}

export async function setTaskChannel(id: string, channelId: string | null) {
  const userId = await requireUserId();

  await db
    .update(task)
    .set({ channelId, contextId: null })
    .where(and(eq(task.id, id), eq(task.userId, userId)));

  revalidatePath("/today");
}

export async function setTaskContext(id: string, contextId: string) {
  const userId = await requireUserId();

  await db
    .update(task)
    .set({ contextId, channelId: null })
    .where(and(eq(task.id, id), eq(task.userId, userId)));

  revalidatePath("/today");
}

export async function setTaskPriority(id: string, priority: string) {
  const userId = await requireUserId();
  if (!PRIORITY_VALUES.includes(priority)) return;

  await db
    .update(task)
    .set({ priority })
    .where(and(eq(task.id, id), eq(task.userId, userId)));

  revalidatePath("/today");
}

export async function deleteTask(id: string) {
  const userId = await requireUserId();

  await db.delete(task).where(and(eq(task.id, id), eq(task.userId, userId)));

  revalidatePath("/today");
}

export async function toggleTaskStatus(id: string, currentStatus: string) {
  const userId = await requireUserId();
  const nextStatus = currentStatus === "done" ? "todo" : "done";

  await db
    .update(task)
    .set({ status: nextStatus })
    .where(and(eq(task.id, id), eq(task.userId, userId)));

  revalidatePath("/today");
}

export async function scheduleTask(id: string, startTime: string) {
  const userId = await requireUserId();

  const [existing] = await db
    .select({ estimatedMinutes: task.estimatedMinutes })
    .from(task)
    .where(and(eq(task.id, id), eq(task.userId, userId)));

  if (!existing) return;

  const durationMinutes = existing.estimatedMinutes ?? 30;
  const endTime = minutesToTime(timeToMinutes(startTime) + durationMinutes);

  await db
    .update(task)
    .set({ startTime, endTime })
    .where(and(eq(task.id, id), eq(task.userId, userId)));

  revalidatePath("/today");
}

export async function startTimer(id: string) {
  const userId = await requireUserId();

  await db
    .update(task)
    .set({ timerStartedAt: new Date() })
    .where(and(eq(task.id, id), eq(task.userId, userId)));

  revalidatePath("/today");
}

export async function pauseTimer(id: string) {
  const userId = await requireUserId();

  const [existing] = await db
    .select({ actualSeconds: task.actualSeconds, timerStartedAt: task.timerStartedAt })
    .from(task)
    .where(and(eq(task.id, id), eq(task.userId, userId)));

  if (!existing || !existing.timerStartedAt) return;

  const elapsedSeconds = Math.floor(
    (Date.now() - existing.timerStartedAt.getTime()) / 1000,
  );

  await db
    .update(task)
    .set({
      actualSeconds: existing.actualSeconds + elapsedSeconds,
      timerStartedAt: null,
    })
    .where(and(eq(task.id, id), eq(task.userId, userId)));

  revalidatePath("/today");
}

const MAX_HIGHLIGHTS_PER_DAY = 3;

export async function toggleTaskHighlight(id: string, currentIsHighlight: boolean) {
  const userId = await requireUserId();

  if (!currentIsHighlight) {
    const [existing] = await db
      .select({ date: task.date })
      .from(task)
      .where(and(eq(task.id, id), eq(task.userId, userId)));

    if (!existing) return;

    const highlightsToday = await db
      .select({ id: task.id })
      .from(task)
      .where(
        and(
          eq(task.userId, userId),
          eq(task.date, existing.date),
          eq(task.isHighlight, true),
        ),
      );

    if (highlightsToday.length >= MAX_HIGHLIGHTS_PER_DAY) return;
  }

  await db
    .update(task)
    .set({ isHighlight: !currentIsHighlight })
    .where(and(eq(task.id, id), eq(task.userId, userId)));

  revalidatePath("/today");
}

export async function unscheduleTask(id: string) {
  const userId = await requireUserId();

  await db
    .update(task)
    .set({ startTime: null, endTime: null })
    .where(and(eq(task.id, id), eq(task.userId, userId)));

  revalidatePath("/today");
}

// Dipakai waktu drag & drop reorder task dalam satu hari selesai — orderedIds
// adalah urutan task id sesuai posisi baru di layar (dari atas ke bawah),
// index-nya langsung dipakai jadi nilai `position`. scheduleChange opsional:
// dipakai kalau task yang di-drag posisinya sekarang di antara/dekat task
// lain yang sudah punya jam, sehingga jamnya sendiri ikut disesuaikan (atau
// dihapus kalau di-drop ke zona belum terjadwal) — dihitung di client
// (TaskDndProvider), di sini cuma nyimpan hasilnya.
export async function reorderDayTasks(
  orderedIds: string[],
  scheduleChange?: { id: string; startTime: string | null; endTime: string | null },
) {
  const userId = await requireUserId();

  await Promise.all([
    ...orderedIds.map((id, index) =>
      db
        .update(task)
        .set({ position: index })
        .where(and(eq(task.id, id), eq(task.userId, userId))),
    ),
    ...(scheduleChange
      ? [
          db
            .update(task)
            .set({ startTime: scheduleChange.startTime, endTime: scheduleChange.endTime })
            .where(and(eq(task.id, scheduleChange.id), eq(task.userId, userId))),
        ]
      : []),
  ]);

  revalidatePath("/today");
}

// Dipakai waktu drag & drop task ke kolom HARI LAIN — tanggalnya berubah,
// jam (startTime/endTime) sengaja TIDAK disentuh (task pindah hari tapi
// tetap di jam yang sama). destOrderedIds/sourceOrderedIds dipakai untuk
// menata ulang `position` di kedua hari (tujuan & asal) sekaligus.
export async function moveTaskToDay(
  taskId: string,
  newDate: string,
  destOrderedIds: string[],
  sourceOrderedIds: string[],
) {
  const userId = await requireUserId();

  await db
    .update(task)
    .set({ date: newDate })
    .where(and(eq(task.id, taskId), eq(task.userId, userId)));

  await Promise.all([
    ...destOrderedIds.map((id, index) =>
      db
        .update(task)
        .set({ position: index })
        .where(and(eq(task.id, id), eq(task.userId, userId))),
    ),
    ...sourceOrderedIds.map((id, index) =>
      db
        .update(task)
        .set({ position: index })
        .where(and(eq(task.id, id), eq(task.userId, userId))),
    ),
  ]);

  revalidatePath("/today");
}

export async function setTaskDate(id: string, date: string) {
  const userId = await requireUserId();

  await db
    .update(task)
    .set({ date })
    .where(and(eq(task.id, id), eq(task.userId, userId)));

  revalidatePath("/today");
}

export async function setTaskDueDate(id: string, dueDate: string | null) {
  const userId = await requireUserId();

  await db
    .update(task)
    .set({ dueDate })
    .where(and(eq(task.id, id), eq(task.userId, userId)));

  revalidatePath("/today");
}

const REPEAT_VALUES = ["daily", "weekly", "custom"];

// repeatRule: null (tidak berulang), "daily", "weekly", atau
// "custom:mon,wed,fri" (hari spesifik, disingkat 3 huruf dipisah koma).
// Catatan: ini baru menyimpan PREFERENSI repeat-nya di task ini saja —
// belum ada logic yang benar-benar generate task baru tiap hari/minggu.
export async function setTaskRepeatRule(id: string, repeatRule: string | null) {
  const userId = await requireUserId();

  if (repeatRule !== null) {
    const kind = repeatRule.split(":")[0];
    if (!REPEAT_VALUES.includes(kind)) return;
  }

  await db
    .update(task)
    .set({ repeatRule })
    .where(and(eq(task.id, id), eq(task.userId, userId)));

  revalidatePath("/today");
}

export async function setTaskWeeklyObjective(id: string, weeklyObjectiveId: string | null) {
  const userId = await requireUserId();

  await db
    .update(task)
    .set({ weeklyObjectiveId })
    .where(and(eq(task.id, id), eq(task.userId, userId)));

  revalidatePath("/today");
}

export async function duplicateTask(id: string) {
  const userId = await requireUserId();

  const [existing] = await db
    .select()
    .from(task)
    .where(and(eq(task.id, id), eq(task.userId, userId)));

  if (!existing) return;

  await db.insert(task).values({
    userId,
    title: `${existing.title} (copy)`,
    description: existing.description,
    date: existing.date,
    dueDate: existing.dueDate,
    repeatRule: existing.repeatRule,
    startTime: existing.startTime,
    endTime: existing.endTime,
    estimatedMinutes: existing.estimatedMinutes,
    channel: existing.channel,
    channelId: existing.channelId,
    contextId: existing.contextId,
    weeklyObjectiveId: existing.weeklyObjectiveId,
    priority: existing.priority,
  });

  revalidatePath("/today");
}
