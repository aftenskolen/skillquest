import { hentInnloggetBruker } from "@novolms/auth";
import { createServerClient } from "@novolms/db/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { MeldingTrad, Melding, Bruker, Klasse } from "@novolms/db";

export default async function DialogPage() {
  const brukerData = await hentInnloggetBruker().catch(() => null);
  if (!brukerData) redirect("/auth/logg-inn");

  const supabase = createServerClient();

  const { data: klasseRoller } = await supabase
    .from("klasse_rolle")
    .select("klasse_id")
    .eq("bruker_id", brukerData.bruker.id);

  const klasseIder = klasseRoller?.map((r) => r.klasse_id) ?? [];

  if (klasseIder.length === 0) {
    return (
      <div className="p-8 text-gray-500">
        Du er ikke tilknyttet noen klasser.
      </div>
    );
  }

  const [{ data: trader }, { data: klasser }] = await Promise.all([
    supabase
      .from("melding_trad")
      .select("*")
      .eq("laerer_id", brukerData.bruker.id)
      .order("opprettet_dato", { ascending: false }),
    supabase
      .from("klasse")
      .select("id, tittel")
      .in("id", klasseIder),
  ]);

  const traderListe = (trader as MeldingTrad[]) ?? [];
  const tradIder = traderListe.map((t) => t.id);

  const [{ data: sisteMeldinger }, { data: ulesteTeller }, { data: deltakere }] =
    await Promise.all([
      tradIder.length > 0
        ? supabase
            .from("melding")
            .select("*")
            .in("trad_id", tradIder)
            .order("sendt_dato", { ascending: false })
        : Promise.resolve({ data: [] }),
      tradIder.length > 0
        ? supabase
            .from("melding")
            .select("trad_id")
            .in("trad_id", tradIder)
            .is("lest_dato", null)
            .neq("fra_bruker_id", brukerData.bruker.id)
        : Promise.resolve({ data: [] }),
      traderListe.length > 0
        ? supabase
            .from("bruker")
            .select("id, navn")
            .in("id", traderListe.map((t) => t.deltaker_id))
        : Promise.resolve({ data: [] }),
    ]);

  const klasseMap = new Map((klasser ?? []).map((k) => [k.id, k as Klasse]));
  const deltakerMap = new Map((deltakere ?? []).map((b) => [b.id, b as Bruker]));

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

  const gruppert = new Map<string, typeof traderListe>();
  for (const t of traderListe) {
    if (!gruppert.has(t.klasse_id)) gruppert.set(t.klasse_id, []);
    gruppert.get(t.klasse_id)!.push(t);
  }

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-[#1B3A5C]">Dialog</h1>
        <Link
          href="/dialog/ny"
          className="bg-[#1B3A5C] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#16324f]"
        >
          Ny melding
        </Link>
      </div>

      {traderListe.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
          Ingen samtaler ennå.{" "}
          <Link href="/dialog/ny" className="text-[#1B3A5C] underline">
            Start en ny samtale
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {Array.from(gruppert.entries()).map(([klasseId, traderi]) => {
            const klasse = klasseMap.get(klasseId);
            return (
              <div key={klasseId}>
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  {klasse?.tittel ?? "Ukjent klasse"}
                </h2>
                <div className="bg-white rounded-xl border border-gray-200 divide-y">
                  {traderi.map((trad) => {
                    const deltaker = deltakerMap.get(trad.deltaker_id);
                    const siste = sisteMeldingPerTrad.get(trad.id);
                    const uleste = ulestPerTrad.get(trad.id) ?? 0;
                    return (
                      <Link
                        key={trad.id}
                        href={`/dialog/${trad.id}`}
                        className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 transition-colors"
                      >
                        <div className="w-9 h-9 rounded-full bg-[#1B3A5C] text-white flex items-center justify-center text-sm font-bold shrink-0">
                          {deltaker?.navn?.charAt(0).toUpperCase() ?? "?"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm text-gray-900">
                              {deltaker?.navn ?? "Ukjent"}
                            </span>
                            {uleste > 0 && (
                              <span className="bg-[#1B3A5C] text-white text-xs rounded-full px-1.5 py-0.5 font-medium">
                                {uleste}
                              </span>
                            )}
                          </div>
                          {siste && (
                            <p className="text-xs text-gray-500 truncate mt-0.5">
                              {siste.innhold}
                            </p>
                          )}
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
          })}
        </div>
      )}
    </div>
  );
}
