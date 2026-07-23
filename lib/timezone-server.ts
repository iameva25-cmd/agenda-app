import "server-only";
import { cookies } from "next/headers";
import { DEFAULT_TIMEZONE } from "@/lib/timezone";

export async function getTimeZone(): Promise<string> {
  const cookieStore = await cookies();
  return cookieStore.get("tz")?.value || DEFAULT_TIMEZONE;
}
