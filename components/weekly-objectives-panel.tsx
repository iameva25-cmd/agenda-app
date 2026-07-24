"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  createObjective,
  deleteObjective,
  toggleObjectiveDone,
  updateObjectiveText,
} from "@/lib/actions/objectives";
import { TaskCheckbox } from "@/components/task-checkbox";
import { useTranslation } from "@/lib/i18n/context";
import type { weeklyObjective } from "@/db/schema";

type Objective = typeof weeklyObjective.$inferSelect;

export function WeeklyObjectivesPanel({
  weekStartDate,
  objectives,
}: {
  weekStartDate: string;
  objectives: Objective[];
}) {
  const router = useRouter();
  const { t } = useTranslation();
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    if (!window.confirm(t("Are you sure you want to delete this objective?"))) return;
    await deleteObjective(id);
    router.refresh();
  }

  return (
    <div>
      {adding ? (
        <form
          action={(formData) => {
            createObjective(weekStartDate, formData).then(() => router.refresh());
            setAdding(false);
          }}
          className="mt-4 flex items-center gap-2"
        >
          <input
            name="text"
            autoFocus
            placeholder={t("Write an objective...")}
            required
            className="flex-1 rounded-lg border border-border/60 bg-transparent px-3 py-1.5 text-sm outline-none focus:border-primary"
          />
          <button
            type="submit"
            className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground"
          >
            {t("Save")}
          </button>
          <button
            type="button"
            onClick={() => setAdding(false)}
            className="rounded-lg border border-border/60 px-3 py-1.5 text-sm"
          >
            {t("Cancel")}
          </button>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="mt-4 flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-muted-foreground hover:bg-muted"
        >
          {t("+ Add objective")}
        </button>
      )}

      {objectives.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">{t("No objectives for this week.")}</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-2">
          {objectives.map((obj) =>
            editingId === obj.id ? (
              <li key={obj.id}>
                <form
                  action={(formData) => {
                    const text = (formData.get("text") as string)?.trim();
                    setEditingId(null);
                    if (text && text !== obj.text) {
                      updateObjectiveText(obj.id, text).then(() => router.refresh());
                    }
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    name="text"
                    autoFocus
                    defaultValue={obj.text}
                    required
                    onKeyDown={(e) => {
                      if (e.key === "Escape") setEditingId(null);
                    }}
                    className="flex-1 rounded-lg border border-border/60 bg-transparent px-3 py-1.5 text-sm outline-none focus:border-primary"
                  />
                  <button
                    type="submit"
                    className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground"
                  >
                    {t("Save")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    className="rounded-lg border border-border/60 px-3 py-1.5 text-sm"
                  >
                    {t("Cancel")}
                  </button>
                </form>
              </li>
            ) : (
              <li key={obj.id} className="group flex items-center gap-2.5">
                <TaskCheckbox
                  checked={obj.done}
                  onToggle={() =>
                    toggleObjectiveDone(obj.id, obj.done).then(() => router.refresh())
                  }
                  size="sm"
                />
                <span
                  className={`flex-1 text-sm ${obj.done ? "text-muted-foreground line-through" : ""}`}
                >
                  {obj.text}
                </span>
                <div className="flex max-w-0 items-center gap-2 overflow-hidden opacity-0 transition-all duration-150 group-hover:max-w-[100px] group-hover:opacity-100 group-focus-within:max-w-[100px] group-focus-within:opacity-100">
                  <button
                    type="button"
                    onClick={() => setEditingId(obj.id)}
                    className="shrink-0 text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {t("Edit")}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(obj.id)}
                    className="shrink-0 text-sm text-red-600 hover:underline dark:text-red-400"
                  >
                    {t("Delete")}
                  </button>
                </div>
              </li>
            ),
          )}
        </ul>
      )}
    </div>
  );
}
