import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { SidebarNav } from "@/components/sidebar-nav";
import { DayColumn } from "@/components/day-column";
import { TaskDndProvider } from "@/components/task-dnd-provider";
import { getTasksForDate, getTodayDateString } from "@/lib/tasks";
import { getContextsWithChannels } from "@/lib/actions/channels";
import { getDailyProductivity, getTimeByChannel } from "@/lib/analytics";
import { formatDate, getMondayOfWeek, addDays, parseDateString } from "@/lib/date";
import { DailyProductivityChart, TimeByChannelChart } from "@/components/weekly-charts";
import { getT } from "@/lib/i18n/server";
import { getTimeZone } from "@/lib/timezone-server";

export const dynamic = "force-dynamic";

const DAY_LABELS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

export default async function WeeklyReviewPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login");
  }

  const timeZone = await getTimeZone();
  const today = parseDateString(getTodayDateString(timeZone));

  // Default: minggu LALU (tab "Last week" aktif, sesuai referensi)
  const lastMonday = addDays(getMondayOfWeek(today), -7);
  const weekDateStrings = Array.from({ length: 5 }, (_, i) => formatDate(addDays(lastMonday, i)));

  const [tasksByDate, contexts, dailyProductivity, timeByChannel] = await Promise.all([
    Promise.all(weekDateStrings.map((dateStr) => getTasksForDate(session.user.id, dateStr))),
    getContextsWithChannels(),
    getDailyProductivity(session.user.id, weekDateStrings),
    getTimeByChannel(session.user.id, weekDateStrings),
  ]);

  const productivityChartData = dailyProductivity.map((d, i) => ({
    label: DAY_LABELS[i],
    hours: Math.round((d.totalSeconds / 3600) * 100) / 100,
  }));

  const { t } = await getT();
  const allTasks = tasksByDate.flat();

  return (
    <TaskDndProvider tasks={allTasks}>
    <div className="flex h-screen overflow-hidden">
      <SidebarNav userName={session.user.name} current="week-review" />

      <main className="flex-1 overflow-y-auto px-8 py-10 sm:px-10">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-muted px-3 py-1.5 text-sm font-medium">
            📅 {t("Last week")}
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

        <div className="mt-10 flex gap-10 overflow-x-auto">
          {/* Kolom kiri: dashboard ringkasan, dari actualSeconds task minggu ini */}
          <div className="w-[260px] shrink-0">
            <h1 className="text-lg font-bold">{t("What got done")}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("How you spent your time this week in")}{" "}
              <span className="underline">{t("total")}</span>
            </p>

            <h3 className="mt-8 text-sm font-semibold">{t("Daily productivity")}</h3>
            <span className="text-[10px] text-muted-foreground">6 hr</span>
            <DailyProductivityChart data={productivityChartData} />
            <div className="flex gap-3 text-xs text-muted-foreground">
              {["Mon", "Tue", "Wed", "Thu", "Fri"].map((d) => (
                <span key={d} className="flex-1 text-center">
                  {t(d)}
                </span>
              ))}
            </div>

            <h3 className="mt-8 text-sm font-semibold">{t("How you spent your time")}</h3>
            <div className="mt-3">
              <TimeByChannelChart data={timeByChannel} />
            </div>

            <div className="mt-8 flex gap-2">
              <button
                type="button"
                disabled
                title={t("Coming soon")}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/60 text-muted-foreground/70"
              >
                ←
              </button>
              <button
                type="button"
                disabled
                title={t("Coming soon")}
                className="rounded-lg border border-border/60 px-6 py-2 text-sm font-medium text-muted-foreground/70"
              >
                {t("Next")}
              </button>
            </div>
          </div>

          {/* Kolom kanan: 5 hari kerja minggu lalu, data & TaskCard asli */}
          <div className="flex gap-4 overflow-x-auto pb-2">
            {weekDateStrings.map((dateStr, i) => (
              <DayColumn
                key={dateStr}
                dateStr={dateStr}
                tasks={tasksByDate[i]}
                contexts={contexts}
                isToday={false}
              />
            ))}
          </div>
        </div>
      </main>
    </div>
    </TaskDndProvider>
  );
}
