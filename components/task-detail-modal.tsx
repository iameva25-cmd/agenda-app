"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Repeat, Copy, Trash2, ChevronLeft, Check } from "lucide-react";
import {
  deleteTask,
  duplicateTask,
  setTaskDate,
  setTaskDueDate,
  setTaskRepeatRule,
  setTaskWeeklyObjective,
  toggleTaskStatus,
  updateTask,
} from "@/lib/actions/tasks";
import { createComment, getCommentsForTask } from "@/lib/actions/comments";
import { formatDurationMinutes, formatDurationSeconds } from "@/lib/time";
import { TaskCheckbox } from "@/components/task-checkbox";
import { ChannelPicker } from "@/components/channel-picker";
import { PriorityPicker } from "@/components/priority-picker";
import { ObjectivePicker } from "@/components/objective-picker";
import { DatePickerPopover } from "@/components/date-picker-popover";
import { useTranslation } from "@/lib/i18n/context";
import type { Locale } from "@/lib/i18n/dictionary";
import { translate } from "@/lib/i18n/dictionary";
import type { channel, context, task } from "@/db/schema";

type Task = typeof task.$inferSelect;
type Channel = typeof channel.$inferSelect;
type ContextWithChannels = typeof context.$inferSelect & { channels: Channel[] };
type Subtask = { id: string; taskId: string; title: string; done: boolean };
type Comment = { id: string; text: string; createdAt: Date; userName: string };

const WEEKDAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const WEEKDAY_LABELS: Record<string, string> = {
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
  sun: "Sun",
};

function repeatLabel(rule: string | null, t: (key: string) => string) {
  if (!rule) return t("Does not repeat");
  if (rule === "daily") return t("Daily");
  if (rule === "weekly") return t("Weekly");
  if (rule.startsWith("custom:")) return t("Custom days");
  return t("Does not repeat");
}

function formatRelativeTime(date: Date, locale: Locale) {
  const diffMin = Math.floor((Date.now() - date.getTime()) / 60000);
  if (diffMin < 1) return translate("just now", locale);
  if (diffMin < 60) return translate("{n}m ago", locale, { n: diffMin });
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return translate("{n}h ago", locale, { n: diffHour });
  return translate("{n}d ago", locale, { n: Math.floor(diffHour / 24) });
}

// Textarea auto-grow: tinggi kotak ikut nambah sesuai panjang teks, dipakai
// untuk Notes & Comment supaya tidak perlu scroll di dalam kotak kecil.
// maxHeight opsional (dipakai Notes, dibatasi 50% tinggi layar) — kalau isinya
// lebih panjang dari itu, textarea berhenti tumbuh dan muncul scrollbar sendiri.
function autoGrow(el: HTMLTextAreaElement, maxHeight?: number) {
  el.style.height = "auto";
  if (maxHeight && el.scrollHeight > maxHeight) {
    el.style.height = `${maxHeight}px`;
    el.style.overflowY = "auto";
  } else {
    el.style.height = `${el.scrollHeight}px`;
    el.style.overflowY = "hidden";
  }
}

export function TaskDetailModal({
  task,
  isTimerRunning,
  actualSeconds,
  onToggleTimer,
  subtasks,
  onAddSubtask,
  onToggleSubtask,
  contexts,
  onSelectChannel,
  onSelectContext,
  onSelectPriority,
  onClose,
}: {
  task: Task;
  isTimerRunning: boolean;
  actualSeconds: number;
  onToggleTimer: () => void;
  subtasks: Subtask[];
  onAddSubtask: (formData: FormData) => void;
  onToggleSubtask: (sub: Subtask) => void;
  contexts: ContextWithChannels[];
  onSelectChannel: (channelId: string | null) => void;
  onSelectContext: (contextId: string) => void;
  onSelectPriority: (priority: string) => void;
  onClose: () => void;
}) {
  const router = useRouter();
  const { t, locale } = useTranslation();
  const isDone = task.status === "done";

  function saveField(field: "title" | "description", value: string) {
    const formData = new FormData();
    formData.set("title", field === "title" ? value : task.title);
    if (field === "description") formData.set("description", value);
    if (formData.get("title")) updateTask(task.id, formData);
  }

  const newSubtaskInputRef = useRef<HTMLInputElement>(null);

  // Menu "..." (Other actions) + submenu Repeat.
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const [menuView, setMenuView] = useState<"main" | "repeat">("main");
  const [customDays, setCustomDays] = useState<Set<string>>(() => {
    const existing = task.repeatRule?.startsWith("custom:") ? task.repeatRule.slice(7) : "";
    return new Set(existing ? existing.split(",") : []);
  });
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  function openMenu(e: React.MouseEvent) {
    e.stopPropagation();
    const rect = menuButtonRef.current?.getBoundingClientRect();
    if (rect) setMenuPos({ top: rect.bottom + 4, left: rect.left - 180 });
    setMenuView("main");
    setMenuOpen(true);
  }

  function closeMenu() {
    setMenuOpen(false);
    setMenuView("main");
  }

  async function pickRepeat(rule: string | null) {
    await setTaskRepeatRule(task.id, rule);
    router.refresh();
    closeMenu();
  }

  function toggleCustomDay(day: string) {
    setCustomDays((prev) => {
      const next = new Set(prev);
      if (next.has(day)) next.delete(day);
      else next.add(day);
      return next;
    });
  }

  async function applyCustomDays() {
    const rule = customDays.size > 0 ? `custom:${Array.from(customDays).join(",")}` : null;
    await setTaskRepeatRule(task.id, rule);
    router.refresh();
    closeMenu();
  }

  async function handleDuplicate() {
    await duplicateTask(task.id);
    router.refresh();
    closeMenu();
    onClose();
  }

  async function handleDelete() {
    if (!window.confirm(t("Are you sure you want to delete this task?"))) return;
    await deleteTask(task.id);
    router.refresh();
    closeMenu();
    onClose();
  }

  useEffect(() => {
    if (!menuOpen) return;
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") closeMenu();
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [menuOpen]);

  // Comments — di-fetch sendiri di sini (tidak perlu di-share ke TaskCard
  // seperti subtasks, karena tidak ada badge jumlah komentar di card).
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");
  const commentInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    getCommentsForTask(task.id).then(setComments);
  }, [task.id]);

  async function handleSubmitComment(formData: FormData) {
    const text = (formData.get("text") as string)?.trim();
    if (!text) return;
    setCommentText("");
    if (commentInputRef.current) autoGrow(commentInputRef.current);
    await createComment(task.id, formData);
    getCommentsForTask(task.id).then(setComments);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[700px] rounded-2xl bg-background p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header row */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t("Channel")}
            </p>
            <div className="mt-1">
              <ChannelPicker
                contexts={contexts}
                channelId={task.channelId}
                contextId={task.contextId}
                fallbackLabel={task.channel}
                onSelectChannel={onSelectChannel}
                onSelectContext={onSelectContext}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <PriorityPicker value={task.priority} onChange={onSelectPriority} showLabel />

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t("Start")}
              </p>
              <DatePickerPopover
                value={task.date}
                onSelect={(d) => {
                  setTaskDate(task.id, d);
                  router.refresh();
                }}
                placeholder={t("Start")}
                className="mt-0.5 flex items-center gap-1 text-sm hover:text-primary"
              />
            </div>

            <DatePickerPopover
              value={task.dueDate}
              onSelect={(d) => {
                setTaskDueDate(task.id, d);
                router.refresh();
              }}
              placeholder={t("Due")}
              allowClear
              onClear={() => {
                setTaskDueDate(task.id, null);
                router.refresh();
              }}
            />

            <button
              type="button"
              onClick={() => newSubtaskInputRef.current?.focus()}
              className="rounded-full border border-border/60 px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {t("+ Subtasks")}
            </button>

            <button
              ref={menuButtonRef}
              type="button"
              onClick={openMenu}
              title={t("Other actions")}
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>

            <button
              type="button"
              disabled
              title={t("Expand — coming soon")}
              className="text-muted-foreground/70"
            >
              ⛶
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label={t("Close")}
              className="rounded-full p-1 text-muted-foreground hover:bg-muted"
            >
              ✕
            </button>
          </div>
        </div>

        {menuOpen && menuPos && (
          <div className="fixed inset-0 z-40" onClick={closeMenu}>
            <div
              className="absolute z-50 w-56 rounded-lg border border-border/60 bg-background p-2 shadow-2xl ring-1 ring-black/5"
              style={{ top: menuPos.top, left: menuPos.left }}
              onClick={(e) => e.stopPropagation()}
            >
              {menuView === "main" ? (
                <>
                  <p className="px-2 py-1 text-[11px] font-semibold uppercase text-muted-foreground/70">
                    {t("Other actions")}
                  </p>
                  <button
                    type="button"
                    onClick={() => setMenuView("repeat")}
                    className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-muted"
                  >
                    <Repeat className="h-3.5 w-3.5" />
                    {t("Repeat")}
                    <span className="ml-auto truncate text-xs text-muted-foreground">
                      {repeatLabel(task.repeatRule, t)}
                    </span>
                  </button>
                  <ObjectivePicker
                    dateStr={task.date}
                    weeklyObjectiveId={task.weeklyObjectiveId}
                    onSelect={(id) => {
                      setTaskWeeklyObjective(task.id, id);
                      router.refresh();
                      closeMenu();
                    }}
                    triggerClassName="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-muted"
                  />
                  <button
                    type="button"
                    onClick={handleDuplicate}
                    className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-muted"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    {t("Duplicate")}
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm text-red-600 hover:bg-muted dark:text-red-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    {t("Delete")}
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setMenuView("main")}
                    className="flex items-center gap-1 rounded px-1.5 py-1 text-left text-xs text-muted-foreground hover:text-foreground"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    {t("Repeat")}
                  </button>
                  <button
                    type="button"
                    onClick={() => pickRepeat(null)}
                    className="mt-1 flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-sm hover:bg-muted"
                  >
                    {t("Does not repeat")}
                    {!task.repeatRule && <Check className="h-3.5 w-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => pickRepeat("daily")}
                    className="flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-sm hover:bg-muted"
                  >
                    {t("Daily")}
                    {task.repeatRule === "daily" && <Check className="h-3.5 w-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => pickRepeat("weekly")}
                    className="flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-sm hover:bg-muted"
                  >
                    {t("Weekly")}
                    {task.repeatRule === "weekly" && <Check className="h-3.5 w-3.5" />}
                  </button>

                  <p className="mt-2 border-t border-border/50 px-2 pt-2 text-xs font-medium text-muted-foreground">
                    {t("Custom days")}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-1 px-2">
                    {WEEKDAY_KEYS.map((day) => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleCustomDay(day)}
                        className={`h-7 w-9 rounded text-xs font-medium ${
                          customDays.has(day)
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {t(WEEKDAY_LABELS[day])}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={applyCustomDays}
                    className="mt-2 w-full rounded-lg bg-primary px-2 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90"
                  >
                    {t("Apply")}
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Judul + Timer */}
        <div className="mt-5 flex items-center gap-3 border-t border-border/50 pt-5">
          <TaskCheckbox
            checked={isDone}
            onToggle={() => toggleTaskStatus(task.id, task.status)}
            size="lg"
          />

          <input
            key={task.title}
            defaultValue={task.title}
            onBlur={(e) => saveField("title", e.target.value.trim())}
            className={`flex-1 bg-transparent text-xl font-semibold outline-none ${
              isDone ? "text-muted-foreground line-through" : ""
            }`}
          />

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={onToggleTimer}
              title={isTimerRunning ? t("Pause timer") : t("Start timer")}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-border/60 text-foreground transition-colors hover:bg-muted"
            >
              {isTimerRunning ? "⏸" : "▶"}
            </button>
            <div className="text-right">
              <p className="text-[10px] font-semibold uppercase text-muted-foreground">
                {t("Actual")}
              </p>
              <p className="text-sm font-medium">{formatDurationSeconds(actualSeconds)}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-semibold uppercase text-muted-foreground">
                {t("Planned")}
              </p>
              <p className="text-sm font-medium">
                {formatDurationMinutes(task.estimatedMinutes ?? 0)}
              </p>
            </div>
          </div>
        </div>

        {/* Subtasks */}
        <div className="mt-4 flex flex-col gap-2">
          {subtasks.map((sub) => (
            <div key={sub.id} className="flex items-center gap-2.5">
              <TaskCheckbox
                checked={sub.done}
                onToggle={() => onToggleSubtask(sub)}
                size="sm"
              />
              <span
                className={`text-sm ${
                  sub.done ? "text-muted-foreground line-through" : ""
                }`}
              >
                {sub.title}
              </span>
            </div>
          ))}

          <form
            action={(formData) => {
              onAddSubtask(formData);
              newSubtaskInputRef.current!.value = "";
            }}
            className="flex items-center gap-2.5"
          >
            <span className="h-4 w-4 shrink-0" />
            <input
              ref={newSubtaskInputRef}
              name="title"
              placeholder={t("+ Add subtask")}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </form>
        </div>

        {/* Notes — auto-grow, dibatasi maksimal 50% tinggi layar lalu scroll */}
        <textarea
          key={task.description}
          defaultValue={task.description ?? ""}
          onBlur={(e) => saveField("description", e.target.value.trim())}
          onInput={(e) => autoGrow(e.currentTarget, window.innerHeight * 0.5)}
          ref={(el) => {
            if (el) autoGrow(el, window.innerHeight * 0.5);
          }}
          placeholder={t("Notes...")}
          rows={4}
          className="mt-4 w-full resize-none overflow-hidden rounded-lg border border-border/60 bg-transparent px-3 py-2 text-sm outline-none focus:border-primary"
        />

        {/* Comment section */}
        <div className="mt-5 border-t border-border/50 pt-4">
          {comments.length > 0 && (
            <div className="mb-3 flex flex-col gap-3">
              {comments.map((c) => (
                <div key={c.id} className="flex items-start gap-2">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm">
                    🙂
                  </span>
                  <div className="flex-1 rounded-lg bg-muted/60 px-3 py-2">
                    <p className="text-xs font-medium">
                      {c.userName}{" "}
                      <span className="font-normal text-muted-foreground">
                        · {formatRelativeTime(new Date(c.createdAt), locale)}
                      </span>
                    </p>
                    <p className="mt-0.5 whitespace-pre-wrap text-sm">{c.text}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <form
            action={(formData) => handleSubmitComment(formData)}
            className="flex items-start gap-2"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm">
              🙂
            </span>
            <textarea
              ref={commentInputRef}
              name="text"
              rows={1}
              value={commentText}
              onChange={(e) => {
                setCommentText(e.target.value);
                autoGrow(e.currentTarget);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  e.currentTarget.form?.requestSubmit();
                }
              }}
              placeholder={t("Comment...")}
              className="flex-1 resize-none overflow-hidden rounded-2xl border border-border/60 bg-transparent px-3 py-2 text-sm outline-none focus:border-primary"
            />
            <button
              type="button"
              disabled
              title={t("Attach file — coming soon")}
              className="mt-1.5 text-muted-foreground/70"
            >
              📎
            </button>
          </form>
          <p className="mt-3 text-xs text-muted-foreground">
            {t("You created this task · {time}", {
              time: formatRelativeTime(new Date(task.createdAt), locale),
            })}
          </p>
        </div>
      </div>
    </div>
  );
}
