import "@novolms/ui/globals.css";
import type { Metadata } from "next";
import { hentInnloggetBruker } from "@novolms/auth";
import { UserMenu } from "@novolms/ui";
import { createServerClient } from "@novolms/db/server";
import Link from "next/link";

export const metadata: Metadata = {
  title: "novolms",
  description: "Læremodus",
};

async function hentUlesteCount(brukerId: string): Promise<number> {
  const supabase = createServerClient();
  const { data: trader } = await supabase
    .from("melding_trad")
    .select("id")
    .eq("deltaker_id", brukerId);

  if (!trader || trader.length === 0) return 0;

  const tradIder = trader.map((t) => t.id);
  const { count } = await supabase
    .from("melding")
    .select("id", { count: "exact", head: true })
    .in("trad_id", tradIder)
    .is("lest_dato", null)
    .neq("fra_bruker_id", brukerId);

  return count ?? 0;
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const brukerData = await hentInnloggetBruker().catch(() => null);
  const ulesteCount = brukerData
    ? await hentUlesteCount(brukerData.bruker.id).catch(() => 0)
    : 0;

  return (
    <html lang="nb">
      <body className="min-h-screen bg-[#F4F6F8]">
        {brukerData && (
          <header className="border-b bg-white px-6 py-3 flex items-center justify-between">
            <a href="/" className="text-lg font-bold text-[#1B3A5C]">novolms</a>
            <div className="flex items-center gap-4">
              <Link href="/meldinger" className="relative text-sm text-gray-600 hover:text-[#1B3A5C] font-medium">
                Meldinger
                {ulesteCount > 0 && (
                  <span className="absolute -top-1.5 -right-3 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
                    {ulesteCount > 9 ? "9+" : ulesteCount}
                  </span>
                )}
              </Link>
              <UserMenu bruker={brukerData.bruker} roller={brukerData.roller} />
            </div>
          </header>
        )}
        {children}
      </body>
    </html>
  );
}
