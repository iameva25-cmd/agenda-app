import "server-only";
import { cookies } from "next/headers";
import { translate, type Locale } from "@/lib/i18n/dictionary";

export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  return cookieStore.get("locale")?.value === "id" ? "id" : "en";
}

export async function getT() {
  const locale = await getLocale();
  return {
    t: (key: string, params?: Record<string, string | number>) => translate(key, locale, params),
    locale,
  };
}
