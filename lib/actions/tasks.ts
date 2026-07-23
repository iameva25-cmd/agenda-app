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
    priority,
    startTime,
    endTime,
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
