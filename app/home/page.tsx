import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { SidebarNav } from "@/components/sidebar-nav";
import { DayColumn } from "@/components/day-column";
import { DayCalendar } from "@/components/day-calendar";
import { CalendarSidebar } from "@/components/calendar-sidebar";
import { TaskReminders } from "@/components/task-reminders";
import { HomeLoadMoreSentinel } from "@/components/home-load-more-sentinel";
import { TaskDndProvider } from "@/components/task-dnd-provider";
import {
  carryOverUnfinishedTasks,
  getTasksForDates,
  getTodayDateString,
  getUpcomingDateStrings,
} from "@/lib/tasks";
import { getContextsWithChannels } from "@/lib/actions/channels";
import { getT } from "@/lib/i18n/server";
import { toIntlLocale } from "@/lib/i18n/dates";
import { getTimeZone } from "@/lib/timezone-server";

export const dynamic = "force-dynamic";

// Rentang kolom hari di Home dimuat bertahap (infinite scroll), bukan
// langsung 90 sekaligus — awalnya cuma INITIAL_DAYS supaya load pertama
// tetap cepat, lalu nambah DAYS_STEP hari tiap kali user scroll mendekati
// ujung kanan (lihat HomeLoadMoreSentinel), sampai maksimal MAX_DAYS.
// Jumlah hari yang sedang aktif disimpan di URL (?days=), dibaca ulang oleh
// server component ini supaya query task-nya selalu sesuai jumlah kolom
// yang benar-benar sedang ditampilkan.
const INITIAL_DAYS = 14;
const MAX_DAYS = 90;

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login");
  }

  const params = await searchParams;
  const requestedDays = Number(params.days);
  const numDays = Number.isFinite(requestedDays)
    ? Math.min(Math.max(requestedDays, INITIAL_DAYS), MAX_DAYS)
    : INITIAL_DAYS;

  const timeZone = await getTimeZone();
  await carryOverUnfinishedTasks(session.user.id, timeZone);

  const todayDateStr = getTodayDateString(timeZone);
  const dateStrings = getUpcomingDateStrings(numDays, timeZone);
  // Satu query batch untuk semua tanggal (bukan satu query per hari) supaya
  // menambah jumlah hari tidak menambah jumlah query ke database.
  const [allTasks, contexts] = await Promise.all([
    getTasksForDates(session.user.id, dateStrings),
    getContextsWithChannels(),
  ]);
  const tasksByDate = dateStrings.map((dateStr) =>
    allTasks.filter((t) => t.date === dateStr),
  );
  const todayTasks = tasksByDate[0];
  const scheduledTasks = todayTasks.filter((t) => t.startTime);

  const { t, locale } = await getT();

  const now = new Date();
  const shortDate = now
    .toLocaleDateString(toIntlLocale(locale), { weekday: "short", day: "numeric", timeZone })
    .toUpperCase();

  return (
    <TaskDndProvider tasks={allTasks}>
      <div className="flex h-screen overflow-hidden">
        <SidebarNav userName={session.user.name} current="home" />

        <main className="flex-1 overflow-y-auto px-8 py-10 sm:px-10">
          <h1 className="text-xl font-semibold">{t("Home")}</h1>

          <div data-home-day-row className="mt-8 flex gap-4 overflow-x-auto pb-2">
            {dateStrings.map((dateStr, i) => (
              <DayColumn
                key={dateStr}
                dateStr={dateStr}
                tasks={tasksByDate[i]}
                contexts={contexts}
                isToday={dateStr === todayDateStr}
              />
            ))}
            <HomeLoadMoreSentinel currentDays={numDays} maxDays={MAX_DAYS} />
          </div>
        </main>

        <CalendarSidebar shortDate={shortDate}>
          <TaskReminders tasks={scheduledTasks} />
          <DayCalendar tasks={scheduledTasks} contexts={contexts} />
        </CalendarSidebar>
      </div>
    </TaskDndProvider>
  );
}
