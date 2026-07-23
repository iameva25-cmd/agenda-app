"use server";

import { and, asc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { channel, context } from "@/db/schema";
import { requireUserId } from "@/lib/actions/tasks";
import { CATEGORY_COLORS } from "@/lib/category-colors";

function parseChannelColor(formData: FormData): string | null {
  const color = (formData.get("color") as string)?.trim();
  return color && CATEGORY_COLORS.includes(color as (typeof CATEGORY_COLORS)[number])
    ? color
    : null;
}

async function getOrCreateUncategorizedContext(userId: string) {
  const [existing] = await db
    .select()
    .from(context)
    .where(and(eq(context.userId, userId), eq(context.name, "uncategorized")));
  if (existing) return existing;

  const [created] = await db
    .insert(context)
    .values({ userId, name: "uncategorized" })
    .returning();
  return created;
}

export async function getContextsForUser() {
  const userId = await requireUserId();
  await getOrCreateUncategorizedContext(userId);

  return db
    .select()
    .from(context)
    .where(eq(context.userId, userId))
    .orderBy(asc(context.createdAt));
}

export async function getContextsWithChannels() {
  const userId = await requireUserId();
  await getOrCreateUncategorizedContext(userId);

  const contexts = await db
    .select()
    .from(context)
    .where(eq(context.userId, userId))
    .orderBy(asc(context.createdAt));

  const rows = await db
    .select()
    .from(channel)
    .innerJoin(context, eq(channel.contextId, context.id))
    .where(eq(context.userId, userId))
    .orderBy(asc(channel.createdAt));

  return contexts.map((ctx) => ({
    ...ctx,
    channels: rows.filter((r) => r.context.id === ctx.id).map((r) => r.channel),
  }));
}

export async function createContext(formData: FormData) {
  const userId = await requireUserId();
  const name = (formData.get("name") as string)?.trim();
  const color = (formData.get("color") as string)?.trim();
  if (!name || !CATEGORY_COLORS.includes(color as (typeof CATEGORY_COLORS)[number])) return;

  await db.insert(context).values({ userId, name, color });

  revalidatePath("/today");
  revalidatePath("/settings/channels");
}

export async function updateContext(id: string, formData: FormData) {
  const userId = await requireUserId();
  const name = (formData.get("name") as string)?.trim();
  const color = (formData.get("color") as string)?.trim();
  if (!name || !CATEGORY_COLORS.includes(color as (typeof CATEGORY_COLORS)[number])) return;

  await db
    .update(context)
    .set({ name, color })
    .where(and(eq(context.id, id), eq(context.userId, userId)));

  revalidatePath("/today");
  revalidatePath("/settings/channels");
}

export async function deleteContext(id: string) {
  const userId = await requireUserId();

  await db.delete(context).where(and(eq(context.id, id), eq(context.userId, userId)));

  revalidatePath("/today");
  revalidatePath("/settings/channels");
}

export async function createChannel(formData: FormData) {
  const userId = await requireUserId();
  const name = (formData.get("name") as string)?.trim();
  if (!name) return;
  const color = parseChannelColor(formData);

  const contextIdRaw = formData.get("contextId");
  let contextId = typeof contextIdRaw === "string" && contextIdRaw !== "" ? contextIdRaw : null;

  if (contextId) {
    const [owned] = await db
      .select({ id: context.id })
      .from(context)
      .where(and(eq(context.id, contextId), eq(context.userId, userId)));
    if (!owned) return;
  } else {
    const uncategorized = await getOrCreateUncategorizedContext(userId);
    contextId = uncategorized.id;
  }

  const isPrivate = formData.get("isPrivate") === "true";

  await db.insert(channel).values({ contextId, name, color, isPrivate });

  revalidatePath("/today");
  revalidatePath("/settings/channels");
}

export async function updateChannel(id: string, formData: FormData) {
  const userId = await requireUserId();
  const name = (formData.get("name") as string)?.trim();
  if (!name) return;
  const color = parseChannelColor(formData);

  const [existing] = await db
    .select({ id: channel.id })
    .from(channel)
    .innerJoin(context, eq(channel.contextId, context.id))
    .where(and(eq(channel.id, id), eq(context.userId, userId)));
  if (!existing) return;

  await db.update(channel).set({ name, color }).where(eq(channel.id, id));

  revalidatePath("/today");
  revalidatePath("/settings/channels");
}

export async function deleteChannel(id: string) {
  const userId = await requireUserId();

  const [existing] = await db
    .select({ id: channel.id })
    .from(channel)
    .innerJoin(context, eq(channel.contextId, context.id))
    .where(and(eq(channel.id, id), eq(context.userId, userId)));
  if (!existing) return;

  await db.delete(channel).where(eq(channel.id, id));

  revalidatePath("/today");
  revalidatePath("/settings/channels");
}

export async function toggleChannelEnabled(id: string, currentEnabled: boolean) {
  const userId = await requireUserId();

  const [existing] = await db
    .select({ id: channel.id })
    .from(channel)
    .innerJoin(context, eq(channel.contextId, context.id))
    .where(and(eq(channel.id, id), eq(context.userId, userId)));
  if (!existing) return;

  await db.update(channel).set({ enabled: !currentEnabled }).where(eq(channel.id, id));

  revalidatePath("/today");
  revalidatePath("/settings/channels");
}
