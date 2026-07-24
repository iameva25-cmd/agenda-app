"use client";

import { useState } from "react";
import { Moon } from "lucide-react";
import { TaskItem } from "@/components/task-item";
import { formatDurationSeconds } from "@/lib/time";
import { useTranslation } from "@/lib/i18n/context";
import type { channel, context, task } from "@/db/schema";

type Task = typeof task.$inferSelect;
type Channel = typeof channel.$inferSelect;
type ContextWithChannels = typeof context.$inferSelect & { channels: Channel[] };

export function DailyShutdownPanel({
  todayLabel,
  doneTasks,
  todoTasks,
  totalActualSeconds,
  contexts,
}: {
  todayLabel: string;
  doneTasks: Task[];
  todoTasks: Task[];
  totalActualSeconds: number;
  contexts: ContextWithChannels[];
}) {
  const { t } = useTranslation();
  const [started, setStarted] = useState(false);

  const totalCount = doneTasks.length + todoTasks.length;
  const percentage =
    totalCount === 0 ? 0 : Math.round((doneTasks.length / totalCount) * 100);

  if (!started) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-24 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Moon className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-semibold">{t("Daily Shutdown")}</h1>
        <p className="text-sm text-muted-foreground">
          {t(
            "Wrap up your day with a summary of tasks done and not done today, along with the progress percentage.",
          )}
        </p>
        <button
          type="button"
          onClick={() => setStarted(true)}
          className="mt-2 flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          {t("Start")} <span aria-hidden>→</span>
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold">{t("Daily Shutdown")}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{todayLabel}</p>

      <div className="mt-8 rounded-2xl border border-border/60 bg-background p-6 shadow-sm">
        <div className="flex items-baseline justify-between">
          <p className="text-sm font-medium text-muted-foreground">
            {totalCount === 0
              ? t("No tasks today")
              : t("{done} of {total} tasks done", { done: doneTasks.length, total: totalCount })}
          </p>
          <p className="text-2xl font-semibold text-primary">{percentage}%</p>
        </div>
        <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${percentage}%` }}
          />
        </div>
        {totalActualSeconds > 0 && (
          <p className="mt-3 text-xs text-muted-foreground">
            {t("Total time tracked today: {time}", {
              time: formatDurationSeconds(totalActualSeconds),
            })}
          </p>
        )}
      </div>

      <div className="mt-10">
        <h2 className="text-sm font-medium text-muted-foreground">
          {t("Done ({count})", { count: doneTasks.length })}
        </h2>
        {doneTasks.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            {t("No tasks done today yet.")}
          </p>
        ) : (
          <ul className="mt-3 flex flex-col gap-3">
            {doneTasks.map((task) => (
              <TaskItem key={task.id} task={task} contexts={contexts} />
            ))}
          </ul>
        )}
      </div>

      <div className="mt-10">
        <h2 className="text-sm font-medium text-muted-foreground">
          {t("Not done ({count})", { count: todoTasks.length })}
        </h2>
        {todoTasks.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            {t("All tasks today are done.")}
          </p>
        ) : (
          <ul className="mt-3 flex flex-col gap-3">
            {todoTasks.map((task) => (
              <TaskItem key={task.id} task={task} contexts={contexts} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
