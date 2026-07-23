"use client";

import { useState } from "react";
import { Moon } from "lucide-react";
import { TaskItem } from "@/components/task-item";
import { formatDurationSeconds } from "@/lib/time";
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
        <h1 className="text-2xl font-bold">Daily Shutdown</h1>
        <p className="text-sm text-muted-foreground">
          Tutup harimu dengan lihat ringkasan task yang sudah selesai dan
          belum hari ini, lengkap dengan progress percentage-nya.
        </p>
        <button
          type="button"
          onClick={() => setStarted(true)}
          className="mt-2 flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          Mulai <span aria-hidden>→</span>
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold">Daily Shutdown</h1>
      <p className="mt-1 text-sm text-muted-foreground">{todayLabel}</p>

      <div className="mt-8 rounded-2xl border border-border/60 bg-background p-6 shadow-sm">
        <div className="flex items-baseline justify-between">
          <p className="text-sm font-medium text-muted-foreground">
            {totalCount === 0
              ? "Belum ada task hari ini"
              : `${doneTasks.length} dari ${totalCount} task selesai`}
          </p>
          <p className="text-2xl font-bold text-primary">{percentage}%</p>
        </div>
        <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${percentage}%` }}
          />
        </div>
        {totalActualSeconds > 0 && (
          <p className="mt-3 text-xs text-muted-foreground">
            Total waktu yang di-track hari ini:{" "}
            {formatDurationSeconds(totalActualSeconds)}
          </p>
        )}
      </div>

      <div className="mt-10">
        <h2 className="text-sm font-semibold text-muted-foreground">
          Selesai ({doneTasks.length})
        </h2>
        {doneTasks.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Belum ada task yang selesai hari ini.
          </p>
        ) : (
          <ul className="mt-3 flex flex-col gap-3">
            {doneTasks.map((t) => (
              <TaskItem key={t.id} task={t} contexts={contexts} />
            ))}
          </ul>
        )}
      </div>

      <div className="mt-10">
        <h2 className="text-sm font-semibold text-muted-foreground">
          Belum selesai ({todoTasks.length})
        </h2>
        {todoTasks.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Semua task hari ini sudah selesai.
          </p>
        ) : (
          <ul className="mt-3 flex flex-col gap-3">
            {todoTasks.map((t) => (
              <TaskItem key={t.id} task={t} contexts={contexts} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
