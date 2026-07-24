"use client";

import { useState } from "react";
import { ChevronsLeft, ChevronsRight } from "lucide-react";
import { useTranslation } from "@/lib/i18n/context";

// Wrapper client-side untuk kolom kalender kanan di Home supaya bisa
// collapse/expand — mengikuti pola yang sama dengan TodayFocusShell
// (strip tipis + tombol Chevrons saat collapsed) biar konsisten.
export function CalendarSidebar({
  shortDate,
  children,
}: {
  shortDate: string;
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const { t } = useTranslation();

  if (collapsed) {
    return (
      <div className="flex w-8 shrink-0 flex-col items-center border-l border-border/60 pt-10">
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          aria-label={t("Show calendar")}
          className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ChevronsLeft className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <aside className="w-[450px] shrink-0 overflow-y-auto border-l border-border/60 px-5 py-10">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-muted-foreground">{t("Calendars")}</h2>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
            {shortDate}
          </span>
          <button
            type="button"
            onClick={() => setCollapsed(true)}
            aria-label={t("Hide calendar")}
            className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ChevronsRight className="h-4 w-4" />
          </button>
        </div>
      </div>
      {children}
    </aside>
  );
}
