"use client";

import { useRef } from "react";
import { toggleTaskStatus, updateTask } from "@/lib/actions/tasks";
import { parseDateString } from "@/lib/date";
import { formatDurationMinutes, formatDurationSeconds } from "@/lib/time";
import { TaskCheckbox } from "@/components/task-checkbox";
import { ChannelPicker } from "@/components/channel-picker";
import { PriorityPicker } from "@/components/priority-picker";
import { useTranslation } from "@/lib/i18n/context";
import { toIntlLocale } from "@/lib/i18n/dates";
import type { Locale } from "@/lib/i18n/dictionary";
import { translate } from "@/lib/i18n/dictionary";
import type { channel, context, task } from "@/db/schema";

type Task = typeof task.$inferSelect;
type Channel = typeof channel.$inferSelect;
type ContextWithChannels = typeof context.$inferSelect & { channels: Channel[] };
type Subtask = { id: string; taskId: string; title: string; done: boolean };

function formatRelativeTime(date: Date, locale: Locale) {
  const diffMin = Math.floor((Date.now() - date.getTime()) / 60000);
  if (diffMin < 1) return translate("just now", locale);
  if (diffMin < 60) return translate("{n}m ago", locale, { n: diffMin });
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return translate("{n}h ago", locale, { n: diffHour });
  return translate("{n}d ago", locale, { n: Math.floor(diffHour / 24) });
}

export function TaskDetailModal({
  task,
  isTimerRunning,
  actualSeconds,
  onToggleTimer,
  subtasks,
  onAddSubtask,
  onToggleSubtask,
  contexts,
  onSelectChannel,
  onSelectContext,
  onSelectPriority,
  onClose,
}: {
  task: Task;
  isTimerRunning: boolean;
  actualSeconds: number;
  onToggleTimer: () => void;
  subtasks: Subtask[];
  onAddSubtask: (formData: FormData) => void;
  onToggleSubtask: (sub: Subtask) => void;
  contexts: ContextWithChannels[];
  onSelectChannel: (channelId: string | null) => void;
  onSelectContext: (contextId: string) => void;
  onSelectPriority: (priority: string) => void;
  onClose: () => void;
}) {
  const { t, locale } = useTranslation();
  const isDone = task.status === "done";
  const startLabel = parseDateString(task.date).toLocaleDateString(toIntlLocale(locale), {
    month: "short",
    day: "numeric",
  });

  function saveField(field: "title" | "description", value: string) {
    const formData = new FormData();
    formData.set("title", field === "title" ? value : task.title);
    if (field === "description") formData.set("description", value);
    if (formData.get("title")) updateTask(task.id, formData);
  }

  const newSubtaskInputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[700px] rounded-2xl bg-background p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header row */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t("Channel")}
            </p>
            <div className="mt-1">
              <ChannelPicker
                contexts={contexts}
                channelId={task.channelId}
                contextId={task.contextId}
                fallbackLabel={task.channel}
                onSelectChannel={onSelectChannel}
                onSelectContext={onSelectContext}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <PriorityPicker value={task.priority} onChange={onSelectPriority} showLabel />

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t("Start")}
              </p>
              <p className="mt-0.5 flex items-center gap-1 text-sm">
                <span>📅</span>
                {startLabel}
              </p>
            </div>

            <button
              type="button"
              disabled
              title={t("Due date — coming soon")}
              className="flex items-center gap-1 rounded-full border border-border/60 px-3 py-1.5 text-sm text-muted-foreground/70"
            >
              📅 {t("Due")}
            </button>

            <button
              type="button"
              onClick={() => newSubtaskInputRef.current?.focus()}
              className="rounded-full border border-border/60 px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {t("+ Subtasks")}
            </button>

            <button
              type="button"
              disabled
              title={t("More menu — coming soon")}
              className="text-muted-foreground/70"
            >
              ⋯
            </button>

            <button
              type="button"
              disabled
              title={t("Expand — coming soon")}
              className="text-muted-foreground/70"
            >
              ⛶
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label={t("Close")}
              className="rounded-full p-1 text-muted-foreground hover:bg-muted"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Judul + Timer */}
        <div className="mt-5 flex items-center gap-3 border-t border-border/50 pt-5">
          <TaskCheckbox
            checked={isDone}
            onToggle={() => toggleTaskStatus(task.id, task.status)}
            size="lg"
          />

          <input
            key={task.title}
            defaultValue={task.title}
            onBlur={(e) => saveField("title", e.target.value.trim())}
            className={`flex-1 bg-transparent text-xl font-semibold outline-none ${
              isDone ? "text-muted-foreground line-through" : ""
            }`}
          />

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={onToggleTimer}
              title={isTimerRunning ? t("Pause timer") : t("Start timer")}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-border/60 text-foreground transition-colors hover:bg-muted"
            >
              {isTimerRunning ? "⏸" : "▶"}
            </button>
            <div className="text-right">
              <p className="text-[10px] font-semibold uppercase text-muted-foreground">
                {t("Actual")}
              </p>
              <p className="text-sm font-medium">{formatDurationSeconds(actualSeconds)}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-semibold uppercase text-muted-foreground">
                {t("Planned")}
              </p>
              <p className="text-sm font-medium">
                {formatDurationMinutes(task.estimatedMinutes ?? 0)}
              </p>
            </div>
          </div>
        </div>

        {/* Subtasks */}
        <div className="mt-4 flex flex-col gap-2">
          {subtasks.map((sub) => (
            <div key={sub.id} className="flex items-center gap-2.5">
              <TaskCheckbox
                checked={sub.done}
                onToggle={() => onToggleSubtask(sub)}
                size="sm"
              />
              <span
                className={`text-sm ${
                  sub.done ? "text-muted-foreground line-through" : ""
                }`}
              >
                {sub.title}
              </span>
            </div>
          ))}

          <form
            action={(formData) => {
              onAddSubtask(formData);
              newSubtaskInputRef.current!.value = "";
            }}
            className="flex items-center gap-2.5"
          >
            <span className="h-4 w-4 shrink-0" />
            <input
              ref={newSubtaskInputRef}
              name="title"
              placeholder={t("+ Add subtask")}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </form>
        </div>

        {/* Notes */}
        <textarea
          key={task.description}
          defaultValue={task.description ?? ""}
          onBlur={(e) => saveField("description", e.target.value.trim())}
          placeholder={t("Notes...")}
          rows={4}
          className="mt-4 w-full resize-none rounded-lg border border-border/60 bg-transparent px-3 py-2 text-sm outline-none focus:border-primary"
        />

        {/* Comment section (tampilan saja, belum fungsional) */}
        <div className="mt-5 border-t border-border/50 pt-4">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm">
              🙂
            </span>
            <input
              disabled
              placeholder={t("Comment...")}
              className="flex-1 rounded-full border border-border/60 bg-transparent px-3 py-2 text-sm text-muted-foreground/70 outline-none"
            />
            <button
              type="button"
              disabled
              title={t("Attach file — coming soon")}
              className="text-muted-foreground/70"
            >
              📎
            </button>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            {t("You created this task · {time}", {
              time: formatRelativeTime(new Date(task.createdAt), locale),
            })}
          </p>
        </div>
      </div>
    </div>
  );
}
