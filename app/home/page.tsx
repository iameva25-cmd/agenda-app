import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { SidebarNav } from "@/components/sidebar-nav";
import { DayColumn } from "@/components/day-column";
import { DayCalendar } from "@/components/day-calendar";
import { TaskReminders } from "@/components/task-reminders";
import {
  carryOverUnfinishedTasks,
  getTasksForDate,
  getTodayDateString,
  getUpcomingDateStrings,
} from "@/lib/tasks";
import { getContextsWithChannels } from "@/lib/actions/channels";
import { getT } from "@/lib/i18n/server";
import { toIntlLocale } from "@/lib/i18n/dates";

export const dynamic = "force-dynamic";

const NUM_DAYS = 5;

export default async function HomePage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login");
  }

  await carryOverUnfinishedTasks(session.user.id);

  const todayDateStr = getTodayDateString();
  const dateStrings = getUpcomingDateStrings(NUM_DAYS);
  const [tasksByDate, contexts] = await Promise.all([
    Promise.all(dateStrings.map((dateStr) => getTasksForDate(session.user.id, dateStr))),
    getContextsWithChannels(),
  ]);
  const todayTasks = tasksByDate[0];
  const scheduledTasks = todayTasks.filter((t) => t.startTime);

  const { t, locale } = await getT();

  const now = new Date();
  const shortDate = now
    .toLocaleDateString(toIntlLocale(locale), { weekday: "short", day: "numeric" })
    .toUpperCase();

  return (
    <div className="flex h-screen overflow-hidden">
      <SidebarNav userName={session.user.name} current="home" />

      <main className="flex-1 overflow-y-auto px-8 py-10 sm:px-10">
        <h1 className="text-xl font-bold">{t("Home")}</h1>

        <div className="mt-8 flex gap-4 overflow-x-auto pb-2">
          {dateStrings.map((dateStr, i) => (
            <DayColumn
              key={dateStr}
              dateStr={dateStr}
              tasks={tasksByDate[i]}
              contexts={contexts}
              isToday={dateStr === todayDateStr}
              hideScheduled={dateStr === todayDateStr}
            />
          ))}
        </div>
      </main>

      <aside className="w-[300px] shrink-0 overflow-y-auto border-l border-border/60 px-5 py-10">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted-foreground">
            {t("Calendars")}
          </h2>
          <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
            {shortDate}
          </span>
        </div>
        <TaskReminders tasks={scheduledTasks} />
        <DayCalendar tasks={scheduledTasks} contexts={contexts} />
      </aside>
    </div>
  );
}
