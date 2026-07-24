import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { SidebarNav } from "@/components/sidebar-nav";
import { WeeklyObjectivesPanel } from "@/components/weekly-objectives-panel";
import { getObjectivesForWeek } from "@/lib/actions/objectives";
import { formatDate, getMondayOfWeek, parseDateString } from "@/lib/date";
import { getT } from "@/lib/i18n/server";
import { getTodayDateString } from "@/lib/tasks";
import { getTimeZone } from "@/lib/timezone-server";

export const dynamic = "force-dynamic";

export default async function WeeklyPlanningPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login");
  }

  const timeZone = await getTimeZone();
  const today = parseDateString(getTodayDateString(timeZone));
  const weekStartDate = formatDate(getMondayOfWeek(today));
  const objectives = await getObjectivesForWeek(weekStartDate);
  const { t } = await getT();

  return (
    <div className="flex h-screen overflow-hidden">
      <SidebarNav userName={session.user.name} current="week-planning" />

      <main className="flex-1 overflow-y-auto px-8 py-10 sm:px-10">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-muted px-3 py-1.5 text-sm font-medium">
            📅 {t("This week")}
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

        <div className="mt-10 grid grid-cols-1 gap-12 md:grid-cols-2">
          {/* Kolom kiri: label ritual + navigasi antar-step */}
          <div>
            <h1 className="text-lg font-semibold">{t("Weekly objectives")}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("Set your objectives for the week.")}
            </p>

            <div className="mt-10 flex gap-2">
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

          {/* Kolom kanan: daftar objective minggu ini */}
          <div>
            <h2 className="text-lg font-semibold">{t("This week")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("Your objectives for this week")}
            </p>

            <WeeklyObjectivesPanel weekStartDate={weekStartDate} objectives={objectives} />
          </div>
        </div>
      </main>
    </div>
  );
}
