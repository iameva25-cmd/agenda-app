"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Hash, Lock, Check } from "lucide-react";
import { CATEGORY_COLOR_CLASSES, resolveChannelColor } from "@/lib/category-colors";
import { useTranslation } from "@/lib/i18n/context";
import type { channel, context } from "@/db/schema";

type Channel = typeof channel.$inferSelect;
type ContextWithChannels = typeof context.$inferSelect & { channels: Channel[] };

export function ChannelPicker({
  contexts,
  channelId,
  contextId,
  fallbackLabel,
  onSelectChannel,
  onSelectContext,
}: {
  contexts: ContextWithChannels[];
  channelId: string | null;
  contextId: string | null;
  fallbackLabel?: string | null;
  onSelectChannel: (channelId: string | null) => void;
  onSelectContext: (contextId: string) => void;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const allChannels = contexts.flatMap((ctx) =>
    ctx.channels.map((ch) => ({ ...ch, resolvedColor: resolveChannelColor(ch.color, ctx.color) })),
  );
  const selectedChannel = allChannels.find((c) => c.id === channelId) ?? null;
  const selectedContext = selectedChannel
    ? null
    : (contexts.find((c) => c.id === contextId) ?? null);

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
      // Channel yang di-disable disembunyikan dari daftar pilihan baru, kecuali
      // memang lagi jadi channel yang sudah dipakai task ini (supaya tetap
      // kelihatan, tidak "hilang" tiba-tiba dari tampilan).
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

  const triggerLabel = selectedChannel
    ? `#${selectedChannel.name}`
    : selectedContext
      ? `#${selectedContext.name}`
      : fallbackLabel
        ? `#${fallbackLabel}`
        : t("+ category");

  const triggerColorClass = selectedChannel
    ? (CATEGORY_COLOR_CLASSES[selectedChannel.resolvedColor]?.text ?? "text-muted-foreground")
    : selectedContext
      ? (CATEGORY_COLOR_CLASSES[selectedContext.color]?.text ?? "text-muted-foreground")
      : fallbackLabel
        ? "text-orange-600 dark:text-orange-400"
        : "text-muted-foreground hover:text-foreground";

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={handleOpen}
        className={`text-xs font-medium ${triggerColorClass}`}
      >
        {triggerLabel}
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
            className="absolute z-50 w-64 rounded-lg border border-border/60 bg-background p-3 shadow-2xl ring-1 ring-black/5"
            style={{ top: position.top, left: position.left }}
            onClick={(e) => e.stopPropagation()}
          >
            <p className="px-1 text-xs font-medium text-muted-foreground">
              {t("Assign to channel:")}
            </p>
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("Search...")}
              className="mt-1 w-full rounded border border-border/60 bg-transparent px-2 py-1 text-xs outline-none focus:border-primary"
            />

            <div className="mt-2 max-h-64 overflow-y-auto">
              {"unassigned".includes(searchLower) && (
                <button
                  type="button"
                  onClick={() => {
                    onSelectChannel(null);
                    setOpen(false);
                  }}
                  className="flex w-full items-center justify-between rounded px-1.5 py-1 text-left text-xs text-muted-foreground hover:bg-muted"
                >
                  <span className="flex items-center gap-1.5">
                    <Hash className="h-3 w-3" />
                    {t("Unassigned")}
                  </span>
                  {!channelId && !contextId && <Check className="h-3.5 w-3.5" />}
                </button>
              )}

              {filteredContexts.map((ctx) => (
                <div key={ctx.id} className="mt-1">
                  <button
                    type="button"
                    onClick={() => {
                      onSelectContext(ctx.id);
                      setOpen(false);
                    }}
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
                        onClick={() => {
                          onSelectChannel(ch.id);
                          setOpen(false);
                        }}
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

            <Link
              href="/settings/channels"
              onClick={() => setOpen(false)}
              className="mt-2 block w-full border-t border-border/50 pt-2 text-left text-xs text-primary hover:underline"
            >
              {t("Manage channels")}
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
