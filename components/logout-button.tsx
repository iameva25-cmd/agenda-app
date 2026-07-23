"use client";

import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth-client";
import { useTranslation } from "@/lib/i18n/context";

export function LogoutButton() {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <button
      type="button"
      onClick={async () => {
        await signOut();
        router.push("/");
        router.refresh();
      }}
      className="rounded-full border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
    >
      {t("Log Out")}
    </button>
  );
}
