import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { task } from "@/db/schema";
import { formatDate } from "@/lib/date";

export function getTodayDateString() {
  return formatDate(new Date());
}

export function getYesterdayDateString() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return formatDate(yesterday);
}

export function getDateStringWithOffset(offsetDays: number) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return formatDate(date);
}

export function getUpcomingDateStrings(numDays: number) {
  return Array.from({ length: numDays }, (_, i) => getDateStringWithOffset(i));
}

export async function getTasksForDate(userId: string, dateStr: string) {
  return db
    .select()
    .from(task)
    .where(and(eq(task.userId, userId), eq(task.date, dateStr)));
}

export async function getTasksForDates(userId: string, dateStrings: string[]) {
  return db
    .select()
    .from(task)
    .where(and(eq(task.userId, userId), inArray(task.date, dateStrings)));
}

export async function carryOverUnfinishedTasks(userId: string) {
  const yesterdayStr = getYesterdayDateString();
  const todayStr = getTodayDateString();

  const unfinished = await db
    .select()
    .from(task)
    .where(
      and(
        eq(task.userId, userId),
        eq(task.date, yesterdayStr),
        eq(task.status, "todo"),
      ),
    );

  if (unfinished.length === 0) return;

  const todayTasks = await db
    .select({ carriedOverFrom: task.carriedOverFrom })
    .from(task)
    .where(and(eq(task.userId, userId), eq(task.date, todayStr)));

  const alreadyCarriedIds = new Set(
    todayTasks
      .map((t) => t.carriedOverFrom)
      .filter((id): id is string => id !== null),
  );

  const toInsert = unfinished
    .filter((t) => !alreadyCarriedIds.has(t.id))
    .map((t) => ({
      userId,
      title: t.title,
      description: t.description,
      date: todayStr,
      estimatedMinutes: t.estimatedMinutes,
      carriedOverFrom: t.id,
    }));

  if (toInsert.length > 0) {
    await db.insert(task).values(toInsert);
  }
}
