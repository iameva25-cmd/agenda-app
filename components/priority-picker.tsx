"use client";

import { useEffect, useRef, useState } from "react";
import { Flag, Check } from "lucide-react";
import { useTranslation } from "@/lib/i18n/context";

export const PRIORITIES = [
  {
    value: "urgent",
    label: "Urgent",
    flagColor: "text-red-500",
    badgeClass: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400",
  },
  {
    value: "priority",
    label: "Priority",
    flagColor: "text-purple-500",
    badgeClass: "bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400",
  },
  {
    value: "normal",
    label: "Normal",
    flagColor: "text-zinc-400",
    badgeClass: "",
  },
  {
    value: "low",
    label: "Low Priority",
    flagColor: "text-zinc-300",
    badgeClass: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800/60 dark:text-zinc-400",
  },
];

// Dipakai di blok timeline (day-calendar.tsx) yang sempit — cuma tampilkan
// icon bendera untuk 2 priority paling menonjol ini, Normal & Low tidak
// dikasih bendera sama sekali di tampilan ringkas ini.
export const CARD_FLAG_PRIORITIES = ["urgent", "priority"];

export function PriorityPicker({
  value,
  onChange,
  showLabel = false,
}: {
  value: string;
  onChange: (value: string) => void;
  showLabel?: boolean;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const selected = PRIORITIES.find((p) => p.value === value) ?? PRIORITIES[2];

  function handleOpen(e: React.MouseEvent) {
    e.stopPropagation();
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) setPosition({ top: rect.bottom + 4, left: rect.left });
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

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={handleOpen}
        className={
          showLabel
            ? "flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
            : "hover:text-foreground"
        }
      >
        <Flag className={`h-3.5 w-3.5 ${selected.flagColor}`} />
        {showLabel && <span>{t(selected.label)}</span>}
      </button>

      {open && position && (
        <div
          className="fixed inset-0 z-40"
          onClick={(e) => {
            e.stopPropagation();
            setOpen(false);
          }}
        >
          <div
            className="absolute z-50 w-48 rounded-lg border border-border/60 bg-background p-3 shadow-2xl ring-1 ring-black/5"
            style={{ top: position.top, left: position.left }}
            onClick={(e) => e.stopPropagation()}
          >
            <p className="px-1 text-[11px] font-semibold uppercase text-muted-foreground/70">
              {t("Daily Priority")}
            </p>
            <ul className="mt-1 flex flex-col">
              {PRIORITIES.map((p) => (
                <li key={p.value}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(p.value);
                      setOpen(false);
                    }}
                    className="flex w-full items-center justify-between rounded px-1.5 py-1 text-left text-xs hover:bg-muted"
                  >
                    <span className="flex items-center gap-1.5">
                      <Flag className={`h-3.5 w-3.5 ${p.flagColor}`} />
                      {t(p.label)}
                    </span>
                    {value === p.value && <Check className="h-3.5 w-3.5" />}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
