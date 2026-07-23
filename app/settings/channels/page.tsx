import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { ChannelsManager } from "@/components/channels-manager";
import { getContextsWithChannels } from "@/lib/actions/channels";
import { getT } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export default async function ChannelsSettingsPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login");
  }

  const contexts = await getContextsWithChannels();
  const sorted = [...contexts].sort((a, b) => {
    if (a.name === "uncategorized") return 1;
    if (b.name === "uncategorized") return -1;
    return 0;
  });
  const { t } = await getT();

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <Link
        href="/home"
        className="text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        {t("← Return to Home")}
      </Link>

      <h1 className="mt-4 text-2xl font-bold">{t("Contexts & Channels")}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {t(
          "Manage contexts (parent categories) and channels (sub-categories) to group your tasks.",
        )}
      </p>

      <div className="mt-6">
        <ChannelsManager contexts={sorted} />
      </div>
    </main>
  );
}
