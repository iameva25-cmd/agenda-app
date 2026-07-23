"use client";

import { useRouter } from "next/navigation";
import { Languages } from "lucide-react";
import { useLocale } from "@/lib/i18n/context";

export function LanguageToggle() {
  const router = useRouter();
  const { locale, setLocale } = useLocale();

  function handleClick() {
    setLocale(locale === "en" ? "id" : "en");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="Switch language"
      title={locale === "en" ? "Switch to Bahasa Indonesia" : "Switch to English"}
      className="flex h-9 items-center gap-1.5 rounded-full border border-border px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
    >
      <Languages className="h-4 w-4" />
      {locale === "en" ? "EN" : "ID"}
    </button>
  );
}
