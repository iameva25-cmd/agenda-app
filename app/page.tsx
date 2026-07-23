import Link from "next/link";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="flex items-center justify-between border-b border-border px-6 py-4 sm:px-10">
        <Logo />
        <nav className="flex items-center gap-4">
          <ThemeToggle />
          <Link
            href="/login"
            className="text-sm font-medium text-foreground/80 transition-colors hover:text-foreground"
          >
            Masuk
          </Link>
          <Link
            href="/register"
            className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            Daftar
          </Link>
        </nav>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-6 py-20 text-center sm:px-10">
        <span className="mb-5 rounded-full bg-accent/15 px-4 py-1 text-sm font-medium text-accent-foreground dark:text-accent">
          Ritual harian, bukan sekadar to-do list
        </span>

        <h1 className="max-w-2xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
          Susun harimu dengan{" "}
          <span className="text-primary">niat</span>, bukan{" "}
          <span className="text-accent">buru-buru</span>
        </h1>

        <p className="mt-6 max-w-xl text-lg text-muted-foreground">
          Rencanakan task hari ini, atur ke slot waktu di kalender harian, dan
          biarkan task yang belum selesai lanjut otomatis ke besok. Kamu yang
          pegang kendali penuh atas jadwalmu.
        </p>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <Link
            href="/register"
            className="rounded-full bg-primary px-8 py-3 text-base font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            Mulai Rencanakan Hari Ini
          </Link>
          <Link
            href="/login"
            className="rounded-full border border-border px-8 py-3 text-base font-semibold transition-colors hover:bg-muted"
          >
            Sudah punya akun? Masuk
          </Link>
        </div>
      </main>

      <footer className="border-t border-border px-6 py-6 text-center text-sm text-muted-foreground sm:px-10">
        Ritual - dibangun untuk disiplin harian, bukan kejar deadline.
      </footer>
    </div>
  );
}
