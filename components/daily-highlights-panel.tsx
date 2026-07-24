"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { toggleTaskHighlight } from "@/lib/actions/tasks";
import { formatDurationMinutes } from "@/lib/time";
import { useTranslation } from "@/lib/i18n/context";
import type { task } from "@/db/schema";

type Task = typeof task.$inferSelect;

const MAX_HIGHLIGHTS = 3;

export function DailyHighlightsPanel({
  todayLabel,
  tasks,
}: {
  todayLabel: string;
  tasks: Task[];
}) {
  const router = useRouter();
  const { t } = useTranslation();
  const [started, setStarted] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const highlightedTasks = tasks.filter((task) => task.isHighlight);
  const otherTasks = tasks.filter((task) => !task.isHighlight);
  const limitReached = highlightedTasks.length >= MAX_HIGHLIGHTS;

  function handleToggle(task: Task) {
    setPendingId(task.id);
    toggleTaskHighlight(task.id, task.isHighlight).then(() => {
      router.refresh();
      setPendingId(null);
    });
  }

  if (!started) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-24 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Star className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-semibold">{t("Daily Highlights")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("Pick 1-3 tasks that matter most for you to get done today.")}
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
      <h1 className="text-2xl font-semibold">{t("Daily Highlights")}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{todayLabel}</p>

      <div className="mt-8 rounded-2xl border border-border/60 bg-background p-6 shadow-sm">
        <p className="text-sm font-medium text-muted-foreground">
          {t("Today's highlights ({count}/{max})", {
            count: highlightedTasks.length,
            max: MAX_HIGHLIGHTS,
          })}
        </p>

        {highlightedTasks.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            {t("No highlights picked yet. Click the star icon on a task below.")}
          </p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {highlightedTasks.map((task) => (
              <li
                key={task.id}
                className="flex items-center gap-2 rounded-xl bg-primary/5 px-3 py-2"
              >
                <Star className="h-4 w-4 shrink-0 fill-primary text-primary" />
                <span
                  className={
                    task.status === "done"
                      ? "font-medium text-muted-foreground line-through"
                      : "font-medium"
                  }
                >
                  {task.title}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-10">
        <h2 className="text-sm font-medium text-muted-foreground">
          {t("All tasks today ({count})", { count: tasks.length })}
        </h2>

        {tasks.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            {t("No tasks for today yet.")}
          </p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {[...highlightedTasks, ...otherTasks].map((task) => {
              const disabled = !task.isHighlight && limitReached;
              return (
                <li
                  key={task.id}
                  className="flex items-center gap-3 rounded-xl border border-border/60 bg-background px-3 py-2.5 shadow-sm"
                >
                  <button
                    type="button"
                    onClick={() => handleToggle(task)}
                    disabled={pendingId === task.id || disabled}
                    title={
                      disabled
                        ? t("Maximum {max} highlights per day", { max: MAX_HIGHLIGHTS })
                        : task.isHighlight
                          ? t("Remove from highlights")
                          : t("Mark as highlight")
                    }
                    className="shrink-0 text-muted-foreground/50 transition-colors hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Star
                      className={
                        task.isHighlight ? "h-5 w-5 fill-primary text-primary" : "h-5 w-5"
                      }
                    />
                  </button>
                  <span
                    className={
                      task.status === "done"
                        ? "flex-1 text-muted-foreground line-through"
                        : "flex-1"
                    }
                  >
                    {task.title}
                  </span>
                  {task.estimatedMinutes != null && (
                    <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                      {formatDurationMinutes(task.estimatedMinutes)}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
