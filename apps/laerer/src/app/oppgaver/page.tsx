import { hentInnloggetBruker } from "@novolms/auth";
import { createServerClient } from "@novolms/db/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { Oppgave, Klasse, Samling } from "@novolms/db";

export default async function OppgaverPage() {
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
      <div className="p-8 text-gray-500">Du er ikke tilknyttet noen klasser.</div>
    );
  }

  const [{ data: oppgaver }, { data: klasser }, { data: samlinger }] =
    await Promise.all([
      supabase
        .from("oppgave")
        .select("*")
        .in("klasse_id", klasseIder)
        .order("opprettet_dato", { ascending: false }),
      supabase.from("klasse").select("id, tittel").in("id", klasseIder),
      supabase
        .from("samling")
        .select("id, dato_tid, type")
        .in("klasse_id", klasseIder),
    ]);

  const oppgaveListe = (oppgaver as Oppgave[]) ?? [];
  const oppgaveIder = oppgaveListe.map((o) => o.id);

  const { data: innleveringTeller } =
    oppgaveIder.length > 0
      ? await supabase
          .from("oppgave_innlevering")
          .select("oppgave_id")
          .in("oppgave_id", oppgaveIder)
      : { data: [] };

  const innleveringerPerOppgave = new Map<string, number>();
  for (const i of innleveringTeller ?? []) {
    innleveringerPerOppgave.set(
      i.oppgave_id,
      (innleveringerPerOppgave.get(i.oppgave_id) ?? 0) + 1
    );
  }

  const klasseMap = new Map((klasser ?? []).map((k) => [k.id, k as Klasse]));
  const samlingMap = new Map((samlinger ?? []).map((s) => [s.id, s as Samling]));

  const gruppert = new Map<string, Oppgave[]>();
  for (const o of oppgaveListe) {
    if (!gruppert.has(o.klasse_id)) gruppert.set(o.klasse_id, []);
    gruppert.get(o.klasse_id)!.push(o);
  }

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-[#1B3A5C]">Oppgaver</h1>
        <Link
          href="/oppgaver/ny"
          className="bg-[#1B3A5C] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#16324f]"
        >
          Ny oppgave
        </Link>
      </div>

      {oppgaveListe.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
          Ingen oppgaver ennå.{" "}
          <Link href="/oppgaver/ny" className="text-[#1B3A5C] underline">
            Opprett den første
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {Array.from(gruppert.entries()).map(([klasseId, oppgaver]) => {
            const klasse = klasseMap.get(klasseId);
            return (
              <div key={klasseId}>
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  {klasse?.tittel ?? "Ukjent klasse"}
                </h2>
                <div className="bg-white rounded-xl border border-gray-200 divide-y">
                  {oppgaver.map((o) => {
                    const samling = samlingMap.get(o.samling_id);
                    const antall = innleveringerPerOppgave.get(o.id) ?? 0;
                    return (
                      <Link
                        key={o.id}
                        href={`/oppgaver/${o.id}`}
                        className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-gray-900">{o.tittel}</p>
                          {samling && (
                            <p className="text-xs text-gray-500 mt-0.5">
                              Samling{" "}
                              {new Date(samling.dato_tid).toLocaleDateString("nb-NO", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                              })}
                            </p>
                          )}
                        </div>
                        <span className="text-xs text-gray-400 shrink-0">
                          {antall} innlevering{antall !== 1 ? "er" : ""}
                        </span>
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
