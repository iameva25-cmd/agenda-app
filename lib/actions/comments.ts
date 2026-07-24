"use server";

import { and, asc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { comment, task, user } from "@/db/schema";
import { requireUserId } from "@/lib/actions/tasks";

export async function getCommentsForTask(taskId: string) {
  const userId = await requireUserId();

  return db
    .select({
      id: comment.id,
      text: comment.text,
      createdAt: comment.createdAt,
      userName: user.name,
    })
    .from(comment)
    .innerJoin(task, eq(comment.taskId, task.id))
    .innerJoin(user, eq(comment.userId, user.id))
    .where(and(eq(comment.taskId, taskId), eq(task.userId, userId)))
    .orderBy(asc(comment.createdAt));
}

export async function createComment(taskId: string, formData: FormData) {
  const userId = await requireUserId();
  const text = (formData.get("text") as string)?.trim();
  if (!text) return;

  const [existingTask] = await db
    .select({ id: task.id })
    .from(task)
    .where(and(eq(task.id, taskId), eq(task.userId, userId)));
  if (!existingTask) return;

  await db.insert(comment).values({ taskId, userId, text });

  revalidatePath("/today");
}
