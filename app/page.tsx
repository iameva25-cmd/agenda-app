import Link from "next/link";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import { getT } from "@/lib/i18n/server";

export default async function Home() {
  const { t } = await getT();

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="flex items-center justify-between border-b border-border px-6 py-4 sm:px-10">
        <Logo />
        <nav className="flex items-center gap-4">
          <ThemeToggle />
          <LanguageToggle />
          <Link
            href="/login"
            className="text-sm font-medium text-foreground/80 transition-colors hover:text-foreground"
          >
            {t("Log in")}
          </Link>
          <Link
            href="/register"
            className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            {t("Sign up")}
          </Link>
        </nav>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-6 py-20 text-center sm:px-10">
        <span className="mb-5 rounded-full bg-accent/15 px-4 py-1 text-sm font-medium text-accent-foreground dark:text-accent">
          {t("All commitments. All contexts. One place.")}
        </span>

        <h1 className="max-w-2xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
          {t("Plan your day with")}{" "}
          <span className="text-primary">{t("intent")}</span>, {t("not")}{" "}
          <span className="text-accent">{t("rush")}</span>
        </h1>

        <p className="mt-6 max-w-xl text-lg text-muted-foreground">
          {t(
            "Plan today's tasks, schedule them into daily time slots, and let unfinished tasks carry over to tomorrow automatically. You stay in full control of your schedule.",
          )}
        </p>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <Link
            href="/register"
            className="rounded-full bg-primary px-8 py-3 text-base font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            {t("Start Planning Today")}
          </Link>
          <Link
            href="/login"
            className="rounded-full border border-border px-8 py-3 text-base font-semibold transition-colors hover:bg-muted"
          >
            {t("Already have an account? Log in")}
          </Link>
        </div>
      </main>

      <footer className="border-t border-border px-6 py-6 text-center text-sm text-muted-foreground sm:px-10">
        {t("Konteks - built for daily discipline, not deadline chasing.")}
      </footer>
    </div>
  );
}
