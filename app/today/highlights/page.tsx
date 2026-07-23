import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { SidebarNav } from "@/components/sidebar-nav";
import { DailyHighlightsPanel } from "@/components/daily-highlights-panel";
import { getTasksForDate, getTodayDateString } from "@/lib/tasks";
import { getLocale } from "@/lib/i18n/server";
import { toIntlLocale } from "@/lib/i18n/dates";
import { getTimeZone } from "@/lib/timezone-server";

export const dynamic = "force-dynamic";

export default async function DailyHighlightsPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login");
  }

  const timeZone = await getTimeZone();
  const todayDateStr = getTodayDateString(timeZone);
  const tasks = await getTasksForDate(session.user.id, todayDateStr);

  const locale = await getLocale();
  const todayLabel = new Date().toLocaleDateString(toIntlLocale(locale), {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone,
  });

  return (
    <div className="flex h-screen overflow-hidden">
      <SidebarNav userName={session.user.name} current="today-highlights" />

      <main className="flex-1 overflow-y-auto px-8 py-10 sm:px-10">
        <DailyHighlightsPanel todayLabel={todayLabel} tasks={tasks} />
      </main>
    </div>
  );
}
