"use server";

import { and, asc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { subtask, task } from "@/db/schema";
import { requireUserId } from "@/lib/actions/tasks";

export async function getSubtasksForTask(taskId: string) {
  const userId = await requireUserId();

  return db
    .select({
      id: subtask.id,
      taskId: subtask.taskId,
      title: subtask.title,
      done: subtask.done,
    })
    .from(subtask)
    .innerJoin(task, eq(subtask.taskId, task.id))
    .where(and(eq(subtask.taskId, taskId), eq(task.userId, userId)))
    .orderBy(asc(subtask.createdAt));
}

export async function createSubtask(taskId: string, formData: FormData) {
  const userId = await requireUserId();
  const title = (formData.get("title") as string)?.trim();
  if (!title) return;

  const [existingTask] = await db
    .select({ id: task.id })
    .from(task)
    .where(and(eq(task.id, taskId), eq(task.userId, userId)));
  if (!existingTask) return;

  await db.insert(subtask).values({ taskId, title });

  revalidatePath("/today");
}

export async function toggleSubtaskStatus(id: string, currentDone: boolean) {
  const userId = await requireUserId();

  const [existing] = await db
    .select({ id: subtask.id })
    .from(subtask)
    .innerJoin(task, eq(subtask.taskId, task.id))
    .where(and(eq(subtask.id, id), eq(task.userId, userId)));
  if (!existing) return;

  await db.update(subtask).set({ done: !currentDone }).where(eq(subtask.id, id));

  revalidatePath("/today");
}
