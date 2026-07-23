import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { TodayFocusShell } from "@/components/today-focus-shell";
import { TaskList } from "@/components/task-list";
import { AddTaskPopup } from "@/components/add-task-popup";
import { DayCalendar } from "@/components/day-calendar";
import { TaskReminders } from "@/components/task-reminders";
import { carryOverUnfinishedTasks, getTasksForDate, getTodayDateString } from "@/lib/tasks";
import { getContextsWithChannels } from "@/lib/actions/channels";
import { getT } from "@/lib/i18n/server";
import { toIntlLocale } from "@/lib/i18n/dates";
import { getTimeZone } from "@/lib/timezone-server";

export const dynamic = "force-dynamic";

export default async function TodayFocusPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login");
  }

  const timeZone = await getTimeZone();
  await carryOverUnfinishedTasks(session.user.id, timeZone);

  const todayDateStr = getTodayDateString(timeZone);
  const [tasks, contexts] = await Promise.all([
    getTasksForDate(session.user.id, todayDateStr),
    getContextsWithChannels(),
  ]);

  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.startTime && b.startTime) return a.startTime.localeCompare(b.startTime);
    if (a.startTime) return -1;
    if (b.startTime) return 1;
    return 0;
  });
  const scheduledTasks = tasks.filter((t) => t.startTime);

  const { t, locale } = await getT();
  const now = new Date();
  const dayName = now.toLocaleDateString(toIntlLocale(locale), { weekday: "long", timeZone });
  const dateLabel = now.toLocaleDateString(toIntlLocale(locale), {
    month: "long",
    day: "numeric",
    timeZone,
  });

  return (
    <TodayFocusShell userName={session.user.name}>
      <div className="w-[340px] shrink-0 overflow-y-auto border-r border-border/60 px-5 py-6">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-muted px-3 py-1.5 text-sm font-medium">
            📅 {t("Today")}
          </span>
          <button
            type="button"
            disabled
            title={t("Coming soon")}
            className="rounded-full border border-border/60 px-3 py-1.5 text-sm text-muted-foreground/70"
          >
            ☰ {t("Filter")}
          </button>
        </div>

        <p className="mt-6 text-xl font-bold">{dayName}</p>
        <p className="text-sm text-muted-foreground">{dateLabel}</p>

        <div className="mt-2">
          <AddTaskPopup dateStr={todayDateStr} />
        </div>

        <div className="mt-2">
          <TaskList tasks={sortedTasks} contexts={contexts} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-6">
        <TaskReminders tasks={scheduledTasks} />
        <DayCalendar tasks={scheduledTasks} contexts={contexts} />
      </div>
    </TodayFocusShell>
  );
}
