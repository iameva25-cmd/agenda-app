"use client";

import { useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";

// Nambah 14 hari tiap kali sentinel ini kelihatan (user scroll mendekati
// ujung kanan), sampai maxDays. Nilai jumlah hari yang aktif disimpan di
// URL (?days=), jadi navigasi ini bikin app/home/page.tsx re-fetch dengan
// jumlah hari yang baru.
const DAYS_STEP = 14;

export function HomeLoadMoreSentinel({
  currentDays,
  maxDays,
}: {
  currentDays: number;
  maxDays: number;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const sentinelRef = useRef<HTMLDivElement>(null);
  // Mencegah trigger berkali-kali untuk currentDays yang sama selagi
  // navigasi ke jumlah hari berikutnya masih berlangsung.
  const triggeredForRef = useRef<number | null>(null);

  useEffect(() => {
    if (currentDays >= maxDays) return;
    const sentinel = sentinelRef.current;
    const scrollContainer = sentinel?.closest("[data-home-day-row]");
    if (!sentinel || !scrollContainer) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && triggeredForRef.current !== currentDays) {
          triggeredForRef.current = currentDays;
          const nextDays = Math.min(currentDays + DAYS_STEP, maxDays);
          startTransition(() => {
            router.push(`/home?days=${nextDays}`, { scroll: false });
          });
        }
      },
      // rootMargin ke kanan supaya loading dimulai sebelum sentinel benar-benar
      // kelihatan penuh, jadi kolom baru sudah siap sebelum user selesai scroll.
      { root: scrollContainer, rootMargin: "0px 600px 0px 0px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [currentDays, maxDays, router]);

  if (currentDays >= maxDays) return null;

  return (
    <div
      ref={sentinelRef}
      aria-hidden
      className="flex w-16 shrink-0 items-center justify-center text-xs text-muted-foreground"
    >
      {isPending && "..."}
    </div>
  );
}
