"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  pointerWithin,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { moveTaskToDay, reorderDayTasks, scheduleTask } from "@/lib/actions/tasks";
import { sortTasksForDay } from "@/lib/task-sort";
import { minutesToTime, timeToMinutes } from "@/lib/time";
import type { task } from "@/db/schema";

type Task = typeof task.$inferSelect;

type OverData =
  | { type: "task"; dateStr: string }
  | { type: "day"; dateStr: string }
  | { type: "slot"; slotTime: string }
  | undefined;

type ActiveData = { type: "task"; dateStr: string } | { type: "scheduled-block" } | undefined;

const DEFAULT_GAP_MINUTES = 30;

// Task yang di-drag posisinya sekarang ada di antara `prev`/`next` (hasil
// reorder). Kalau salah satu tetangganya punya jam, task ini ikut dapat jam
// baru (diselipkan di antaranya, atau digeser sebelum/sesudahnya) — kalau
// dua-duanya tidak punya jam, task jadi/tetap belum terjadwal.
function computeTimeForPosition(
  dragged: Task,
  prev: Task | undefined,
  next: Task | undefined,
): { startTime: string | null; endTime: string | null } {
  const durationMinutes = dragged.estimatedMinutes ?? DEFAULT_GAP_MINUTES;

  let startMinutes: number | null = null;
  if (prev?.startTime && next?.startTime) {
    const prevMin = timeToMinutes(prev.startTime);
    const nextMin = timeToMinutes(next.startTime);
    startMinutes = Math.min(Math.max(Math.round((prevMin + nextMin) / 2), prevMin + 1), nextMin - 1);
  } else if (prev?.startTime) {
    startMinutes = timeToMinutes(prev.startTime) + (prev.estimatedMinutes ?? DEFAULT_GAP_MINUTES);
  } else if (next?.startTime) {
    startMinutes = timeToMinutes(next.startTime) - durationMinutes;
  }

  if (startMinutes === null) return { startTime: null, endTime: null };
  const startTime = minutesToTime(startMinutes);
  return { startTime, endTime: minutesToTime(startMinutes + durationMinutes) };
}

// Provider bersama untuk drag & drop TaskCard: reorder dalam satu hari
// (ikut update jam kalau posisinya sekarang di antara task yang sudah
// terjadwal), pindah antar hari (tanggal berubah, jam tetap sama), dan drag
// ke kalender kanan untuk menjadwalkan (migrasi dari native HTML5 drag lama).
// `tasks` harus berisi SEMUA task yang mungkin jadi sumber/target drag di
// halaman ini (termasuk yang sudah terjadwal), dipakai untuk preview drag
// dan untuk menghitung ulang urutan satu hari.
export function TaskDndProvider({
  tasks,
  children,
}: {
  tasks: Task[];
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [activeId, setActiveId] = useState<string | null>(null);

  // distance: 6 — drag baru aktif kalau pointer bergerak >6px, jadi klik
  // biasa (checkbox, buka detail, dst) tetap terdeteksi sebagai klik, bukan
  // drag, tanpa perlu logic pemisah manual.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const activeTask = activeId ? (tasks.find((t) => t.id === activeId) ?? null) : null;

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    if (!over || active.id === over.id) return;

    const overData = over.data.current as OverData;
    const activeTaskId = String(active.id);

    // Drop di slot kalender kanan -> jadwalkan (sama untuk card dari list
    // maupun block yang sudah terjadwal digeser ke jam lain).
    if (overData?.type === "slot") {
      await scheduleTask(activeTaskId, overData.slotTime);
      router.refresh();
      return;
    }

    const activeData = active.data.current as ActiveData;
    if (!activeData || activeData.type !== "task") return;

    const targetDateStr =
      overData?.type === "day" || overData?.type === "task" ? overData.dateStr : null;
    if (!targetDateStr) return;

    const draggedTask = tasks.find((t) => t.id === activeTaskId);
    if (!draggedTask) return;

    const overTaskId = overData?.type === "task" ? String(over.id) : null;

    if (targetDateStr !== activeData.dateStr) {
      // Pindah ke hari lain — tanggal berubah, jam TIDAK disentuh (tetap di
      // jam yang sama, cuma pindah tanggal).
      const sourceDayTasks = sortTasksForDay(
        tasks.filter((t) => t.date === activeData.dateStr && t.id !== activeTaskId),
      );
      const destDayTasksBefore = sortTasksForDay(tasks.filter((t) => t.date === targetDateStr));
      const insertAt = overTaskId
        ? destDayTasksBefore.findIndex((t) => t.id === overTaskId)
        : destDayTasksBefore.length;
      const destDayTasksAfter = [...destDayTasksBefore];
      destDayTasksAfter.splice(insertAt === -1 ? destDayTasksAfter.length : insertAt, 0, draggedTask);

      await moveTaskToDay(
        activeTaskId,
        targetDateStr,
        destDayTasksAfter.map((t) => t.id),
        sourceDayTasks.map((t) => t.id),
      );
      router.refresh();
      return;
    }

    // Reorder dalam hari yang sama.
    const dayTasks = sortTasksForDay(tasks.filter((t) => t.date === targetDateStr));
    const oldIndex = dayTasks.findIndex((t) => t.id === activeTaskId);
    const newIndex = overTaskId
      ? dayTasks.findIndex((t) => t.id === overTaskId)
      : dayTasks.length - 1;
    if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;

    const reordered = arrayMove(dayTasks, oldIndex, newIndex);
    const finalIndex = reordered.findIndex((t) => t.id === activeTaskId);
    const { startTime: newStartTime, endTime: newEndTime } = computeTimeForPosition(
      draggedTask,
      reordered[finalIndex - 1],
      reordered[finalIndex + 1],
    );
    const scheduleChanged = newStartTime !== (draggedTask.startTime ?? null);

    await reorderDayTasks(
      reordered.map((t) => t.id),
      scheduleChanged ? { id: activeTaskId, startTime: newStartTime, endTime: newEndTime } : undefined,
    );
    router.refresh();
  }

  return (
    <DndContext
      id="task-dnd"
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {children}
      <DragOverlay>
        {activeTask && (
          <div className="w-[280px] rounded-2xl border border-border/60 bg-background p-4 opacity-90 shadow-lg">
            <p
              className={`font-semibold ${activeTask.status === "done" ? "line-through" : ""}`}
            >
              {activeTask.title}
            </p>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
