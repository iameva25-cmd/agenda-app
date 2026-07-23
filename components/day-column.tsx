import type { channel, context, task } from "@/db/schema";
import { AddTaskPopup } from "@/components/add-task-popup";
import { TaskList } from "@/components/task-list";
import { parseDateString } from "@/lib/date";

type Task = typeof task.$inferSelect;
type Channel = typeof channel.$inferSelect;
type ContextWithChannels = typeof context.$inferSelect & { channels: Channel[] };

export function DayColumn({
  dateStr,
  tasks,
  contexts,
  isToday,
  hideScheduled = false,
}: {
  dateStr: string;
  tasks: Task[];
  contexts: ContextWithChannels[];
  isToday: boolean;
  hideScheduled?: boolean;
}) {
  const dateObj = parseDateString(dateStr);
  const dayName = dateObj.toLocaleDateString("en-US", { weekday: "long" });
  const dateLabel = dateObj.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
  });

  const sorted = [...tasks].sort((a, b) => {
    if (a.startTime && b.startTime) return a.startTime.localeCompare(b.startTime);
    if (a.startTime) return -1;
    if (b.startTime) return 1;
    return 0;
  });

  // hideScheduled: dipakai di /today untuk hari ini saja, karena task yang
  // sudah dijadwalkan ditampilkan di panel timeline kanan, bukan di sini.
  // Halaman lain (misal /week) tidak punya timeline itu, jadi semua task
  // (dijadwalkan maupun belum) tetap tampil di kolom.
  const visibleTasks = hideScheduled ? sorted.filter((t) => !t.startTime) : sorted;

  return (
    <div
      className={`w-[300px] shrink-0 rounded-2xl border p-4 ${
        isToday ? "border-primary/40 bg-primary/5" : "border-border/60 bg-transparent"
      }`}
    >
      <p className="text-xl font-bold">{dayName}</p>
      <p className="text-sm text-muted-foreground">{dateLabel}</p>

      <AddTaskPopup dateStr={dateStr} />

      <div className="mt-2">
        <TaskList tasks={visibleTasks} contexts={contexts} />
      </div>
    </div>
  );
}
