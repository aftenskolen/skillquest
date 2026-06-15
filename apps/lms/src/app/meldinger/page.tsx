import { hentInnloggetBruker } from "@novolms/auth";
import { createServerClient } from "@novolms/db/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { MeldingTrad, Melding, Bruker, Klasse } from "@novolms/db";

export default async function MeldingerPage() {
  const brukerData = await hentInnloggetBruker().catch(() => null);
  if (!brukerData) redirect("/auth/logg-inn");

  const supabase = createServerClient();

  const { data: trader } = await supabase
    .from("melding_trad")
    .select("*")
    .eq("deltaker_id", brukerData.bruker.id)
    .order("opprettet_dato", { ascending: false });

  const traderListe = (trader as MeldingTrad[]) ?? [];
  const tradIder = traderListe.map((t) => t.id);

  if (tradIder.length === 0) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <h1 className="text-xl font-bold text-[#1B3A5C] mb-6">Meldinger</h1>
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
          Du har ingen meldinger ennå.
        </div>
      </div>
    );
  }

  const [{ data: sisteMeldinger }, { data: ulesteTeller }, { data: laerere }, { data: klasser }] =
    await Promise.all([
      supabase
        .from("melding")
        .select("*")
        .in("trad_id", tradIder)
        .order("sendt_dato", { ascending: false }),
      supabase
        .from("melding")
        .select("trad_id")
        .in("trad_id", tradIder)
        .is("lest_dato", null)
        .neq("fra_bruker_id", brukerData.bruker.id),
      supabase
        .from("bruker")
        .select("id, navn")
        .in("id", traderListe.map((t) => t.laerer_id)),
      supabase
        .from("klasse")
        .select("id, tittel")
        .in("id", traderListe.map((t) => t.klasse_id)),
    ]);

  const laererMap = new Map((laerere ?? []).map((b) => [b.id, b as Bruker]));
  const klasseMap = new Map((klasser ?? []).map((k) => [k.id, k as Klasse]));

  const sisteMeldingPerTrad = new Map<string, Melding>();
  for (const m of (sisteMeldinger as Melding[]) ?? []) {
    if (!sisteMeldingPerTrad.has(m.trad_id)) {
      sisteMeldingPerTrad.set(m.trad_id, m);
    }
  }

  const ulestPerTrad = new Map<string, number>();
  for (const m of (ulesteTeller as { trad_id: string }[]) ?? []) {
    ulestPerTrad.set(m.trad_id, (ulestPerTrad.get(m.trad_id) ?? 0) + 1);
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-xl font-bold text-[#1B3A5C] mb-6">Meldinger</h1>

      <div className="bg-white rounded-xl border border-gray-200 divide-y">
        {traderListe.map((trad) => {
          const laerer = laererMap.get(trad.laerer_id);
          const klasse = klasseMap.get(trad.klasse_id);
          const siste = sisteMeldingPerTrad.get(trad.id);
          const uleste = ulestPerTrad.get(trad.id) ?? 0;
          return (
            <Link
              key={trad.id}
              href={`/meldinger/${trad.id}`}
              className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 transition-colors"
            >
              <div className="w-9 h-9 rounded-full bg-[#1B3A5C] text-white flex items-center justify-center text-sm font-bold shrink-0">
                {laerer?.navn?.charAt(0).toUpperCase() ?? "L"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm text-gray-900">
                    {laerer?.navn ?? "Lærer"}
                  </span>
                  {uleste > 0 && (
                    <span className="bg-[#1B3A5C] text-white text-xs rounded-full px-1.5 py-0.5 font-medium">
                      {uleste}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 truncate mt-0.5">
                  {klasse?.tittel}
                  {siste ? ` · ${siste.innhold}` : ""}
                </p>
              </div>
              {siste && (
                <span className="text-xs text-gray-400 shrink-0">
                  {new Date(siste.sendt_dato).toLocaleDateString("nb-NO")}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
