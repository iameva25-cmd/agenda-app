import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { task } from "@/db/schema";
import { formatDate, parseDateString, addDays } from "@/lib/date";
import { getDateStringInTimezone } from "@/lib/timezone";

export function getTodayDateString(timeZone: string) {
  return getDateStringInTimezone(new Date(), timeZone);
}

export function getYesterdayDateString(timeZone: string) {
  return formatDate(addDays(parseDateString(getTodayDateString(timeZone)), -1));
}

export function getDateStringWithOffset(offsetDays: number, timeZone: string) {
  return formatDate(addDays(parseDateString(getTodayDateString(timeZone)), offsetDays));
}

export function getUpcomingDateStrings(numDays: number, timeZone: string) {
  return Array.from({ length: numDays }, (_, i) => getDateStringWithOffset(i, timeZone));
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

export async function carryOverUnfinishedTasks(userId: string, timeZone: string) {
  const yesterdayStr = getYesterdayDateString(timeZone);
  const todayStr = getTodayDateString(timeZone);

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
