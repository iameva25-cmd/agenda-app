"use client";

import { useState } from "react";
import { ChevronsRight } from "lucide-react";
import { SidebarNav } from "@/components/sidebar-nav";
import { useTranslation } from "@/lib/i18n/context";

export function TodayFocusShell({
  userName,
  children,
}: {
  userName: string;
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const { t } = useTranslation();

  return (
    <div className="flex h-screen overflow-hidden">
      {collapsed ? (
        <div className="flex w-8 shrink-0 flex-col items-center border-r border-border/60 bg-black/10 pt-5">
          <button
            type="button"
            onClick={() => setCollapsed(false)}
            aria-label={t("Show sidebar")}
            className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ChevronsRight className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <SidebarNav
          userName={userName}
          current="today"
          onCollapse={() => setCollapsed(true)}
        />
      )}

      <div className="flex flex-1 overflow-hidden">{children}</div>
    </div>
  );
}
