import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { SidebarNav } from "@/components/sidebar-nav";
import { DailyShutdownPanel } from "@/components/daily-shutdown-panel";
import { getTasksForDate, getTodayDateString } from "@/lib/tasks";
import { getContextsWithChannels } from "@/lib/actions/channels";
import { getLocale } from "@/lib/i18n/server";
import { toIntlLocale } from "@/lib/i18n/dates";
import { getTimeZone } from "@/lib/timezone-server";

export const dynamic = "force-dynamic";

export default async function DailyShutdownPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login");
  }

  const timeZone = await getTimeZone();
  const todayDateStr = getTodayDateString(timeZone);
  const [tasks, contexts] = await Promise.all([
    getTasksForDate(session.user.id, todayDateStr),
    getContextsWithChannels(),
  ]);

  const doneTasks = tasks.filter((t) => t.status === "done");
  const todoTasks = tasks.filter((t) => t.status !== "done");
  const totalActualSeconds = tasks.reduce((sum, t) => sum + t.actualSeconds, 0);

  const locale = await getLocale();
  const todayLabel = new Date().toLocaleDateString(toIntlLocale(locale), {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone,
  });

  return (
    <div className="flex h-screen overflow-hidden">
      <SidebarNav userName={session.user.name} current="today-shutdown" />

      <main className="flex-1 overflow-y-auto px-8 py-10 sm:px-10">
        <DailyShutdownPanel
          todayLabel={todayLabel}
          doneTasks={doneTasks}
          todoTasks={todoTasks}
          totalActualSeconds={totalActualSeconds}
          contexts={contexts}
        />
      </main>
    </div>
  );
}
