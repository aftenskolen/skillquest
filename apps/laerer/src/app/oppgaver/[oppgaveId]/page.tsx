import { hentInnloggetBruker } from "@novolms/auth";
import { createServerClient } from "@novolms/db/server";
import { redirect } from "next/navigation";
import type { OppgaveInnlevering, Bruker } from "@novolms/db";
import { giTilbakemeldingAction } from "./actions";

const statusEtikett: Record<string, { label: string; cls: string }> = {
  levert: { label: "Levert", cls: "bg-blue-100 text-blue-700" },
  rettet: { label: "Rettet", cls: "bg-green-100 text-green-700" },
};

export default async function OppgaveDetailPage({
  params,
}: {
  params: Promise<{ oppgaveId: string }>;
}) {
  const { oppgaveId } = await params;
  const brukerData = await hentInnloggetBruker().catch(() => null);
  if (!brukerData) redirect("/auth/logg-inn");

  const supabase = createServerClient();

  const { data: oppgave } = await supabase
    .from("oppgave")
    .select("*")
    .eq("id", oppgaveId)
    .maybeSingle();

  if (!oppgave) redirect("/oppgaver");

  const { data: klRolle } = await supabase
    .from("klasse_rolle")
    .select("id")
    .eq("klasse_id", oppgave.klasse_id)
    .eq("bruker_id", brukerData.bruker.id)
    .maybeSingle();

  if (!klRolle) redirect("/oppgaver");

  const [{ data: samling }, { data: paaMeldinger }, { data: innleveringer }] =
    await Promise.all([
      supabase
        .from("samling")
        .select("dato_tid, type")
        .eq("id", oppgave.samling_id)
        .single(),
      supabase
        .from("paamelding")
        .select("bruker_id")
        .eq("klasse_id", oppgave.klasse_id)
        .in("status", ["aktiv", "paameldt"]),
      supabase
        .from("oppgave_innlevering")
        .select("*")
        .eq("oppgave_id", oppgaveId),
    ]);

  const deltakereIds = (paaMeldinger ?? []).map((p) => p.bruker_id);
  const { data: deltakere } = deltakereIds.length > 0
    ? await supabase.from("bruker").select("id, navn").in("id", deltakereIds).order("navn")
    : { data: [] };

  const deltakerMap = new Map((deltakere ?? []).map((b) => [b.id, b as Bruker]));
  const innleveringMap = new Map(
    (innleveringer as OppgaveInnlevering[]).map((i) => [i.bruker_id, i])
  );

  const levertCount = innleveringer?.length ?? 0;

  return (
    <div className="p-6 max-w-3xl">
      <a href="/oppgaver" className="text-sm text-[#1B3A5C] hover:underline">
        ← Tilbake
      </a>

      <div className="bg-white rounded-xl border border-gray-200 p-5 mt-4 mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold text-[#1B3A5C]">{oppgave.tittel}</h1>
            {samling && (
              <p className="text-xs text-gray-500 mt-1">
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
            {levertCount} / {deltakereIds.length} levert
          </span>
        </div>
        {oppgave.beskrivelse && (
          <p className="mt-3 text-sm text-gray-700 whitespace-pre-wrap">{oppgave.beskrivelse}</p>
        )}
        {oppgave.fil_url && (
          <a
            href={oppgave.fil_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 mt-3 text-sm text-[#1B3A5C] underline"
          >
            📄 Last ned vedlegg (PDF)
          </a>
        )}
      </div>

      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
        Innleveringer ({deltakereIds.length} deltakere)
      </h2>

      <div className="space-y-3">
        {deltakereIds.map((brukerIdParam) => {
          const deltaker = deltakerMap.get(brukerIdParam);
          const innlevering = innleveringMap.get(brukerIdParam);

          if (!innlevering) {
            return (
              <div
                key={brukerIdParam}
                className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex items-center justify-between"
              >
                <span className="text-sm text-gray-700">{deltaker?.navn ?? "Ukjent"}</span>
                <span className="text-xs text-gray-400">Ikke levert</span>
              </div>
            );
          }

          const statusInfo = statusEtikett[innlevering.status] ?? { label: innlevering.status, cls: "bg-gray-100 text-gray-600" };
          return (
            <details
              key={brukerIdParam}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden"
            >
              <summary className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50 select-none">
                <span className="text-sm font-medium text-gray-900">
                  {deltaker?.navn ?? "Ukjent"}
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400">
                    {new Date(innlevering.innlevert_dato).toLocaleDateString("nb-NO")}
                  </span>
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusInfo.cls}`}
                  >
                    {statusInfo.label}
                  </span>
                </div>
              </summary>

              <div className="px-4 pb-4 border-t border-gray-100 pt-3 space-y-4">
                {innlevering.innhold_tekst && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">Svar</p>
                    <p className="text-sm text-gray-800 whitespace-pre-wrap bg-gray-50 rounded-lg p-3">
                      {innlevering.innhold_tekst}
                    </p>
                  </div>
                )}
                {innlevering.fil_url && (
                  <a
                    href={innlevering.fil_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-[#1B3A5C] underline"
                  >
                    📎 Last ned innlevering
                  </a>
                )}

                {innlevering.tilbakemelding_tekst && (
                  <div className="bg-green-50 rounded-lg p-3">
                    <p className="text-xs font-medium text-green-700 mb-1">Tilbakemelding gitt</p>
                    <p className="text-sm text-green-900 whitespace-pre-wrap">
                      {innlevering.tilbakemelding_tekst}
                    </p>
                  </div>
                )}

                <form action={giTilbakemeldingAction} className="space-y-2">
                  <input type="hidden" name="innlevering_id" value={innlevering.id} />
                  <label className="block text-xs font-medium text-gray-500">
                    {innlevering.tilbakemelding_tekst ? "Oppdater tilbakemelding" : "Gi tilbakemelding"}
                  </label>
                  <textarea
                    name="tilbakemelding"
                    rows={3}
                    defaultValue={innlevering.tilbakemelding_tekst ?? ""}
                    placeholder="Skriv tilbakemelding til deltakeren…"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A5C] resize-none"
                  />
                  <button
                    type="submit"
                    className="bg-[#1B3A5C] text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-[#16324f]"
                  >
                    {innlevering.tilbakemelding_tekst ? "Lagre" : "Send tilbakemelding"}
                  </button>
                </form>
              </div>
            </details>
          );
        })}
      </div>
    </div>
  );
}
