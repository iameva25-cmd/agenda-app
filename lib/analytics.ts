import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { task } from "@/db/schema";
import { getContextsWithChannels } from "@/lib/actions/channels";
import { resolveChannelColor } from "@/lib/category-colors";

export async function getDailyProductivity(userId: string, dateStrings: string[]) {
  const rows = await db
    .select({ date: task.date, actualSeconds: task.actualSeconds })
    .from(task)
    .where(and(eq(task.userId, userId), inArray(task.date, dateStrings)));

  return dateStrings.map((date) => ({
    date,
    totalSeconds: rows
      .filter((r) => r.date === date)
      .reduce((sum, r) => sum + r.actualSeconds, 0),
  }));
}

export async function getTimeByChannel(userId: string, dateStrings: string[]) {
  const rows = await db
    .select({
      actualSeconds: task.actualSeconds,
      channelId: task.channelId,
      contextId: task.contextId,
    })
    .from(task)
    .where(and(eq(task.userId, userId), inArray(task.date, dateStrings)));

  const contexts = await getContextsWithChannels();
  const channelsWithContextColor = contexts.flatMap((ctx) =>
    ctx.channels.map((ch) => ({ ...ch, contextColor: ctx.color })),
  );

  const totals = new Map<string, { label: string; color: string; totalSeconds: number }>();

  function addTotal(key: string, label: string, color: string, seconds: number) {
    const existing = totals.get(key);
    if (existing) existing.totalSeconds += seconds;
    else totals.set(key, { label, color, totalSeconds: seconds });
  }

  for (const row of rows) {
    if (row.actualSeconds <= 0) continue;

    const channelInfo = row.channelId
      ? channelsWithContextColor.find((ch) => ch.id === row.channelId)
      : null;
    if (channelInfo) {
      addTotal(
        channelInfo.id,
        channelInfo.name,
        resolveChannelColor(channelInfo.color, channelInfo.contextColor),
        row.actualSeconds,
      );
      continue;
    }

    const contextInfo = row.contextId
      ? contexts.find((ctx) => ctx.id === row.contextId)
      : null;
    if (contextInfo) {
      addTotal(contextInfo.id, contextInfo.name, contextInfo.color, row.actualSeconds);
      continue;
    }

    addTotal("unknown", "unknown", "", row.actualSeconds);
  }

  return Array.from(totals.values());
}
