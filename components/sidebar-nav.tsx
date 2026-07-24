"use client";

import Link from "next/link";
import {
  Home,
  CalendarCheck,
  Moon,
  Star,
  CalendarRange,
  ClipboardList,
  CalendarDays,
  BarChart3,
  ChevronsLeft,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { LogoutButton } from "@/components/logout-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import { useTranslation } from "@/lib/i18n/context";

function NavLink({
  href,
  icon: Icon,
  label,
  active,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
        active
          ? "bg-primary/10 font-medium text-primary"
          : "text-muted-foreground hover:bg-muted"
      }`}
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </Link>
  );
}

export function SidebarNav({
  userName,
  current,
  onCollapse,
}: {
  userName: string;
  current:
    | "home"
    | "today"
    | "today-planning"
    | "today-shutdown"
    | "today-highlights"
    | "week-planning"
    | "week-review"
    | "month"
    | "analytics";
  onCollapse?: () => void;
}) {
  const { t } = useTranslation();

  return (
    <aside className="flex h-screen w-[220px] shrink-0 flex-col justify-between border-r border-border/60 bg-black/10 px-3 py-5">
      <div>
        <div className="flex items-center justify-between px-2">
          <Logo />
          {onCollapse && (
            <button
              type="button"
              onClick={onCollapse}
              aria-label={t("Hide sidebar")}
              className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <ChevronsLeft className="h-4 w-4" />
            </button>
          )}
        </div>

        <nav className="mt-8 flex flex-col gap-1">
          <NavLink
            href="/home"
            icon={Home}
            label={t("Home")}
            active={current === "home"}
          />
          <NavLink
            href="/today"
            icon={CalendarCheck}
            label={t("Today")}
            active={current === "today"}
          />
        </nav>

        <div className="mt-6">
          <p className="px-3 text-xs font-medium uppercase tracking-wide text-muted-foreground/70">
            {t("Day")}
          </p>
          <div className="mt-1 flex flex-col gap-1">
            <NavLink
              href="/today/planning"
              icon={CalendarCheck}
              label={t("Daily planning")}
              active={current === "today-planning"}
            />
            <NavLink
              href="/today/shutdown"
              icon={Moon}
              label={t("Daily shutdown")}
              active={current === "today-shutdown"}
            />
            <NavLink
              href="/today/highlights"
              icon={Star}
              label={t("Daily highlights")}
              active={current === "today-highlights"}
            />
          </div>
        </div>

        <div className="mt-6">
          <p className="px-3 text-xs font-medium uppercase tracking-wide text-muted-foreground/70">
            {t("Week")}
          </p>
          <div className="mt-1 flex flex-col gap-1">
            <NavLink
              href="/week/planning"
              icon={CalendarRange}
              label={t("Weekly planning")}
              active={current === "week-planning"}
            />
            <NavLink
              href="/week/review"
              icon={ClipboardList}
              label={t("Weekly review")}
              active={current === "week-review"}
            />
          </div>
        </div>

        <div className="mt-6">
          <p className="px-3 text-xs font-medium uppercase tracking-wide text-muted-foreground/70">
            {t("Month")}
          </p>
          <div className="mt-1 flex flex-col gap-1">
            <NavLink
              href="/month"
              icon={CalendarDays}
              label={t("Monthly view")}
              active={current === "month"}
            />
          </div>
        </div>

        <div className="mt-6">
          <p className="px-3 text-xs font-medium uppercase tracking-wide text-muted-foreground/70">
            {t("Insights")}
          </p>
          <div className="mt-1 flex flex-col gap-1">
            <NavLink
              href="/analytics"
              icon={BarChart3}
              label={t("Analytics")}
              active={current === "analytics"}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 px-2">
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <LanguageToggle />
        </div>
        <span className="text-sm text-muted-foreground">{t("Hi, {name}", { name: userName })}</span>
        <LogoutButton />
      </div>
    </aside>
  );
}
