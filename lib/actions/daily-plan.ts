"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { dailyPlan } from "@/db/schema";
import { requireUserId } from "@/lib/actions/tasks";

export async function getShutdownTime(dateStr: string) {
  const userId = await requireUserId();

  const [existing] = await db
    .select({ shutdownTime: dailyPlan.shutdownTime })
    .from(dailyPlan)
    .where(and(eq(dailyPlan.userId, userId), eq(dailyPlan.date, dateStr)));

  return existing?.shutdownTime ?? null;
}

export async function setShutdownTime(dateStr: string, shutdownTime: string | null) {
  const userId = await requireUserId();

  const [existing] = await db
    .select({ id: dailyPlan.id })
    .from(dailyPlan)
    .where(and(eq(dailyPlan.userId, userId), eq(dailyPlan.date, dateStr)));

  if (existing) {
    await db.update(dailyPlan).set({ shutdownTime }).where(eq(dailyPlan.id, existing.id));
  } else {
    await db.insert(dailyPlan).values({ userId, date: dateStr, shutdownTime });
  }

  revalidatePath("/today/planning");
}
