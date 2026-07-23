import Link from "next/link";
import {
  Home,
  CalendarCheck,
  Target,
  Moon,
  Star,
  CalendarRange,
  ClipboardList,
  CalendarDays,
  BarChart3,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { LogoutButton } from "@/components/logout-button";

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
          ? "bg-primary/10 font-semibold text-primary"
          : "text-muted-foreground hover:bg-muted"
      }`}
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </Link>
  );
}

function DisabledItem({
  icon: Icon,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground/40">
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </div>
  );
}

export function SidebarNav({
  userName,
  current,
}: {
  userName: string;
  current:
    | "today"
    | "today-shutdown"
    | "week-planning"
    | "week-review"
    | "month"
    | "analytics";
}) {
  return (
    <aside className="flex h-screen w-[220px] shrink-0 flex-col justify-between border-r border-border/60 bg-black/10 px-3 py-5">
      <div>
        <div className="px-2">
          <Logo />
        </div>

        <nav className="mt-8 flex flex-col gap-1">
          <DisabledItem icon={Home} label="Home" />
          <NavLink
            href="/today"
            icon={CalendarCheck}
            label="Today"
            active={current === "today"}
          />
          <DisabledItem icon={Target} label="Focus" />
        </nav>

        <div className="mt-6">
          <p className="px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground/70">
            Day
          </p>
          <div className="mt-1 flex flex-col gap-1">
            <NavLink
              href="/today"
              icon={CalendarCheck}
              label="Daily planning"
              active={current === "today"}
            />
            <NavLink
              href="/today/shutdown"
              icon={Moon}
              label="Daily shutdown"
              active={current === "today-shutdown"}
            />
            <DisabledItem icon={Star} label="Daily highlights" />
          </div>
        </div>

        <div className="mt-6">
          <p className="px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground/70">
            Week
          </p>
          <div className="mt-1 flex flex-col gap-1">
            <NavLink
              href="/week/planning"
              icon={CalendarRange}
              label="Weekly planning"
              active={current === "week-planning"}
            />
            <NavLink
              href="/week/review"
              icon={ClipboardList}
              label="Weekly review"
              active={current === "week-review"}
            />
          </div>
        </div>

        <div className="mt-6">
          <p className="px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground/70">
            Month
          </p>
          <div className="mt-1 flex flex-col gap-1">
            <NavLink
              href="/month"
              icon={CalendarDays}
              label="Monthly view"
              active={current === "month"}
            />
          </div>
        </div>

        <div className="mt-6">
          <p className="px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground/70">
            Insights
          </p>
          <div className="mt-1 flex flex-col gap-1">
            <NavLink
              href="/analytics"
              icon={BarChart3}
              label="Analytics"
              active={current === "analytics"}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 px-2">
        <span className="text-sm text-muted-foreground">Halo, {userName}</span>
        <LogoutButton />
      </div>
    </aside>
  );
}
