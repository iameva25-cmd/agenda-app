import type { channel, context, task } from "@/db/schema";
import { TaskItem } from "@/components/task-item";

type Task = typeof task.$inferSelect;
type Channel = typeof channel.$inferSelect;
type ContextWithChannels = typeof context.$inferSelect & { channels: Channel[] };

export function TaskList({
  tasks,
  contexts,
}: {
  tasks: Task[];
  contexts: ContextWithChannels[];
}) {
  if (tasks.length === 0) {
    return (
      <div className="mt-6 flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border px-6 py-16 text-center">
        <p className="font-medium">Belum ada task untuk hari ini</p>
        <p className="text-sm text-muted-foreground">
          Task yang kamu tambahkan akan muncul di sini.
        </p>
      </div>
    );
  }

  return (
    <ul className="mt-6 flex flex-col gap-3">
      {tasks.map((t) => (
        <TaskItem key={t.id} task={t} contexts={contexts} />
      ))}
    </ul>
  );
}
