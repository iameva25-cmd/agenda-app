import type { channel, context, task } from "@/db/schema";
import { AddTaskPopup } from "@/components/add-task-popup";
import { TaskList } from "@/components/task-list";
import { parseDateString } from "@/lib/date";
import { sortTasksForDay } from "@/lib/task-sort";
import { getLocale } from "@/lib/i18n/server";
import { toIntlLocale } from "@/lib/i18n/dates";

type Task = typeof task.$inferSelect;
type Channel = typeof channel.$inferSelect;
type ContextWithChannels = typeof context.$inferSelect & { channels: Channel[] };

export async function DayColumn({
  dateStr,
  tasks,
  contexts,
  isToday,
}: {
  dateStr: string;
  tasks: Task[];
  contexts: ContextWithChannels[];
  isToday: boolean;
}) {
  const locale = await getLocale();
  const intlLocale = toIntlLocale(locale);
  const dateObj = parseDateString(dateStr);
  const dayName = dateObj.toLocaleDateString(intlLocale, { weekday: "long" });
  const dateLabel = dateObj.toLocaleDateString(intlLocale, {
    month: "long",
    day: "numeric",
  });

  const sorted = sortTasksForDay(tasks);

  return (
    <div
      className={`w-[300px] shrink-0 rounded-2xl border p-4 ${
        isToday ? "border-primary/40 bg-primary/5" : "border-border/60 bg-transparent"
      }`}
    >
      <p className="text-xl font-bold">{dayName}</p>
      <p className="text-sm text-muted-foreground">{dateLabel}</p>

      <AddTaskPopup dateStr={dateStr} contexts={contexts} />

      <div className="mt-2">
        <TaskList dateStr={dateStr} tasks={sorted} contexts={contexts} />
      </div>
    </div>
  );
}
