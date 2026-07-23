"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { channel, context, task } from "@/db/schema";
import { CARD_FLAG_PRIORITIES, PRIORITIES } from "@/components/priority-picker";
import { CATEGORY_COLOR_CLASSES, resolveChannelColor } from "@/lib/category-colors";
import {
  pauseTimer,
  scheduleTask,
  setTaskChannel,
  setTaskContext,
  setTaskPriority,
  startTimer,
  toggleTaskStatus,
  unscheduleTask,
} from "@/lib/actions/tasks";
import {
  createSubtask,
  getSubtasksForTask,
  toggleSubtaskStatus,
} from "@/lib/actions/subtasks";
import { minutesToTime, timeToMinutes } from "@/lib/time";
import { TaskDetailModal } from "@/components/task-detail-modal";
import { TaskCheckbox } from "@/components/task-checkbox";
import { useTranslation } from "@/lib/i18n/context";

type Task = typeof task.$inferSelect;
type Channel = typeof channel.$inferSelect;
type ContextWithChannels = typeof context.$inferSelect & { channels: Channel[] };
type Subtask = { id: string; taskId: string; title: string; done: boolean };

const START_HOUR = 6;
const END_HOUR = 22;
const SLOT_MINUTES = 30;
const SLOT_HEIGHT = 40; // px

function buildSlots() {
  const slots: string[] = [];
  for (let m = START_HOUR * 60; m < END_HOUR * 60; m += SLOT_MINUTES) {
    slots.push(minutesToTime(m));
  }
  return slots;
}

export function DayCalendar({
  tasks,
  contexts,
}: {
  tasks: Task[];
  contexts: ContextWithChannels[];
}) {
  const router = useRouter();
  const { t } = useTranslation();
  const [dragOverSlot, setDragOverSlot] = useState<string | null>(null);
  const [detailTaskId, setDetailTaskId] = useState<string | null>(null);
  const slots = buildSlots();
  const gridStartMinutes = START_HOUR * 60;
  const totalSlots = ((END_HOUR - START_HOUR) * 60) / SLOT_MINUTES;
  const detailTask = tasks.find((t) => t.id === detailTaskId) ?? null;

  // Sumber warna sama dengan yang dipakai TaskCard/ChannelPicker: warna
  // channel (kalau di-set), warisan dari warna context-nya kalau tidak.
  const allChannels = contexts.flatMap((ctx) =>
    ctx.channels.map((ch) => ({ id: ch.id, resolvedColor: resolveChannelColor(ch.color, ctx.color) })),
  );
  function getTaskColorKey(t: Task): string | null {
    if (t.channelId) {
      const ch = allChannels.find((c) => c.id === t.channelId);
      if (ch) return ch.resolvedColor;
    }
    if (t.contextId) {
      const ctx = contexts.find((c) => c.id === t.contextId);
      if (ctx) return ctx.color;
    }
    return null;
  }

  // Status timer untuk task yang lagi dibuka di popup detail. Di-reset dari
  // data task setiap kali popup dibuka (detailTaskId berubah), lalu berjalan
  // lokal supaya tombol Play/Pause selalu akurat seketika saat diklik.
  const [timerStartedAt, setTimerStartedAt] = useState<Date | null>(null);
  const [baseActualSeconds, setBaseActualSeconds] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const isTimerRunning = timerStartedAt !== null;

  useEffect(() => {
    if (!detailTask) return;
    // queueMicrotask: setState di sini menyinkronkan state lokal dengan task
    // yang baru dibuka di popup - didefer supaya bukan setState sinkron
    // langsung di body effect (aturan react-hooks/set-state-in-effect).
    queueMicrotask(() => {
      setTimerStartedAt(detailTask.timerStartedAt ? new Date(detailTask.timerStartedAt) : null);
      setBaseActualSeconds(detailTask.actualSeconds);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detailTaskId]);

  useEffect(() => {
    if (!isTimerRunning) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const liveActualSeconds = isTimerRunning
    ? baseActualSeconds + Math.floor((now - timerStartedAt.getTime()) / 1000)
    : baseActualSeconds;

  function handleToggleTimer() {
    if (!detailTaskId) return;
    if (isTimerRunning) {
      const elapsed = Math.floor((Date.now() - timerStartedAt.getTime()) / 1000);
      setBaseActualSeconds((s) => s + elapsed);
      setTimerStartedAt(null);
      pauseTimer(detailTaskId).then(() => router.refresh());
    } else {
      setTimerStartedAt(new Date());
      startTimer(detailTaskId).then(() => router.refresh());
    }
  }

  const [subtasks, setSubtasks] = useState<Subtask[]>([]);

  useEffect(() => {
    if (!detailTaskId) {
      queueMicrotask(() => setSubtasks([]));
      return;
    }
    getSubtasksForTask(detailTaskId).then(setSubtasks);
  }, [detailTaskId]);

  function handleAddSubtask(formData: FormData) {
    if (!detailTaskId) return;
    const title = (formData.get("title") as string)?.trim();
    if (!title) return;
    createSubtask(detailTaskId, formData).then(() =>
      getSubtasksForTask(detailTaskId).then(setSubtasks),
    );
  }

  function handleToggleSubtask(sub: Subtask) {
    setSubtasks((prev) =>
      prev.map((s) => (s.id === sub.id ? { ...s, done: !s.done } : s)),
    );
    toggleSubtaskStatus(sub.id, sub.done);
  }

  async function handleDrop(e: React.DragEvent<HTMLDivElement>, slotTime: string) {
    e.preventDefault();
    setDragOverSlot(null);
    const taskId = e.dataTransfer.getData("text/plain");
    if (!taskId) return;
    await scheduleTask(taskId, slotTime);
  }

  return (
    <div className="mt-6 overflow-hidden rounded-2xl border border-border/60 bg-background shadow-sm">
      <div className="relative" style={{ height: totalSlots * SLOT_HEIGHT }}>
        {slots.map((slotTime) => {
          const isHour = slotTime.endsWith(":00");
          return (
            <div
              key={slotTime}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverSlot(slotTime);
              }}
              onDragLeave={() =>
                setDragOverSlot((cur) => (cur === slotTime ? null : cur))
              }
              onDrop={(e) => handleDrop(e, slotTime)}
              className={`flex items-start gap-2 px-3 text-xs text-muted-foreground/70 transition-colors ${
                isHour ? "border-t border-border/50" : ""
              } ${dragOverSlot === slotTime ? "bg-primary/10" : ""}`}
              style={{ height: SLOT_HEIGHT }}
            >
              {isHour && <span className="w-12 pt-1">{slotTime}</span>}
            </div>
          );
        })}

        {tasks.map((scheduledTask) => {
          if (!scheduledTask.startTime) return null;
          const startMinutes = timeToMinutes(scheduledTask.startTime);
          const durationMinutes = scheduledTask.endTime
            ? timeToMinutes(scheduledTask.endTime) - startMinutes
            : (scheduledTask.estimatedMinutes ?? SLOT_MINUTES);
          const top = ((startMinutes - gridStartMinutes) / SLOT_MINUTES) * SLOT_HEIGHT;
          const height = Math.max(
            (durationMinutes / SLOT_MINUTES) * SLOT_HEIGHT,
            SLOT_HEIGHT / 2,
          );
          const isDone = scheduledTask.status === "done";
          const priorityFlag = CARD_FLAG_PRIORITIES.includes(scheduledTask.priority)
            ? PRIORITIES.find((p) => p.value === scheduledTask.priority)
            : null;
          const colorKey = getTaskColorKey(scheduledTask);
          const colorSwatch = colorKey ? CATEGORY_COLOR_CLASSES[colorKey]?.swatch : null;

          return (
            <div
              key={scheduledTask.id}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData("text/plain", scheduledTask.id);
                e.dataTransfer.effectAllowed = "move";
              }}
              className={`absolute left-14 right-2 flex cursor-grab flex-col justify-between overflow-hidden rounded-lg px-2 py-1 text-xs shadow-sm active:cursor-grabbing ${
                isDone
                  ? "bg-muted text-muted-foreground"
                  : colorSwatch
                    ? `${colorSwatch} text-white`
                    : "bg-primary text-primary-foreground"
              }`}
              style={{ top, height }}
            >
              <span className="opacity-80">
                {scheduledTask.startTime}
                {scheduledTask.endTime ? ` - ${scheduledTask.endTime}` : ""}
              </span>
              <div className="flex items-start justify-between gap-1">
                <div className="flex items-start gap-1.5">
                  <TaskCheckbox
                    checked={isDone}
                    onToggle={() => toggleTaskStatus(scheduledTask.id, scheduledTask.status)}
                    size="sm"
                    className="mt-0.5"
                  />
                  <button
                    type="button"
                    onClick={() => setDetailTaskId(scheduledTask.id)}
                    className={`text-left font-medium leading-tight hover:underline ${
                      isDone ? "line-through" : ""
                    }`}
                  >
                    {scheduledTask.title}
                  </button>
                </div>
                <form action={unscheduleTask.bind(null, scheduledTask.id)}>
                  <button
                    type="submit"
                    title={t("Unschedule")}
                    className="shrink-0 rounded-full bg-black/10 px-1.5 text-[10px] leading-4 hover:bg-black/20"
                  >
                    ✕
                  </button>
                </form>
              </div>
              {priorityFlag && (
                <span
                  className={`self-start rounded-full px-1.5 py-0 text-[10px] font-medium leading-4 ${priorityFlag.badgeClass}`}
                >
                  {t(priorityFlag.label)}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {detailTask && (
        <TaskDetailModal
          task={detailTask}
          isTimerRunning={isTimerRunning}
          actualSeconds={liveActualSeconds}
          onToggleTimer={handleToggleTimer}
          subtasks={subtasks}
          onAddSubtask={handleAddSubtask}
          onToggleSubtask={handleToggleSubtask}
          contexts={contexts}
          onSelectChannel={(channelId) =>
            setTaskChannel(detailTask.id, channelId).then(() => router.refresh())
          }
          onSelectContext={(contextId) =>
            setTaskContext(detailTask.id, contextId).then(() => router.refresh())
          }
          onSelectPriority={(priority) =>
            setTaskPriority(detailTask.id, priority).then(() => router.refresh())
          }
          onClose={() => setDetailTaskId(null)}
        />
      )}
    </div>
  );
}
