"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function TimezoneSync() {
  const router = useRouter();

  useEffect(() => {
    const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!detected) return;

    const match = document.cookie.match(/(?:^|; )tz=([^;]+)/);
    const current = match ? decodeURIComponent(match[1]) : null;

    if (detected !== current) {
      document.cookie = `tz=${encodeURIComponent(detected)}; path=/; max-age=31536000`;
      router.refresh();
    }
  }, [router]);

  return null;
}
