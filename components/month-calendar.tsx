"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { parseDateString } from "@/lib/date";
import { TaskItem } from "@/components/task-item";
import { AddTaskPopup } from "@/components/add-task-popup";
import { useTranslation } from "@/lib/i18n/context";
import { toIntlLocale } from "@/lib/i18n/dates";
import type { channel, context, task } from "@/db/schema";

type Task = typeof task.$inferSelect;
type Channel = typeof channel.$inferSelect;
type ContextWithChannels = typeof context.$inferSelect & { channels: Channel[] };

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function MonthCalendar({
  year,
  month,
  dateStrings,
  tasksByDate,
  contexts,
  todayDateStr,
}: {
  year: number;
  month: number; // 0-indexed
  dateStrings: string[];
  tasksByDate: Record<string, Task[]>;
  contexts: ContextWithChannels[];
  todayDateStr: string;
}) {
  const { t, locale } = useTranslation();
  const intlLocale = toIntlLocale(locale);
  const [selectedDate, setSelectedDate] = useState(
    dateStrings.includes(todayDateStr) ? todayDateStr : dateStrings[0],
  );

  const weeks: string[][] = [];
  for (let i = 0; i < dateStrings.length; i += 7) {
    weeks.push(dateStrings.slice(i, i + 7));
  }

  const prevMonthDate = new Date(year, month - 1, 1);
  const nextMonthDate = new Date(year, month + 1, 1);

  const selectedTasks = tasksByDate[selectedDate] ?? [];
  const selectedDateObj = parseDateString(selectedDate);

  return (
    <div className="flex h-full gap-6">
      <div className="flex h-full flex-1 flex-col rounded-2xl bg-black/4 p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">
            {new Date(year, month, 1).toLocaleDateString(intlLocale, {
              month: "long",
              year: "numeric",
            })}
          </h1>
          <div className="flex items-center gap-2">
            <Link
              href={`/month?y=${prevMonthDate.getFullYear()}&m=${prevMonthDate.getMonth() + 1}`}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 text-muted-foreground transition-colors hover:bg-muted"
            >
              <ChevronLeft className="h-4 w-4" />
            </Link>
            <Link
              href={`/month?y=${nextMonthDate.getFullYear()}&m=${nextMonthDate.getMonth() + 1}`}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 text-muted-foreground transition-colors hover:bg-muted"
            >
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-7 gap-2 text-center text-xs font-semibold text-muted-foreground">
          {WEEKDAY_LABELS.map((d) => (
            <div key={d}>{t(d).toUpperCase()}</div>
          ))}
        </div>

        <div className="mt-2 flex flex-1 flex-col gap-2">
          {weeks.map((week) => (
            <div key={week[0]} className="grid flex-1 grid-cols-7 gap-2">
              {week.map((dateStr) => {
                const dateObj = parseDateString(dateStr);
                const isCurrentMonth = dateObj.getMonth() === month;
                const isToday = dateStr === todayDateStr;
                const isSelected = dateStr === selectedDate;
                const tasks = tasksByDate[dateStr] ?? [];
                const doneCount = tasks.filter((t) => t.status === "done").length;

                return (
                  <button
                    key={dateStr}
                    type="button"
                    onClick={() => setSelectedDate(dateStr)}
                    className={`flex h-full flex-col items-center justify-center gap-1.5 rounded-xl border p-2 text-sm transition-colors ${
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border/60 bg-background hover:bg-muted"
                    } ${isCurrentMonth ? "" : "opacity-40"}`}
                  >
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-full ${
                        isToday
                          ? "bg-primary font-semibold text-primary-foreground"
                          : ""
                      }`}
                    >
                      {dateObj.getDate()}
                    </span>
                    {tasks.length > 0 && (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                        {doneCount}/{tasks.length}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="flex h-full w-[300px] shrink-0 flex-col overflow-y-auto rounded-2xl bg-black/7 p-6">
        <p className="text-sm font-semibold">
          {selectedDateObj.toLocaleDateString(intlLocale, {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </p>

        <div className="mt-3">
          <AddTaskPopup dateStr={selectedDate} />
        </div>

        <div className="mt-3">
          {selectedTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t("No tasks on this date yet.")}
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {selectedTasks.map((task) => (
                <TaskItem key={task.id} task={task} contexts={contexts} />
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
