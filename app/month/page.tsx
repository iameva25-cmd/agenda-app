import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { SidebarNav } from "@/components/sidebar-nav";
import { MonthCalendar } from "@/components/month-calendar";
import { getTasksForDates } from "@/lib/tasks";
import { getContextsWithChannels } from "@/lib/actions/channels";
import { formatDate, getMonthGridDates } from "@/lib/date";
import type { task } from "@/db/schema";

export const dynamic = "force-dynamic";

export default async function MonthPage({
  searchParams,
}: {
  searchParams: Promise<{ y?: string; m?: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login");
  }

  const params = await searchParams;
  const now = new Date();
  const year = params.y ? Number(params.y) : now.getFullYear();
  const month = params.m ? Number(params.m) - 1 : now.getMonth();
  const refDate = new Date(year, month, 1);

  const gridDates = getMonthGridDates(refDate);
  const dateStrings = gridDates.map(formatDate);

  const [tasks, contexts] = await Promise.all([
    getTasksForDates(session.user.id, dateStrings),
    getContextsWithChannels(),
  ]);

  const tasksByDate: Record<string, (typeof task.$inferSelect)[]> = {};
  for (const dateStr of dateStrings) tasksByDate[dateStr] = [];
  for (const t of tasks) {
    tasksByDate[t.date]?.push(t);
  }

  const todayDateStr = formatDate(now);

  return (
    <div className="flex h-screen overflow-hidden">
      <SidebarNav userName={session.user.name} current="month" />

      <main className="flex-1 overflow-y-auto px-8 py-10 sm:px-10">
        <MonthCalendar
          key={`${refDate.getFullYear()}-${refDate.getMonth()}`}
          year={refDate.getFullYear()}
          month={refDate.getMonth()}
          dateStrings={dateStrings}
          tasksByDate={tasksByDate}
          contexts={contexts}
          todayDateStr={todayDateStr}
        />
      </main>
    </div>
  );
}
