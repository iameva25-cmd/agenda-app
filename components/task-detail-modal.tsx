"use client";

import { useRef } from "react";
import { toggleTaskStatus, updateTask } from "@/lib/actions/tasks";
import { parseDateString } from "@/lib/date";
import { formatDurationMinutes, formatDurationSeconds } from "@/lib/time";
import { TaskCheckbox } from "@/components/task-checkbox";
import { ChannelPicker } from "@/components/channel-picker";
import { PriorityPicker } from "@/components/priority-picker";
import type { channel, context, task } from "@/db/schema";

type Task = typeof task.$inferSelect;
type Channel = typeof channel.$inferSelect;
type ContextWithChannels = typeof context.$inferSelect & { channels: Channel[] };
type Subtask = { id: string; taskId: string; title: string; done: boolean };

function formatRelativeTime(date: Date) {
  const diffMin = Math.floor((Date.now() - date.getTime()) / 60000);
  if (diffMin < 1) return "baru saja";
  if (diffMin < 60) return `${diffMin}m lalu`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}j lalu`;
  return `${Math.floor(diffHour / 24)}h lalu`;
}

export function TaskDetailModal({
  task: t,
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
  const isDone = t.status === "done";
  const startLabel = parseDateString(t.date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  function saveField(field: "title" | "description", value: string) {
    const formData = new FormData();
    formData.set("title", field === "title" ? value : t.title);
    if (field === "description") formData.set("description", value);
    if (formData.get("title")) updateTask(t.id, formData);
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
              Channel
            </p>
            <div className="mt-1">
              <ChannelPicker
                contexts={contexts}
                channelId={t.channelId}
                contextId={t.contextId}
                fallbackLabel={t.channel}
                onSelectChannel={onSelectChannel}
                onSelectContext={onSelectContext}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <PriorityPicker value={t.priority} onChange={onSelectPriority} showLabel />

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Start
              </p>
              <p className="mt-0.5 flex items-center gap-1 text-sm">
                <span>📅</span>
                {startLabel}
              </p>
            </div>

            <button
              type="button"
              disabled
              title="Due date — segera hadir"
              className="flex items-center gap-1 rounded-full border border-border/60 px-3 py-1.5 text-sm text-muted-foreground/70"
            >
              📅 Due
            </button>

            <button
              type="button"
              onClick={() => newSubtaskInputRef.current?.focus()}
              className="rounded-full border border-border/60 px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              + Subtasks
            </button>

            <button
              type="button"
              disabled
              title="Menu lainnya — segera hadir"
              className="text-muted-foreground/70"
            >
              ⋯
            </button>

            <button
              type="button"
              disabled
              title="Perbesar — segera hadir"
              className="text-muted-foreground/70"
            >
              ⛶
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup"
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
            onToggle={() => toggleTaskStatus(t.id, t.status)}
            size="lg"
          />

          <input
            key={t.title}
            defaultValue={t.title}
            onBlur={(e) => saveField("title", e.target.value.trim())}
            className={`flex-1 bg-transparent text-xl font-semibold outline-none ${
              isDone ? "text-muted-foreground line-through" : ""
            }`}
          />

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={onToggleTimer}
              title={isTimerRunning ? "Jeda timer" : "Mulai timer"}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-border/60 text-foreground transition-colors hover:bg-muted"
            >
              {isTimerRunning ? "⏸" : "▶"}
            </button>
            <div className="text-right">
              <p className="text-[10px] font-semibold uppercase text-muted-foreground">
                Actual
              </p>
              <p className="text-sm font-medium">{formatDurationSeconds(actualSeconds)}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-semibold uppercase text-muted-foreground">
                Planned
              </p>
              <p className="text-sm font-medium">
                {formatDurationMinutes(t.estimatedMinutes ?? 0)}
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
              placeholder="+ Tambah subtask"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </form>
        </div>

        {/* Notes */}
        <textarea
          key={t.description}
          defaultValue={t.description ?? ""}
          onBlur={(e) => saveField("description", e.target.value.trim())}
          placeholder="Notes..."
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
              placeholder="Comment..."
              className="flex-1 rounded-full border border-border/60 bg-transparent px-3 py-2 text-sm text-muted-foreground/70 outline-none"
            />
            <button
              type="button"
              disabled
              title="Lampirkan file — segera hadir"
              className="text-muted-foreground/70"
            >
              📎
            </button>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Kamu membuat task ini · {formatRelativeTime(new Date(t.createdAt))}
          </p>
        </div>
      </div>
    </div>
  );
}
