import type { Locale } from "@/lib/i18n/dictionary";

export function toIntlLocale(locale: Locale): string {
  return locale === "id" ? "id-ID" : "en-US";
}
