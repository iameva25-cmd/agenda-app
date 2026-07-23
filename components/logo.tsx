import Link from "next/link";

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={`flex items-center gap-2 text-xl font-semibold tracking-tight ${className ?? ""}`}
    >
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
        R
      </span>
      <span>
        Ritual<span className="text-accent">.</span>
      </span>
    </Link>
  );
}
