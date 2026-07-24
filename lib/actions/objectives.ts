"use server";

import { and, asc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { weeklyObjective } from "@/db/schema";
import { requireUserId } from "@/lib/actions/tasks";

export async function getObjectivesForWeek(weekStartDate: string) {
  const userId = await requireUserId();

  return db
    .select()
    .from(weeklyObjective)
    .where(
      and(
        eq(weeklyObjective.userId, userId),
        eq(weeklyObjective.weekStartDate, weekStartDate),
      ),
    )
    .orderBy(asc(weeklyObjective.createdAt));
}

export async function createObjective(weekStartDate: string, formData: FormData) {
  const userId = await requireUserId();
  const text = (formData.get("text") as string)?.trim();
  if (!text) return;

  await db.insert(weeklyObjective).values({ userId, weekStartDate, text });

  revalidatePath("/week/planning");
}

export async function toggleObjectiveDone(id: string, currentDone: boolean) {
  const userId = await requireUserId();

  await db
    .update(weeklyObjective)
    .set({ done: !currentDone })
    .where(and(eq(weeklyObjective.id, id), eq(weeklyObjective.userId, userId)));

  revalidatePath("/week/planning");
}

export async function updateObjectiveText(id: string, text: string) {
  const userId = await requireUserId();
  const trimmed = text.trim();
  if (!trimmed) return;

  await db
    .update(weeklyObjective)
    .set({ text: trimmed })
    .where(and(eq(weeklyObjective.id, id), eq(weeklyObjective.userId, userId)));

  revalidatePath("/week/planning");
}

export async function deleteObjective(id: string) {
  const userId = await requireUserId();

  await db
    .delete(weeklyObjective)
    .where(and(eq(weeklyObjective.id, id), eq(weeklyObjective.userId, userId)));

  revalidatePath("/week/planning");
}
