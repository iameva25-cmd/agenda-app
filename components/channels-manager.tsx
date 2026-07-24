"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  createChannel,
  createContext,
  deleteChannel,
  deleteContext,
  toggleChannelEnabled,
  updateChannel,
  updateContext,
} from "@/lib/actions/channels";
import {
  CATEGORY_COLORS,
  CATEGORY_COLOR_CLASSES,
  resolveChannelColor,
} from "@/lib/category-colors";
import { useTranslation } from "@/lib/i18n/context";
import type { channel, context } from "@/db/schema";

type Channel = typeof channel.$inferSelect;
type ContextWithChannels = typeof context.$inferSelect & { channels: Channel[] };

function ColorSwatchPicker({
  value,
  onChange,
  allowInherit = false,
}: {
  value: string | null;
  onChange: (color: string | null) => void;
  allowInherit?: boolean;
}) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {allowInherit && (
        <button
          type="button"
          onClick={() => onChange(null)}
          aria-label={t("Follow context color")}
          title={t("Follow context color (default)")}
          className={`flex h-5 w-5 items-center justify-center rounded-full border-2 border-dashed border-muted-foreground text-[10px] leading-none text-muted-foreground ${
            value === null ? "ring-2 ring-foreground ring-offset-2 ring-offset-background" : ""
          }`}
        >
          –
        </button>
      )}
      {CATEGORY_COLORS.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          aria-label={c}
          className={`h-5 w-5 rounded-full ${CATEGORY_COLOR_CLASSES[c].swatch} ${
            value === c ? "ring-2 ring-foreground ring-offset-2 ring-offset-background" : ""
          }`}
        />
      ))}
    </div>
  );
}

function CreateContextForm({ onDone }: { onDone: () => void }) {
  const router = useRouter();
  const { t } = useTranslation();
  const [color, setColor] = useState<string | null>(CATEGORY_COLORS[0]);

  return (
    <form
      action={(formData) => {
        formData.set("color", color ?? CATEGORY_COLORS[0]);
        createContext(formData).then(() => router.refresh());
        onDone();
      }}
      className="flex flex-col gap-3 rounded-lg border border-border/60 bg-background p-3 shadow-sm"
    >
      <input
        name="name"
        autoFocus
        placeholder={t("Context name (e.g. work)")}
        required
        className="rounded-lg border border-border/60 bg-transparent px-3 py-1.5 text-sm outline-none focus:border-primary"
      />
      <div className="flex items-center justify-between">
        <ColorSwatchPicker value={color} onChange={setColor} />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onDone}
            className="rounded-full border border-border/60 px-4 py-1.5 text-sm"
          >
            {t("Cancel")}
          </button>
          <button
            type="submit"
            className="rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground"
          >
            {t("Create")}
          </button>
        </div>
      </div>
    </form>
  );
}

function CreateChannelForm({
  contexts,
  defaultContextId,
  onDone,
}: {
  contexts: ContextWithChannels[];
  defaultContextId?: string;
  onDone: () => void;
}) {
  const router = useRouter();
  const { t } = useTranslation();
  const [color, setColor] = useState<string | null>(null);
  const [isPrivate, setIsPrivate] = useState(false);

  return (
    <form
      action={(formData) => {
        formData.set("isPrivate", isPrivate ? "true" : "false");
        createChannel(formData).then(() => router.refresh());
        onDone();
      }}
      className="flex flex-col gap-3 rounded-lg border border-border/60 bg-background p-3 shadow-sm"
    >
      <div className="flex flex-wrap items-center gap-2">
        <input
          name="name"
          autoFocus
          placeholder={t("Channel name (e.g. marketing)")}
          required
          className="min-w-[160px] flex-1 rounded-lg border border-border/60 bg-transparent px-3 py-1.5 text-sm outline-none focus:border-primary"
        />
        {defaultContextId ? (
          <input type="hidden" name="contextId" value={defaultContextId} />
        ) : (
          <select
            name="contextId"
            className="rounded-lg border border-border/60 bg-transparent px-2 py-1.5 text-sm outline-none focus:border-primary"
          >
            {contexts.map((ctx) => (
              <option key={ctx.id} value={ctx.id}>
                {ctx.name}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="flex items-center justify-between">
        <ColorSwatchPicker value={color} onChange={setColor} allowInherit />
        <input type="hidden" name="color" value={color ?? ""} />

        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={isPrivate}
            onChange={(e) => setIsPrivate(e.target.checked)}
            className="h-4 w-4"
          />
          {t("Private")}
        </label>
      </div>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onDone}
          className="rounded-full border border-border/60 px-4 py-1.5 text-sm"
        >
          {t("Cancel")}
        </button>
        <button
          type="submit"
          className="rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground"
        >
          {t("Create")}
        </button>
      </div>
    </form>
  );
}

function ChannelRow({ ch, contextColor }: { ch: Channel; contextColor: string }) {
  const router = useRouter();
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(ch.name);
  const [color, setColor] = useState<string | null>(ch.color);
  const resolvedColor = resolveChannelColor(ch.color, contextColor);

  if (isEditing) {
    return (
      <form
        action={(formData) => {
          updateChannel(ch.id, formData).then(() => router.refresh());
          setIsEditing(false);
        }}
        className="flex flex-col gap-2 px-3 py-2.5"
      >
        <div className="flex items-center gap-2">
          <input
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="flex-1 rounded border border-border/60 bg-transparent px-2 py-1 text-sm outline-none focus:border-primary"
          />
          <button type="submit" className="text-sm font-medium text-primary">
            {t("Save")}
          </button>
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="text-sm text-muted-foreground"
          >
            {t("Cancel")}
          </button>
        </div>
        <input type="hidden" name="color" value={color ?? ""} />
        <ColorSwatchPicker value={color} onChange={setColor} allowInherit />
      </form>
    );
  }

  return (
    <div className="flex items-center justify-between px-3 py-2.5">
      <span className="flex items-center gap-2 text-sm">
        {ch.isPrivate ? (
          <span className="text-muted-foreground">🔒</span>
        ) : (
          <span className={CATEGORY_COLOR_CLASSES[resolvedColor]?.text ?? "text-primary"}>#</span>
        )}
        {ch.name}
      </span>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => {
            setName(ch.name);
            setColor(ch.color);
            setIsEditing(true);
          }}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          {t("Edit")}
        </button>
        <button
          type="button"
          onClick={() => deleteChannel(ch.id).then(() => router.refresh())}
          className="text-xs text-red-600 hover:underline dark:text-red-400"
        >
          {t("Delete")}
        </button>
        <button
          type="button"
          onClick={() => toggleChannelEnabled(ch.id, ch.enabled).then(() => router.refresh())}
          role="switch"
          aria-checked={ch.enabled}
          className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
            ch.enabled ? "bg-primary" : "bg-muted"
          }`}
        >
          <span
            className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
              ch.enabled ? "translate-x-4" : "translate-x-0"
            }`}
          />
        </button>
      </div>
    </div>
  );
}

function ContextHeader({ ctx }: { ctx: ContextWithChannels }) {
  const router = useRouter();
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(ctx.name);
  const [color, setColor] = useState<string | null>(ctx.color);

  if (isEditing) {
    return (
      <form
        action={(formData) => {
          updateContext(ctx.id, formData).then(() => router.refresh());
          setIsEditing(false);
        }}
        className="flex flex-wrap items-center gap-2 rounded-lg border border-border/60 bg-background p-2"
      >
        <input
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="rounded border border-border/60 bg-transparent px-2 py-1 text-sm outline-none focus:border-primary"
        />
        <input type="hidden" name="color" value={color ?? ctx.color} />
        <ColorSwatchPicker value={color} onChange={setColor} />
        <div className="flex gap-2">
          <button type="submit" className="text-sm font-medium text-primary">
            {t("Save")}
          </button>
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="text-sm text-muted-foreground"
          >
            {t("Cancel")}
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <p
        className={`flex items-center gap-2 text-base font-semibold ${
          CATEGORY_COLOR_CLASSES[ctx.color]?.text ?? "text-foreground"
        }`}
      >
        <span>#</span>
        {ctx.name}
      </p>
      <button
        type="button"
        onClick={() => {
          setName(ctx.name);
          setColor(ctx.color);
          setIsEditing(true);
        }}
        className="text-xs text-muted-foreground hover:text-foreground"
      >
        {t("Edit")}
      </button>
      <button
        type="button"
        onClick={() => {
          const message =
            ctx.channels.length > 0
              ? t('Delete context "{name}"? {count} channel(s) inside it will also be deleted.', {
                  name: ctx.name,
                  count: ctx.channels.length,
                })
              : t('Delete context "{name}"?', { name: ctx.name });
          if (!window.confirm(message)) return;
          deleteContext(ctx.id).then(() => router.refresh());
        }}
        className="text-xs text-red-600 hover:underline dark:text-red-400"
      >
        {t("Delete")}
      </button>
    </div>
  );
}

export function ChannelsManager({ contexts }: { contexts: ContextWithChannels[] }) {
  const { t } = useTranslation();
  const [creatingContext, setCreatingContext] = useState(false);
  const [creatingGlobalChannel, setCreatingGlobalChannel] = useState(false);
  const [creatingChannelFor, setCreatingChannelFor] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => setCreatingContext(true)}
          className="rounded-full border border-border/60 px-4 py-2 text-sm font-medium hover:bg-muted"
        >
          {t("Create Context")}
        </button>
        <button
          type="button"
          onClick={() => setCreatingGlobalChannel(true)}
          className="rounded-full border border-border/60 px-4 py-2 text-sm font-medium hover:bg-muted"
        >
          {t("Create Channel")}
        </button>
      </div>

      {creatingContext && <CreateContextForm onDone={() => setCreatingContext(false)} />}
      {creatingGlobalChannel && (
        <CreateChannelForm contexts={contexts} onDone={() => setCreatingGlobalChannel(false)} />
      )}

      {contexts.map((ctx) => (
        <div key={ctx.id}>
          <ContextHeader ctx={ctx} />

          {ctx.channels.length > 0 && (
            <div className="mt-2 flex flex-col divide-y divide-border/50 rounded-lg border border-border/60">
              {ctx.channels.map((ch) => (
                <ChannelRow key={ch.id} ch={ch} contextColor={ctx.color} />
              ))}
            </div>
          )}

          {creatingChannelFor === ctx.id ? (
            <div className="mt-2">
              <CreateChannelForm
                contexts={contexts}
                defaultContextId={ctx.id}
                onDone={() => setCreatingChannelFor(null)}
              />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setCreatingChannelFor(ctx.id)}
              className="mt-2 text-sm text-primary hover:underline"
            >
              {t("+ Create channel in {context}", { context: ctx.name })}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
