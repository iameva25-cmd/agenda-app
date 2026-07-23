import Link from "next/link";
import { Check } from "lucide-react";

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={`flex items-center gap-2 text-xl font-semibold tracking-tight ${className ?? ""}`}
    >
      <span className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#0D9488] to-[#14B8A6] text-sm font-bold text-white">
        K
        <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-white text-primary ring-2 ring-background">
          <Check className="h-2.5 w-2.5" strokeWidth={3} />
        </span>
      </span>
      <span>Konteks</span>
    </Link>
  );
}
