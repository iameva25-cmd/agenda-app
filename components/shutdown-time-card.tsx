"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setShutdownTime } from "@/lib/actions/daily-plan";
import { useTranslation } from "@/lib/i18n/context";

// Card "Shutdown time" di Daily Planning — sebelumnya input jam-nya
// `disabled` (placeholder "Coming soon"), sekarang beneran bisa diisi dan
// tersimpan per tanggal via dailyPlan table. Tombol "Add to calendar" masih
// sengaja dibiarkan disabled ("Coming soon") karena Google Calendar sync
// memang belum dibangun/di-hold, di luar scope perbaikan ini.
export function ShutdownTimeCard({
  dateStr,
  initialShutdownTime,
}: {
  dateStr: string;
  initialShutdownTime: string | null;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const [value, setValue] = useState(initialShutdownTime ?? "21:00");
  const [saving, setSaving] = useState(false);

  async function handleChange(newValue: string) {
    setValue(newValue);
    setSaving(true);
    await setShutdownTime(dateStr, newValue || null);
    setSaving(false);
    router.refresh();
  }

  return (
    <div className="mt-6 rounded-2xl border border-border/60 p-4 shadow-sm">
      <p className="text-sm font-medium">{t("Shutdown time")}</p>
      <p className="mt-1 text-xs text-muted-foreground">
        {t("What time would you like to wrap up work by?")}
      </p>
      <div className="mt-3 flex items-center gap-2">
        <input
          type="time"
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          className="rounded-lg border border-border/60 px-3 py-1.5 text-sm outline-none focus:border-primary"
        />
        {saving && <span className="text-xs text-muted-foreground">{t("Saving...")}</span>}
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
  );
}
