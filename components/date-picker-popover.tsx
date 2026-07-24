"use client";

import { useEffect, useRef, useState } from "react";
import { Calendar, ChevronLeft, ChevronRight, X } from "lucide-react";
import { formatDate, parseDateString } from "@/lib/date";
import { WEEKDAY_LABELS, getMonthWeeks, isSameDay } from "@/lib/calendar-grid";
import { useTranslation } from "@/lib/i18n/context";
import { toIntlLocale } from "@/lib/i18n/dates";

// Popover date-picker reusable — dipakai untuk Start date & Due date di
// popup detail task, dan bisa dipakai lagi di tempat lain yang butuh pilih
// satu tanggal (misal nanti dropdown "Today").
export function DatePickerPopover({
  value,
  onSelect,
  placeholder,
  icon,
  allowClear = false,
  onClear,
  className,
}: {
  value: string | null;
  onSelect: (dateStr: string) => void;
  placeholder: string;
  icon?: React.ReactNode;
  allowClear?: boolean;
  onClear?: () => void;
  className?: string;
}) {
  const { t, locale } = useTranslation();
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(() =>
    value ? parseDateString(value) : new Date(),
  );
  const buttonRef = useRef<HTMLButtonElement>(null);

  function handleOpen(e: React.MouseEvent) {
    e.stopPropagation();
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) setPosition({ top: rect.bottom + 4, left: rect.left });
    setCalendarMonth(value ? parseDateString(value) : new Date());
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

  const label = value
    ? parseDateString(value).toLocaleDateString(toIntlLocale(locale), {
        month: "short",
        day: "numeric",
      })
    : placeholder;

  const weeks = getMonthWeeks(calendarMonth.getFullYear(), calendarMonth.getMonth());
  const selectedDateObj = value ? parseDateString(value) : null;
  const today = new Date();

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={handleOpen}
        className={
          className ??
          "flex items-center gap-1 rounded-full border border-border/60 px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        }
      >
        {icon ?? <Calendar className="h-3.5 w-3.5" />}
        {label}
        {allowClear && value && (
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              onClear?.();
            }}
            className="ml-0.5 rounded-full hover:text-foreground"
          >
            <X className="h-3 w-3" />
          </span>
        )}
      </button>

      {open && position && (
        <div className="fixed inset-0 z-40" onClick={() => setOpen(false)}>
          <div
            className="absolute z-50 w-64 rounded-lg border border-border/60 bg-background p-3 shadow-2xl ring-1 ring-black/5"
            style={{ top: position.top, left: position.left }}
            onClick={(e) => e.stopPropagation()}
          >
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
                      onClick={() => {
                        onSelect(formatDate(day));
                        setOpen(false);
                      }}
                      className={`mx-auto flex h-6 w-6 items-center justify-center rounded-full ${
                        selectedDateObj && isSameDay(day, selectedDateObj)
                          ? "bg-primary text-primary-foreground"
                          : isSameDay(day, today)
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

            {allowClear && value && (
              <button
                type="button"
                onClick={() => {
                  onClear?.();
                  setOpen(false);
                }}
                className="mt-2 w-full border-t border-border/50 pt-2 text-left text-xs text-muted-foreground hover:text-foreground"
              >
                {t("Clear date")}
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
