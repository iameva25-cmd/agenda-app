import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { LocaleProvider } from "@/lib/i18n/context";
import { getLocale } from "@/lib/i18n/server";
import { translate } from "@/lib/i18n/dictionary";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return {
    title:
      locale === "id"
        ? "Konteks - Semua Komitmen, Semua Konteks, Satu Tempat"
        : "Konteks - All Commitments, All Contexts, One Place",
    description: translate(
      "Konteks: agenda planner, tasks, and priorities - track commitments, follow-ups, and weekly reviews in one place.",
      locale,
    ),
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();

  return (
    <html
      lang={locale}
      className={`${poppins.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <LocaleProvider initialLocale={locale}>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            {children}
          </ThemeProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
