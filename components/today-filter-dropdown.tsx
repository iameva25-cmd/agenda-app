"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Hash, Lock, Check, Flag } from "lucide-react";
import { CATEGORY_COLOR_CLASSES, resolveChannelColor } from "@/lib/category-colors";
import { PRIORITIES } from "@/components/priority-picker";
import { useTranslation } from "@/lib/i18n/context";
import type { channel, context } from "@/db/schema";

type Channel = typeof channel.$inferSelect;
type ContextWithChannels = typeof context.$inferSelect & { channels: Channel[] };

// Dropdown "Filter" reusable — dipakai di /today dan /today/planning (Bagian
// 4 minta reuse, bukan dibikin ulang). Dua facet: channel/context DAN
// priority, dikombinasikan AND kalau dua-duanya di-set (mis. channel "work"
// + priority "urgent" => tampil task yang cocok DUA-duanya). Query param
// (channelId/contextId/priority) di basePath yang diberikan; param lain
// (misal ?date=) tetap dijaga.
export function TodayFilterDropdown({
  contexts,
  channelId,
  contextId,
  priority,
  basePath,
}: {
  contexts: ContextWithChannels[];
  channelId: string | null;
  contextId: string | null;
  priority: string | null;
  basePath: string;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  function updateParams(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value === null) params.delete(key);
      else params.set(key, value);
    }
    const qs = params.toString();
    router.push(`${basePath}${qs ? `?${qs}` : ""}`);
  }

  function handleOpen(e: React.MouseEvent) {
    e.stopPropagation();
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) setPosition({ top: rect.bottom + 4, left: rect.left });
    setSearch("");
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

  const searchLower = search.toLowerCase();
  const filteredContexts = contexts
    .map((ctx) => {
      const contextMatches = ctx.name.toLowerCase().includes(searchLower);
      const visibleChannels = ctx.channels.filter((ch) => ch.enabled || ch.id === channelId);
      return {
        ...ctx,
        channels: contextMatches
          ? visibleChannels
          : visibleChannels.filter((ch) => ch.name.toLowerCase().includes(searchLower)),
        contextMatches,
      };
    })
    .filter((ctx) => ctx.channels.length > 0 || ctx.contextMatches);

  const isActive = !!channelId || !!contextId || !!priority;

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={handleOpen}
        className={`flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm ${
          isActive
            ? "border-primary text-primary"
            : "border-border/60 text-muted-foreground hover:text-foreground"
        }`}
      >
        ☰ {t("Filter")}
        {isActive && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
      </button>

      {open && position && (
        <div className="fixed inset-0 z-40" onClick={() => setOpen(false)}>
          <div
            className="absolute z-50 w-64 rounded-lg border border-border/60 bg-background p-3 shadow-2xl ring-1 ring-black/5"
            style={{ top: position.top, left: position.left }}
            onClick={(e) => e.stopPropagation()}
          >
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("Search...")}
              className="w-full rounded border border-border/60 bg-transparent px-2 py-1 text-xs outline-none focus:border-primary"
            />

            <p className="mt-2 px-1 text-[11px] font-semibold uppercase text-muted-foreground/70">
              {t("Channel")}
            </p>
            <div className="mt-1 max-h-40 overflow-y-auto">
              {"all".includes(searchLower) && (
                <button
                  type="button"
                  onClick={() => updateParams({ channelId: null, contextId: null })}
                  className="flex w-full items-center justify-between rounded px-1.5 py-1 text-left text-xs text-muted-foreground hover:bg-muted"
                >
                  <span className="flex items-center gap-1.5">
                    <Hash className="h-3 w-3" />
                    {t("All")}
                  </span>
                  {!channelId && !contextId && <Check className="h-3.5 w-3.5" />}
                </button>
              )}

              {filteredContexts.map((ctx) => (
                <div key={ctx.id} className="mt-1">
                  <button
                    type="button"
                    onClick={() => updateParams({ contextId: ctx.id, channelId: null })}
                    className={`flex w-full items-center justify-between rounded px-1.5 py-1 text-left text-xs font-medium hover:bg-muted ${
                      CATEGORY_COLOR_CLASSES[ctx.color]?.text ?? "text-foreground"
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <Hash className="h-3 w-3" />
                      {ctx.name}
                    </span>
                    {!channelId && contextId === ctx.id && <Check className="h-3.5 w-3.5" />}
                  </button>
                  {ctx.channels.map((ch) => {
                    const resolvedColor = resolveChannelColor(ch.color, ctx.color);
                    return (
                      <button
                        key={ch.id}
                        type="button"
                        onClick={() => updateParams({ channelId: ch.id, contextId: null })}
                        className={`flex w-full items-center justify-between rounded px-1.5 py-1 pl-5 text-left text-xs hover:bg-muted ${
                          CATEGORY_COLOR_CLASSES[resolvedColor]?.text ?? ""
                        }`}
                      >
                        <span className="flex items-center gap-1.5">
                          {ch.isPrivate ? (
                            <Lock className="h-3 w-3 text-muted-foreground" />
                          ) : (
                            <Hash className="h-3 w-3" />
                          )}
                          {ch.name}
                        </span>
                        {channelId === ch.id && <Check className="h-3.5 w-3.5" />}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>

            <p className="mt-3 px-1 text-[11px] font-semibold uppercase text-muted-foreground/70">
              {t("Priority")}
            </p>
            <div className="mt-1">
              <button
                type="button"
                onClick={() => updateParams({ priority: null })}
                className="flex w-full items-center justify-between rounded px-1.5 py-1 text-left text-xs text-muted-foreground hover:bg-muted"
              >
                {t("All")}
                {!priority && <Check className="h-3.5 w-3.5" />}
              </button>
              {PRIORITIES.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => updateParams({ priority: p.value })}
                  className="flex w-full items-center justify-between rounded px-1.5 py-1 text-left text-xs hover:bg-muted"
                >
                  <span className="flex items-center gap-1.5">
                    <Flag className={`h-3.5 w-3.5 ${p.flagColor}`} />
                    {t(p.label)}
                  </span>
                  {priority === p.value && <Check className="h-3.5 w-3.5" />}
                </button>
              ))}
            </div>

            {isActive && (
              <button
                type="button"
                onClick={() => updateParams({ channelId: null, contextId: null, priority: null })}
                className="mt-2 w-full border-t border-border/50 pt-2 text-left text-xs text-muted-foreground hover:text-foreground"
              >
                {t("Clear filters")}
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
