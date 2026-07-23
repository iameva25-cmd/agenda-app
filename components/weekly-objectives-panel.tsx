"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createObjective, toggleObjectiveDone } from "@/lib/actions/objectives";
import { TaskCheckbox } from "@/components/task-checkbox";
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
  const [adding, setAdding] = useState(false);

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
            placeholder="Tulis objective..."
            required
            className="flex-1 rounded-lg border border-border/60 bg-transparent px-3 py-1.5 text-sm outline-none focus:border-primary"
          />
          <button
            type="submit"
            className="rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground"
          >
            Simpan
          </button>
          <button
            type="button"
            onClick={() => setAdding(false)}
            className="rounded-lg border border-border/60 px-3 py-1.5 text-sm"
          >
            Batal
          </button>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="mt-4 flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-muted-foreground hover:bg-muted"
        >
          + Add objective
        </button>
      )}

      {objectives.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">No objectives for this week.</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-2">
          {objectives.map((obj) => (
            <li key={obj.id} className="flex items-center gap-2.5">
              <TaskCheckbox
                checked={obj.done}
                onToggle={() =>
                  toggleObjectiveDone(obj.id, obj.done).then(() => router.refresh())
                }
                size="sm"
              />
              <span
                className={`text-sm ${obj.done ? "text-muted-foreground line-through" : ""}`}
              >
                {obj.text}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
