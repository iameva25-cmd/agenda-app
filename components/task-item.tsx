"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  deleteTask,
  pauseTimer,
  setTaskChannel,
  setTaskContext,
  setTaskPriority,
  startTimer,
  toggleTaskStatus,
} from "@/lib/actions/tasks";
import {
  createSubtask,
  getSubtasksForTask,
  toggleSubtaskStatus,
} from "@/lib/actions/subtasks";
import { formatDurationMinutes, formatTime12h } from "@/lib/time";
import { TaskDetailModal } from "@/components/task-detail-modal";
import { TaskCheckbox } from "@/components/task-checkbox";
import { ChannelPicker } from "@/components/channel-picker";
import { PRIORITIES } from "@/components/priority-picker";
import { useTranslation } from "@/lib/i18n/context";
import type { channel, context, task } from "@/db/schema";

type Task = typeof task.$inferSelect;
type Channel = typeof channel.$inferSelect;
type ContextWithChannels = typeof context.$inferSelect & { channels: Channel[] };
type Subtask = { id: string; taskId: string; title: string; done: boolean };

export function TaskItem({
  task,
  contexts,
}: {
  task: Task;
  contexts: ContextWithChannels[];
}) {
  const router = useRouter();
  const { t } = useTranslation();
  const [showDetail, setShowDetail] = useState(false);
  const isDone = task.status === "done";

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: "task", dateStr: task.date },
  });

  // Status timer dipegang di sini (bukan di dalam popup) supaya tidak hilang
  // saat popup ditutup lalu dibuka lagi, dan supaya badge di card ini juga
  // bisa ikut update live selama timer jalan.
  const [timerStartedAt, setTimerStartedAt] = useState<Date | null>(
    task.timerStartedAt ? new Date(task.timerStartedAt) : null,
  );
  const [baseActualSeconds, setBaseActualSeconds] = useState(task.actualSeconds);
  const [now, setNow] = useState(() => Date.now());
  const isTimerRunning = timerStartedAt !== null;

  useEffect(() => {
    if (!isTimerRunning) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const liveActualSeconds = isTimerRunning
    ? baseActualSeconds + Math.floor((now - timerStartedAt.getTime()) / 1000)
    : baseActualSeconds;

  function handleToggleTimer() {
    if (isTimerRunning) {
      const elapsed = Math.floor((Date.now() - timerStartedAt.getTime()) / 1000);
      setBaseActualSeconds((s) => s + elapsed);
      setTimerStartedAt(null);
      pauseTimer(task.id).then(() => router.refresh());
    } else {
      setTimerStartedAt(new Date());
      startTimer(task.id).then(() => router.refresh());
    }
  }

  const showDurationBadge = task.estimatedMinutes != null || liveActualSeconds > 0;
  const priorityBadge =
    task.priority !== "normal" ? PRIORITIES.find((p) => p.value === task.priority) : null;

  // Subtask list dipegang di sini juga (bukan di dalam popup) supaya jumlahnya
  // bisa ditampilkan di card, dan supaya card + popup berbagi data yang sama.
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [subtasksExpanded, setSubtasksExpanded] = useState(false);

  useEffect(() => {
    getSubtasksForTask(task.id).then(setSubtasks);
  }, [task.id]);

  function handleAddSubtask(formData: FormData) {
    const title = (formData.get("title") as string)?.trim();
    if (!title) return;
    createSubtask(task.id, formData).then(() =>
      getSubtasksForTask(task.id).then(setSubtasks),
    );
  }

  function handleToggleSubtask(sub: Subtask) {
    setSubtasks((prev) =>
      prev.map((s) => (s.id === sub.id ? { ...s, done: !s.done } : s)),
    );
    toggleSubtaskStatus(sub.id, sub.done);
  }

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => setShowDetail(true)}
      className="group flex select-none cursor-pointer flex-col gap-2 rounded-2xl border border-border/60 bg-background p-4 shadow-sm transition-shadow hover:shadow-md active:cursor-grabbing"
    >
      {/* Baris 1: jam mulai (kalau ada) + judul (kiri) + badge actual/planned (kanan atas) */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          {task.startTime && (
            <span className="text-xs text-muted-foreground">
              {formatTime12h(task.startTime)}
            </span>
          )}
          <span
            className={
              isDone
                ? "font-medium text-muted-foreground line-through"
                : "font-medium"
            }
          >
            {task.title}
          </span>
        </div>

        {showDurationBadge && (
          <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
            → {formatDurationMinutes(Math.floor(liveActualSeconds / 60))} /{" "}
            {formatDurationMinutes(task.estimatedMinutes ?? 0)}
          </span>
        )}
      </div>

      {subtasks.length > 0 && (
        <div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setSubtasksExpanded((v) => !v);
            }}
            onPointerDown={(e) => e.stopPropagation()}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <span className={`transition-transform ${subtasksExpanded ? "rotate-90" : ""}`}>
              ▸
            </span>
            {t("{count} subtasks", { count: subtasks.length })}
          </button>

          {subtasksExpanded && (
            <div
              className="mt-2 flex flex-col gap-1.5"
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
            >
              {subtasks.map((sub) => (
                <div key={sub.id} className="flex items-center gap-2.5">
                  <TaskCheckbox
                    checked={sub.done}
                    onToggle={() => handleToggleSubtask(sub)}
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
            </div>
          )}
        </div>
      )}

      {/* Baris 2: checkbox (kiri) — channel rata kanan, sekarang bisa diklik */}
      <div className="flex items-center justify-between gap-3">
        <div
          className="flex items-center gap-2.5"
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <TaskCheckbox
            checked={isDone}
            onToggle={() => toggleTaskStatus(task.id, task.status)}
          />
          {priorityBadge && (
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${priorityBadge.badgeClass}`}
            >
              {t(priorityBadge.label)}
            </span>
          )}
        </div>

        <div onClick={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()}>
          <ChannelPicker
            contexts={contexts}
            channelId={task.channelId}
            contextId={task.contextId}
            fallbackLabel={task.channel}
            onSelectChannel={(channelId) =>
              setTaskChannel(task.id, channelId).then(() => router.refresh())
            }
            onSelectContext={(contextId) =>
              setTaskContext(task.id, contextId).then(() => router.refresh())
            }
          />
        </div>
      </div>

      {/* Baris 3: Edit/Hapus, paling bawah card, baru muncul saat hover */}
      <div
        className="flex max-h-0 items-center justify-end gap-3 overflow-hidden opacity-0 transition-all duration-150 group-hover:max-h-6 group-hover:opacity-100 group-focus-within:max-h-6 group-focus-within:opacity-100"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setShowDetail(true);
          }}
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          {t("Edit")}
        </button>
        <form onClick={(e) => e.stopPropagation()} action={deleteTask.bind(null, task.id)}>
          <button
            type="submit"
            className="text-sm text-red-600 hover:underline dark:text-red-400"
          >
            {t("Delete")}
          </button>
        </form>
      </div>

      {showDetail && (
        <TaskDetailModal
          task={task}
          isTimerRunning={isTimerRunning}
          actualSeconds={liveActualSeconds}
          onToggleTimer={handleToggleTimer}
          subtasks={subtasks}
          onAddSubtask={handleAddSubtask}
          onToggleSubtask={handleToggleSubtask}
          contexts={contexts}
          onSelectChannel={(channelId) =>
            setTaskChannel(task.id, channelId).then(() => router.refresh())
          }
          onSelectContext={(contextId) =>
            setTaskContext(task.id, contextId).then(() => router.refresh())
          }
          onSelectPriority={(priority) =>
            setTaskPriority(task.id, priority).then(() => router.refresh())
          }
          onClose={() => setShowDetail(false)}
        />
      )}
    </li>
  );
}
