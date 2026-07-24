"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatDate, parseDateString, addDays } from "@/lib/date";
import { WEEKDAY_LABELS, getMonthWeeks, isSameDay } from "@/lib/calendar-grid";
import { useTranslation } from "@/lib/i18n/context";
import { toIntlLocale } from "@/lib/i18n/dates";

// Dropdown "Today" reusable — dipakai di /today dan /today/planning (Bagian 4
// minta reuse, bukan dibikin ulang). Ganti tanggal lewat query param ?date=
// di basePath yang diberikan, query param lain (misal filter) tetap dijaga.
export function TodayDateDropdown({
  dateStr,
  todayDateStr,
  basePath,
}: {
  dateStr: string;
  todayDateStr: string;
  basePath: string;
}) {
  const { t, locale } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(() => parseDateString(dateStr));
  const buttonRef = useRef<HTMLButtonElement>(null);

  function goToDate(newDateStr: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (newDateStr === todayDateStr) {
      params.delete("date");
    } else {
      params.set("date", newDateStr);
    }
    const qs = params.toString();
    router.push(`${basePath}${qs ? `?${qs}` : ""}`);
    setOpen(false);
  }

  function handleOpen(e: React.MouseEvent) {
    e.stopPropagation();
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) setPosition({ top: rect.bottom + 4, left: rect.left });
    setCalendarMonth(parseDateString(dateStr));
    setOpen(true);
  }

  useEffect(() => {
    if (!open) return;
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open]);

  const selectedDateObj = parseDateString(dateStr);
  const todayObj = parseDateString(todayDateStr);
  const isToday = dateStr === todayDateStr;
  const label = isToday
    ? t("Today")
    : selectedDateObj.toLocaleDateString(toIntlLocale(locale), { month: "short", day: "numeric" });
  const weeks = getMonthWeeks(calendarMonth.getFullYear(), calendarMonth.getMonth());

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={handleOpen}
        className="rounded-full bg-muted px-3 py-1.5 text-sm font-medium hover:bg-muted/70"
      >
        📅 {label}
      </button>

      {open && position && (
        <div className="fixed inset-0 z-40" onClick={() => setOpen(false)}>
          <div
            className="absolute z-50 w-64 rounded-lg border border-border/60 bg-background p-3 shadow-2xl ring-1 ring-black/5"
            style={{ top: position.top, left: position.left }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col">
              <button
                type="button"
                onClick={() => goToDate(todayDateStr)}
                className="rounded px-1.5 py-1 text-left text-xs hover:bg-muted"
              >
                {t("Go to today")}
              </button>
              <button
                type="button"
                onClick={() => goToDate(formatDate(addDays(selectedDateObj, 1)))}
                className="rounded px-1.5 py-1 text-left text-xs hover:bg-muted"
              >
                {t("Go to next day")}
              </button>
              <button
                type="button"
                onClick={() => goToDate(formatDate(addDays(selectedDateObj, -1)))}
                className="rounded px-1.5 py-1 text-left text-xs hover:bg-muted"
              >
                {t("Go to previous day")}
              </button>
            </div>

            <div className="mt-2 border-t border-border/50 pt-2">
              <div className="flex items-center justify-between px-1">
                <button
                  type="button"
                  onClick={() =>
                    setCalendarMonth(
                      new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1),
                    )
                  }
                  className="rounded p-0.5 hover:bg-muted"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-xs font-medium">
                  {calendarMonth.toLocaleDateString(toIntlLocale(locale), {
                    month: "long",
                    year: "numeric",
                  })}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setCalendarMonth(
                      new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1),
                    )
                  }
                  className="rounded p-0.5 hover:bg-muted"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-1 grid grid-cols-7 gap-y-1 text-center text-[10px] text-muted-foreground/70">
                {WEEKDAY_LABELS.map((d, i) => (
                  <span key={i}>{d}</span>
                ))}
              </div>
              {weeks.map((week, wi) => (
                <div key={wi} className="grid grid-cols-7 gap-y-1 text-center text-xs">
                  {week.map((day, di) =>
                    day ? (
                      <button
                        key={di}
                        type="button"
                        onClick={() => goToDate(formatDate(day))}
                        className={`mx-auto flex h-6 w-6 items-center justify-center rounded-full ${
                          isSameDay(day, selectedDateObj)
                            ? "bg-primary text-primary-foreground"
                            : isSameDay(day, todayObj)
                              ? "font-medium text-primary"
                              : "hover:bg-muted"
                        }`}
                      >
                        {day.getDate()}
                      </button>
                    ) : (
                      <span key={di} />
                    ),
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
