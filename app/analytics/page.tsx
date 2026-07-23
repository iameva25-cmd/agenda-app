import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { auth } from "@/lib/auth";
import { SidebarNav } from "@/components/sidebar-nav";
import { getDailyProductivity, getTimeByChannel } from "@/lib/analytics";
import { addDays, formatDate, getMondayOfWeek, parseDateString } from "@/lib/date";
import { DailyProductivityChart, TimeByChannelChart } from "@/components/weekly-charts";

export const dynamic = "force-dynamic";

const DAY_LABELS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const DAY_SHORT_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri"];

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ monday?: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login");
  }

  const params = await searchParams;
  const monday = params.monday ? parseDateString(params.monday) : getMondayOfWeek(new Date());
  const weekDateStrings = Array.from({ length: 5 }, (_, i) => formatDate(addDays(monday, i)));

  const [dailyProductivity, timeByChannel] = await Promise.all([
    getDailyProductivity(session.user.id, weekDateStrings),
    getTimeByChannel(session.user.id, weekDateStrings),
  ]);

  const productivityChartData = dailyProductivity.map((d, i) => ({
    label: DAY_LABELS[i],
    hours: Math.round((d.totalSeconds / 3600) * 100) / 100,
  }));

  const prevMondayStr = formatDate(addDays(monday, -7));
  const nextMondayStr = formatDate(addDays(monday, 7));
  const rangeLabel = `${parseDateString(weekDateStrings[0]).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
  })} - ${parseDateString(weekDateStrings[4]).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })}`;

  return (
    <div className="flex h-screen overflow-hidden">
      <SidebarNav userName={session.user.name} current="analytics" />

      <main className="flex-1 overflow-y-auto px-8 py-10 sm:px-10">
        <div className="mx-auto max-w-md">
          <h1 className="text-xl font-bold">Analytics</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Jam kerja per kategori, per minggu.
          </p>

          <div className="mt-4 flex items-center gap-3">
            <Link
              href={`/analytics?monday=${prevMondayStr}`}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 text-muted-foreground transition-colors hover:bg-muted"
            >
              <ChevronLeft className="h-4 w-4" />
            </Link>
            <span className="text-sm font-medium">{rangeLabel}</span>
            <Link
              href={`/analytics?monday=${nextMondayStr}`}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 text-muted-foreground transition-colors hover:bg-muted"
            >
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <h3 className="mt-8 text-sm font-semibold">Jam kerja per hari</h3>
          <span className="text-[10px] text-muted-foreground">6 hr</span>
          <DailyProductivityChart data={productivityChartData} />
          <div className="flex gap-3 text-xs text-muted-foreground">
            {DAY_SHORT_LABELS.map((d) => (
              <span key={d} className="flex-1 text-center">
                {d}
              </span>
            ))}
          </div>

          <h3 className="mt-8 text-sm font-semibold">Jam kerja per kategori</h3>
          <div className="mt-3">
            <TimeByChannelChart data={timeByChannel} />
          </div>
        </div>
      </main>
    </div>
  );
}
