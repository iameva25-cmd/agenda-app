"use client";

import { useEffect, useRef, useState } from "react";
import {
  Plus,
  Calendar,
  Clock,
  Hash,
  Target,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Check,
  Lock,
} from "lucide-react";
import { createTask } from "@/lib/actions/tasks";
import { formatDate, addDays } from "@/lib/date";
import { PriorityPicker } from "@/components/priority-picker";
import { useTranslation } from "@/lib/i18n/context";
import { toIntlLocale } from "@/lib/i18n/dates";

type Dropdown = "date" | "time" | "channel" | null;

const SOMEDAY_OPTIONS = [
  { label: "in the next week", offsetDays: 7, dot: "bg-green-500" },
  { label: "in the next month", offsetDays: 30, dot: "bg-green-500" },
  { label: "in the next quarter", offsetDays: 90, dot: "bg-amber-500" },
  { label: "in the next year", offsetDays: 365, dot: "bg-amber-500" },
];

const WEEKDAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

const QUICK_DURATIONS = [
  { label: "5 min", minutes: 5 },
  { label: "10 min", minutes: 10 },
  { label: "15 min", minutes: 15 },
  { label: "20 min", minutes: 20 },
  { label: "25 min", minutes: 25 },
  { label: "30 min", minutes: 30 },
  { label: "45 min", minutes: 45 },
  { label: "1 hr", minutes: 60 },
];

type ChannelOption = { name: string; private: boolean };
type ChannelGroup = { name: string; children: ChannelOption[] };

const CHANNEL_GROUPS: ChannelGroup[] = [
  {
    name: "work",
    children: [
      { name: "business development", private: false },
      { name: "finance", private: false },
      { name: "marketing", private: false },
    ],
  },
  {
    name: "personal",
    children: [
      { name: "family activities", private: true },
      { name: "household management", private: true },
    ],
  },
];

function getMonthWeeks(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const startOffset = (firstDay.getDay() + 6) % 7; // Senin = kolom pertama
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = Array(startOffset).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: (Date | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function AddTaskPopup({ dateStr }: { dateStr: string }) {
  const { t, locale } = useTranslation();
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);

  const [activeDropdown, setActiveDropdown] = useState<Dropdown>(null);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number } | null>(null);

  const [selectedDate, setSelectedDate] = useState(dateStr);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const [y, m] = dateStr.split("-").map(Number);
    return new Date(y, m - 1, 1);
  });

  const [durationMinutes, setDurationMinutes] = useState<number | null>(null);
  const [durationLabel, setDurationLabel] = useState("--:--");
  const [plannedTime, setPlannedTime] = useState("");

  const [channel, setChannel] = useState<string | null>(null);
  const [channelSearch, setChannelSearch] = useState("");

  const [priority, setPriority] = useState("normal");

  const buttonRef = useRef<HTMLButtonElement>(null);
  const dateButtonRef = useRef<HTMLButtonElement>(null);
  const timeButtonRef = useRef<HTMLButtonElement>(null);
  const channelButtonRef = useRef<HTMLButtonElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  function handleOpen() {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) setPosition({ top: rect.bottom + 4, left: rect.left });
    setSelectedDate(dateStr);
    const [y, m] = dateStr.split("-").map(Number);
    setCalendarMonth(new Date(y, m - 1, 1));
    setDurationMinutes(null);
    setDurationLabel("--:--");
    setPlannedTime("");
    setChannel(null);
    setChannelSearch("");
    setPriority("normal");
    setActiveDropdown(null);
    setOpen(true);
  }

  function toggleDropdown(
    which: Exclude<Dropdown, null>,
    ref: React.RefObject<HTMLButtonElement | null>,
    e: React.MouseEvent,
  ) {
    e.stopPropagation();
    if (activeDropdown === which) {
      setActiveDropdown(null);
      return;
    }
    const rect = ref.current?.getBoundingClientRect();
    if (rect) setDropdownPos({ top: rect.bottom + 4, left: rect.left });
    if (which === "channel") setChannelSearch("");
    setActiveDropdown(which);
  }

  function pickDate(dStr: string) {
    setSelectedDate(dStr);
    setActiveDropdown(null);
  }

  function pickDuration(minutes: number, label: string) {
    setDurationMinutes(minutes);
    setDurationLabel(label);
    setActiveDropdown(null);
  }

  function pickChannel(name: string | null) {
    setChannel(name);
    setActiveDropdown(null);
  }

  useEffect(() => {
    if (!open) return;
    function handleEscape(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      if (activeDropdown) setActiveDropdown(null);
      else setOpen(false);
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, activeDropdown]);

  const dateLabel = (() => {
    if (selectedDate === formatDate(new Date())) return t("Today");
    const [, month, day] = selectedDate.split("-").map(Number);
    return new Date(2000, month - 1, day).toLocaleDateString(toIntlLocale(locale), {
      month: "short",
      day: "numeric",
    });
  })();

  const weeks = getMonthWeeks(calendarMonth.getFullYear(), calendarMonth.getMonth());
  const [selY, selM, selD] = selectedDate.split("-").map(Number);
  const selectedDateObj = new Date(selY, selM - 1, selD);
  const today = new Date();

  const filteredChannels = CHANNEL_GROUPS.map((group) => ({
    ...group,
    matchesSelf: group.name.toLowerCase().includes(channelSearch.toLowerCase()),
    children: group.children.filter((c) =>
      c.name.toLowerCase().includes(channelSearch.toLowerCase()),
    ),
  })).filter((group) => group.matchesSelf || group.children.length > 0);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={handleOpen}
        className="mt-4 flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-muted-foreground/70 transition-colors hover:bg-muted"
      >
        <Plus className="h-4 w-4" />
        {t("Add task")}
      </button>

      {open && position && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setOpen(false);
            setActiveDropdown(null);
          }}
        >
          <div
            className="absolute z-50"
            style={{ top: position.top, left: position.left }}
            onClick={(e) => {
              e.stopPropagation();
              setActiveDropdown(null);
            }}
          >
            <span className="ml-3 inline-block rounded-t-md border border-b-0 border-border/60 bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground">
              {t("Add task")}
            </span>
            <div className="w-[380px] rounded-lg rounded-tl-none border border-border/60 bg-background p-3 shadow-2xl ring-1 ring-black/5">
              <form
                ref={formRef}
                action={async (formData: FormData) => {
                  await createTask(formData);
                  formRef.current?.reset();
                  setOpen(false);
                }}
                className="flex flex-col gap-2"
              >
                <textarea
                  name="title"
                  required
                  autoFocus
                  rows={2}
                  placeholder={t("Task description...")}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      formRef.current?.requestSubmit();
                    }
                  }}
                  className="w-full resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
                />

                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="rounded bg-purple-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                    TIP
                  </span>
                  <span>{t("Paste a URL")}</span>
                </div>

                <div className="mt-1 flex items-center gap-3 border-t border-border/50 pt-2 text-xs text-muted-foreground">
                  <button
                    ref={dateButtonRef}
                    type="button"
                    onClick={(e) => toggleDropdown("date", dateButtonRef, e)}
                    className="flex items-center gap-1 hover:text-foreground"
                  >
                    <Calendar className="h-3.5 w-3.5" />
                    {dateLabel}
                  </button>
                  <button
                    ref={timeButtonRef}
                    type="button"
                    onClick={(e) => toggleDropdown("time", timeButtonRef, e)}
                    className="flex items-center gap-1 hover:text-foreground"
                  >
                    <Clock className="h-3.5 w-3.5" />
                    {durationLabel === "--:--" ? durationLabel : t(durationLabel)}
                  </button>
                  <button
                    ref={channelButtonRef}
                    type="button"
                    onClick={(e) => toggleDropdown("channel", channelButtonRef, e)}
                    className="flex items-center gap-1 hover:text-foreground"
                  >
                    <Hash className="h-3.5 w-3.5" />
                    {channel ?? t("channel")}
                  </button>
                  <button type="button" className="hover:text-foreground">
                    <Target className="h-3.5 w-3.5" />
                  </button>
                  <PriorityPicker value={priority} onChange={setPriority} />
                  <button type="button" className="hover:text-foreground">
                    <ArrowUpDown className="h-3.5 w-3.5" />
                  </button>
                </div>

                <input type="hidden" name="date" value={selectedDate} />
                <input type="hidden" name="estimatedMinutes" value={durationMinutes ?? ""} />
                <input type="hidden" name="startTime" value={plannedTime} />
                <input type="hidden" name="channel" value={channel ?? ""} />
                <input type="hidden" name="priority" value={priority} />
              </form>
            </div>
          </div>

          {activeDropdown === "date" && dropdownPos && (
            <div
              className="absolute z-50 w-64 rounded-lg border border-border/60 bg-background p-3 shadow-2xl ring-1 ring-black/5"
              style={{ top: dropdownPos.top, left: dropdownPos.left }}
              onClick={(e) => e.stopPropagation()}
            >
              <p className="px-1 text-[11px] font-semibold uppercase text-muted-foreground/70">
                {t("Someday")}
              </p>
              <ul className="mt-1 flex flex-col">
                {SOMEDAY_OPTIONS.map((opt) => (
                  <li key={opt.label}>
                    <button
                      type="button"
                      onClick={() => pickDate(formatDate(addDays(new Date(), opt.offsetDays)))}
                      className="flex w-full items-center gap-2 rounded px-1.5 py-1 text-left text-xs hover:bg-muted"
                    >
                      <span className={`h-2.5 w-2.5 rounded-full ${opt.dot}`} />
                      {t(opt.label)}
                    </button>
                  </li>
                ))}
                <li>
                  <button
                    type="button"
                    disabled
                    title={t("Not supported — tasks in this app always need a fixed date")}
                    className="flex w-full cursor-not-allowed items-center gap-2 rounded px-1.5 py-1 text-left text-xs text-muted-foreground/40"
                  >
                    <span className="flex h-2.5 w-2.5 items-center justify-center rounded-full bg-zinc-400 text-[7px] font-bold text-white">
                      S
                    </span>
                    {t("someday")}
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    disabled
                    title={t("Not supported — tasks in this app always need a fixed date")}
                    className="flex w-full cursor-not-allowed items-center gap-2 rounded px-1.5 py-1 text-left text-xs text-muted-foreground/40"
                  >
                    <span className="flex h-2.5 w-2.5 items-center justify-center rounded-full bg-zinc-400 text-[7px] font-bold text-white">
                      N
                    </span>
                    {t("never")}
                  </button>
                </li>
              </ul>

              <p className="mt-2 border-t border-border/50 px-1 pt-2 text-[11px] font-semibold uppercase text-muted-foreground/70">
                {t("Schedule exact start date")}
              </p>
              <div className="mt-1 flex items-center justify-between px-1">
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
                        onClick={() => pickDate(formatDate(day))}
                        className={`mx-auto flex h-6 w-6 items-center justify-center rounded-full ${
                          isSameDay(day, selectedDateObj)
                            ? "bg-primary text-primary-foreground"
                            : isSameDay(day, today)
                              ? "font-semibold text-primary"
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
          )}

          {activeDropdown === "time" && dropdownPos && (
            <div
              className="absolute z-50 w-56 rounded-lg border border-border/60 bg-background p-3 shadow-2xl ring-1 ring-black/5"
              style={{ top: dropdownPos.top, left: dropdownPos.left }}
              onClick={(e) => e.stopPropagation()}
            >
              <label className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                {t("Planned:")}
                <input
                  type="time"
                  value={plannedTime}
                  onChange={(e) => setPlannedTime(e.target.value)}
                  className="rounded border border-border/60 bg-transparent px-1.5 py-0.5 text-xs outline-none focus:border-primary"
                />
              </label>

              <div className="mt-2 max-h-48 overflow-y-auto border-t border-border/50 pt-2">
                {QUICK_DURATIONS.map((d) => (
                  <button
                    key={d.minutes}
                    type="button"
                    onClick={() => pickDuration(d.minutes, d.label)}
                    className={`flex w-full items-center justify-between rounded px-1.5 py-1 text-left text-xs hover:bg-muted ${
                      durationMinutes === d.minutes ? "font-semibold text-primary" : ""
                    }`}
                  >
                    {t(d.label)}
                    {durationMinutes === d.minutes && <Check className="h-3.5 w-3.5" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeDropdown === "channel" && dropdownPos && (
            <div
              className="absolute z-50 w-64 rounded-lg border border-border/60 bg-background p-3 shadow-2xl ring-1 ring-black/5"
              style={{ top: dropdownPos.top, left: dropdownPos.left }}
              onClick={(e) => e.stopPropagation()}
            >
              <p className="px-1 text-xs font-medium text-muted-foreground">
                {t("Assign to channel")}
              </p>
              <input
                autoFocus
                value={channelSearch}
                onChange={(e) => setChannelSearch(e.target.value)}
                placeholder={t("Search...")}
                className="mt-1 w-full rounded border border-border/60 bg-transparent px-2 py-1 text-xs outline-none focus:border-primary"
              />

              <div className="mt-2 max-h-56 overflow-y-auto">
                {"unassigned".includes(channelSearch.toLowerCase()) && (
                  <button
                    type="button"
                    onClick={() => pickChannel(null)}
                    className="flex w-full items-center justify-between rounded px-1.5 py-1 text-left text-xs text-muted-foreground hover:bg-muted"
                  >
                    <span className="flex items-center gap-1.5">
                      <Hash className="h-3 w-3" />
                      {t("Unassigned")}
                    </span>
                    {channel === null && <Check className="h-3.5 w-3.5" />}
                  </button>
                )}

                {filteredChannels.map((group) => (
                  <div key={group.name}>
                    <button
                      type="button"
                      onClick={() => pickChannel(group.name)}
                      className="flex w-full items-center justify-between rounded px-1.5 py-1 text-left text-xs hover:bg-muted"
                    >
                      <span className="flex items-center gap-1.5">
                        <Hash className="h-3 w-3 text-primary" />
                        {group.name}
                      </span>
                      {channel === group.name && <Check className="h-3.5 w-3.5" />}
                    </button>
                    {group.children.map((c) => (
                      <button
                        key={c.name}
                        type="button"
                        onClick={() => pickChannel(c.name)}
                        className="flex w-full items-center justify-between rounded px-1.5 py-1 pl-5 text-left text-xs hover:bg-muted"
                      >
                        <span className="flex items-center gap-1.5">
                          {c.private ? (
                            <Lock className="h-3 w-3 text-muted-foreground" />
                          ) : (
                            <Hash className="h-3 w-3 text-primary" />
                          )}
                          {c.name}
                        </span>
                        {channel === c.name && <Check className="h-3.5 w-3.5" />}
                      </button>
                    ))}
                  </div>
                ))}
              </div>

              <button
                type="button"
                title={t("Not available yet — channel settings haven't been set up")}
                className="mt-2 w-full border-t border-border/50 pt-2 text-left text-xs text-primary hover:underline"
              >
                {t("Manage channels")}
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
