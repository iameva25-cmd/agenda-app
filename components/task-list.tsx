import type { channel, context, task } from "@/db/schema";
import { TaskItem } from "@/components/task-item";
import { getT } from "@/lib/i18n/server";

type Task = typeof task.$inferSelect;
type Channel = typeof channel.$inferSelect;
type ContextWithChannels = typeof context.$inferSelect & { channels: Channel[] };

export async function TaskList({
  tasks,
  contexts,
}: {
  tasks: Task[];
  contexts: ContextWithChannels[];
}) {
  const { t } = await getT();

  if (tasks.length === 0) {
    return (
      <div className="mt-6 flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border px-6 py-16 text-center">
        <p className="font-medium">{t("No tasks for today yet")}</p>
        <p className="text-sm text-muted-foreground">
          {t("Tasks you add will show up here.")}
        </p>
      </div>
    );
  }

  return (
    <ul className="mt-6 flex flex-col gap-3">
      {tasks.map((task) => (
        <TaskItem key={task.id} task={task} contexts={contexts} />
      ))}
    </ul>
  );
}
