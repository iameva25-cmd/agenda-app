"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import type { channel, context, task } from "@/db/schema";
import { TaskItem } from "@/components/task-item";
import { useTranslation } from "@/lib/i18n/context";

type Task = typeof task.$inferSelect;
type Channel = typeof channel.$inferSelect;
type ContextWithChannels = typeof context.$inferSelect & { channels: Channel[] };

export function TaskList({
  dateStr,
  tasks,
  contexts,
}: {
  dateStr: string;
  tasks: Task[];
  contexts: ContextWithChannels[];
}) {
  const { t } = useTranslation();
  // id kontainer hari ini — dipakai TaskDndProvider buat tahu task di-drop
  // di hari yang mana (reorder dalam hari yang sama vs pindah ke hari lain).
  const { setNodeRef } = useDroppable({
    id: `day:${dateStr}`,
    data: { type: "day", dateStr },
  });

  if (tasks.length === 0) {
    return (
      <div
        ref={setNodeRef}
        className="mt-6 flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border px-6 py-16 text-center"
      >
        <p className="font-medium">{t("No tasks for today yet")}</p>
        <p className="text-sm text-muted-foreground">
          {t("Tasks you add will show up here.")}
        </p>
      </div>
    );
  }

  return (
    <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
      <ul ref={setNodeRef} className="mt-6 flex flex-col gap-3">
        {tasks.map((task) => (
          <TaskItem key={task.id} task={task} contexts={contexts} />
        ))}
      </ul>
    </SortableContext>
  );
}
