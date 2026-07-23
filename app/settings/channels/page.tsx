import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { ChannelsManager } from "@/components/channels-manager";
import { getContextsWithChannels } from "@/lib/actions/channels";

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

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <Link
        href="/today"
        className="text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        ← Return to Today
      </Link>

      <h1 className="mt-4 text-2xl font-bold">Contexts & Channels</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Atur context (kategori induk) dan channel (sub-kategori) untuk mengelompokkan task kamu.
      </p>

      <div className="mt-6">
        <ChannelsManager contexts={sorted} />
      </div>
    </main>
  );
}
