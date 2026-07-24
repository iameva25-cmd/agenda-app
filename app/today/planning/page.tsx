import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { SidebarNav } from "@/components/sidebar-nav";
import { TaskDndProvider } from "@/components/task-dnd-provider";
import { TaskList } from "@/components/task-list";
import { AddTaskPopup } from "@/components/add-task-popup";
import { DayCalendar } from "@/components/day-calendar";
import { TaskReminders } from "@/components/task-reminders";
import { TodayDateDropdown } from "@/components/today-date-dropdown";
import { TodayFilterDropdown } from "@/components/today-filter-dropdown";
import { ShutdownTimeCard } from "@/components/shutdown-time-card";
import { getTasksForDate, getTodayDateString } from "@/lib/tasks";
import { getShutdownTime } from "@/lib/actions/daily-plan";
import { parseDateString } from "@/lib/date";
import { sortTasksForDay } from "@/lib/task-sort";
import { getContextsWithChannels } from "@/lib/actions/channels";
import { getT } from "@/lib/i18n/server";
import { toIntlLocale } from "@/lib/i18n/dates";
import { getTimeZone } from "@/lib/timezone-server";

export const dynamic = "force-dynamic";

const DATE_STR_RE = /^\d{4}-\d{2}-\d{2}$/;

export default async function DailyPlanningPage({
  searchParams,
}: {
  searchParams: Promise<{
    date?: string;
    channelId?: string;
    contextId?: string;
    priority?: string;
  }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login");
  }

  const timeZone = await getTimeZone();
  const todayDateStr = getTodayDateString(timeZone);
  const params = await searchParams;
  const viewDateStr =
    params.date && DATE_STR_RE.test(params.date) ? params.date : todayDateStr;
  const filterChannelId = params.channelId ?? null;
  const filterContextId = params.contextId ?? null;
  const filterPriority = params.priority ?? null;

  const [tasks, contexts, shutdownTime] = await Promise.all([
    getTasksForDate(session.user.id, viewDateStr),
    getContextsWithChannels(),
    getShutdownTime(viewDateStr),
  ]);

  const channelToContext = new Map<string, string>();
  for (const ctx of contexts) {
    for (const ch of ctx.channels) channelToContext.set(ch.id, ctx.id);
  }

  let filteredTasks = tasks;
  if (filterChannelId) {
    filteredTasks = filteredTasks.filter((t) => t.channelId === filterChannelId);
  } else if (filterContextId) {
    filteredTasks = filteredTasks.filter(
      (t) =>
        t.contextId === filterContextId ||
        (t.channelId && channelToContext.get(t.channelId) === filterContextId),
    );
  }
  if (filterPriority) {
    filteredTasks = filteredTasks.filter((t) => t.priority === filterPriority);
  }

  const sortedTasks = sortTasksForDay(filteredTasks);
  const scheduledTasks = filteredTasks.filter((t) => t.startTime);

  const { t, locale } = await getT();
  const viewDateObj = parseDateString(viewDateStr);
  const dayName = viewDateObj.toLocaleDateString(toIntlLocale(locale), { weekday: "long" });
  const dateLabel = viewDateObj.toLocaleDateString(toIntlLocale(locale), {
    month: "long",
    day: "numeric",
  });

  return (
    <TaskDndProvider tasks={tasks}>
      <div className="flex h-screen overflow-hidden">
        <SidebarNav userName={session.user.name} current="today-planning" />

        <div className="w-[448px] shrink-0 overflow-y-auto border-r border-border/60 px-6 py-10">
          <h1 className="text-xl font-bold">{t("What do you want to get done today?")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("Add tasks you want to work on today.")}
          </p>

          <ShutdownTimeCard dateStr={viewDateStr} initialShutdownTime={shutdownTime} />

          <p className="mt-6 text-sm text-muted-foreground">
            {t("What are the most high-impact things you could do today?")}
          </p>
        </div>

        <div className="w-[340px] shrink-0 overflow-y-auto border-r border-border/60 px-5 py-6">
          <div className="flex items-center gap-2">
            <TodayDateDropdown
              dateStr={viewDateStr}
              todayDateStr={todayDateStr}
              basePath="/today/planning"
            />
            <TodayFilterDropdown
              contexts={contexts}
              channelId={filterChannelId}
              contextId={filterContextId}
              priority={filterPriority}
              basePath="/today/planning"
            />
          </div>

          <p className="mt-6 text-xl font-bold">{dayName}</p>
          <p className="text-sm text-muted-foreground">{dateLabel}</p>

          <div className="mt-2">
            <AddTaskPopup dateStr={viewDateStr} contexts={contexts} />
          </div>

          <div className="mt-2">
            <TaskList dateStr={viewDateStr} tasks={sortedTasks} contexts={contexts} />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-6">
          <TaskReminders tasks={scheduledTasks} />
          <DayCalendar tasks={scheduledTasks} contexts={contexts} />
        </div>
      </div>
    </TaskDndProvider>
  );
}
