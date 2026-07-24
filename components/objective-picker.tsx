"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Target, Check } from "lucide-react";
import { getObjectivesForWeek } from "@/lib/actions/objectives";
import { formatDate, getMondayOfWeek, parseDateString } from "@/lib/date";
import { useTranslation } from "@/lib/i18n/context";

type ObjectiveOption = { id: string; text: string };

// Icon Target reusable — dipakai di popup Add Task dan popup detail task
// ("..." > Align with objective) supaya satu sumber logic saja, bukan
// diduplikasi. `dateStr` dipakai untuk menentukan minggu objective yang
// relevan (task di masa depan align ke objective minggunya sendiri).
export function ObjectivePicker({
  dateStr,
  weeklyObjectiveId,
  onSelect,
  showLabel = false,
  triggerClassName,
}: {
  dateStr: string;
  weeklyObjectiveId: string | null;
  onSelect: (id: string | null) => void;
  showLabel?: boolean;
  triggerClassName?: string;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const [objectives, setObjectives] = useState<ObjectiveOption[]>([]);
  const [loading, setLoading] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  async function handleOpen(e: React.MouseEvent) {
    e.stopPropagation();
    if (open) {
      setOpen(false);
      return;
    }
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) setPosition({ top: rect.bottom + 4, left: rect.left });
    setOpen(true);
    setLoading(true);
    const weekStart = formatDate(getMondayOfWeek(parseDateString(dateStr)));
    const list = await getObjectivesForWeek(weekStart);
    setObjectives(list);
    setLoading(false);
  }

  useEffect(() => {
    if (!open) return;
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open]);

  function pick(id: string | null) {
    onSelect(id);
    setOpen(false);
  }

  const selectedObjective = objectives.find((o) => o.id === weeklyObjectiveId) ?? null;

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={handleOpen}
        title={t("Align with objective")}
        className={
          triggerClassName ??
          (showLabel
            ? `flex items-center gap-1.5 rounded-full border border-border/60 px-3 py-1.5 text-sm hover:text-foreground ${
                weeklyObjectiveId ? "text-primary" : "text-muted-foreground"
              }`
            : `flex items-center hover:text-foreground ${
                weeklyObjectiveId ? "text-primary" : ""
              }`)
        }
      >
        <Target className="h-3.5 w-3.5" />
        {(showLabel || triggerClassName) &&
          (selectedObjective ? selectedObjective.text : t("Align with objective"))}
      </button>

      {open && position && (
        <div className="fixed inset-0 z-40" onClick={() => setOpen(false)}>
          <div
            className="absolute z-50 w-64 rounded-lg border border-border/60 bg-background p-3 shadow-2xl ring-1 ring-black/5"
            style={{ top: position.top, left: position.left }}
            onClick={(e) => e.stopPropagation()}
          >
            <p className="px-1 text-xs font-medium text-muted-foreground">
              {t("Align with objective")}
            </p>

            <div className="mt-2 max-h-56 overflow-y-auto">
              {loading ? (
                <p className="px-1 py-2 text-xs text-muted-foreground">{t("Loading...")}</p>
              ) : objectives.length === 0 ? (
                <div className="px-1 py-2 text-xs text-muted-foreground">
                  <p>{t("No objectives set for this week")}</p>
                  <Link
                    href="/week/planning"
                    onClick={() => setOpen(false)}
                    className="mt-1 inline-block text-primary hover:underline"
                  >
                    {t("Go to Weekly Planning")}
                  </Link>
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => pick(null)}
                    className="flex w-full items-center justify-between rounded px-1.5 py-1 text-left text-xs text-muted-foreground hover:bg-muted"
                  >
                    {t("None")}
                    {weeklyObjectiveId === null && <Check className="h-3.5 w-3.5" />}
                  </button>
                  {objectives.map((obj) => (
                    <button
                      key={obj.id}
                      type="button"
                      onClick={() => pick(obj.id)}
                      className="flex w-full items-center justify-between gap-2 rounded px-1.5 py-1 text-left text-xs hover:bg-muted"
                    >
                      <span className="flex items-center gap-1.5 truncate">
                        <Target className="h-3 w-3 shrink-0 text-primary" />
                        <span className="truncate">{obj.text}</span>
                      </span>
                      {weeklyObjectiveId === obj.id && <Check className="h-3.5 w-3.5 shrink-0" />}
                    </button>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
