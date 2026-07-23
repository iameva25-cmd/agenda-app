import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { SidebarNav } from "@/components/sidebar-nav";
import { TaskList } from "@/components/task-list";
import { AddTaskPopup } from "@/components/add-task-popup";
import { DayCalendar } from "@/components/day-calendar";
import { TaskReminders } from "@/components/task-reminders";
import { getTasksForDate, getTodayDateString } from "@/lib/tasks";
import { getContextsWithChannels } from "@/lib/actions/channels";
import { getT } from "@/lib/i18n/server";
import { toIntlLocale } from "@/lib/i18n/dates";
import { getTimeZone } from "@/lib/timezone-server";

export const dynamic = "force-dynamic";

export default async function DailyPlanningPage() {
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
    <div className="flex h-screen overflow-hidden">
      <SidebarNav userName={session.user.name} current="today-planning" />

      <div className="w-[280px] shrink-0 overflow-y-auto border-r border-border/60 px-6 py-10">
        <h1 className="text-xl font-bold">{t("What do you want to get done today?")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("Add tasks you want to work on today.")}
        </p>

        <div className="mt-6 rounded-2xl border border-border/60 p-4 shadow-sm">
          <p className="text-sm font-semibold">{t("Shutdown time")}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {t("What time would you like to wrap up work by?")}
          </p>
          <div className="mt-3 flex items-center gap-2">
            <input
              type="time"
              defaultValue="21:00"
              disabled
              title={t("Coming soon")}
              className="rounded-lg border border-border/60 px-3 py-1.5 text-sm text-muted-foreground/70"
            />
            <button
              type="button"
              disabled
              title={t("Coming soon (Google Calendar sync is on hold)")}
              className="flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-border/60 px-3 py-1.5 text-sm text-muted-foreground/50"
            >
              📅 {t("Add to calendar")}
            </button>
          </div>
        </div>

        <div className="mt-6 flex gap-2">
          <button
            type="button"
            disabled
            title={t("No previous step")}
            className="flex-1 rounded-lg border border-border/60 px-3 py-2 text-sm text-muted-foreground/40"
          >
            ←
          </button>
          <Link
            href="/today/shutdown"
            className="flex-1 rounded-lg bg-primary px-3 py-2 text-center text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            {t("Next")}
          </Link>
        </div>

        <p className="mt-8 text-sm text-muted-foreground">
          {t("What are the most high-impact things you could do today?")}
        </p>
      </div>

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
    </div>
  );
}
