import type { task } from "@/db/schema";

type Task = typeof task.$inferSelect;

// Task berjadwal (punya startTime) selalu naik ke atas, diurutkan menurut
// jamnya; task tanpa jadwal diurutkan menurut `position` (hasil drag & drop
// reorder). Dipakai baik di server component (render awal) maupun di client
// (TaskDndProvider, waktu menghitung ulang urutan setelah drag).
export function sortTasksForDay(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    if (a.startTime && b.startTime) return a.startTime.localeCompare(b.startTime);
    if (a.startTime) return -1;
    if (b.startTime) return 1;
    return a.position - b.position;
  });
}
