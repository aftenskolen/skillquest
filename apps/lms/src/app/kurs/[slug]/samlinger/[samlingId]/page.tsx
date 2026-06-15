import { hentInnloggetBruker } from "@novolms/auth";
import { createServerClient } from "@novolms/db/server";
import { redirect } from "next/navigation";
import type { Oppgave, OppgaveInnlevering } from "@novolms/db";
import { leverInnOppgaveAction } from "./actions";

const typeEtikett: Record<string, string> = {
  fysisk: "Fysisk",
  virtuell: "Virtuell",
  discord: "Discord",
  asynkron: "Asynkron",
};

export default async function SamlingDetailPage({
  params,
}: {
  params: Promise<{ slug: string; samlingId: string }>;
}) {
  const { slug, samlingId } = await params;
  const brukerData = await hentInnloggetBruker().catch(() => null);
  if (!brukerData) redirect("/auth/logg-inn");

  const supabase = createServerClient();

  const { data: samling } = await supabase
    .from("samling")
    .select("*")
    .eq("id", samlingId)
    .maybeSingle();

  if (!samling) redirect(`/kurs/${slug}`);

  const { data: paamelding } = await supabase
    .from("paamelding")
    .select("id")
    .eq("klasse_id", samling.klasse_id)
    .eq("bruker_id", brukerData.bruker.id)
    .in("status", ["aktiv", "paameldt"])
    .maybeSingle();

  if (!paamelding) redirect(`/kurs/${slug}`);

  const { data: oppgaver } = await supabase
    .from("oppgave")
    .select("*")
    .eq("samling_id", samlingId)
    .order("opprettet_dato");

  const oppgaveListe = (oppgaver as Oppgave[]) ?? [];
  const oppgaveIder = oppgaveListe.map((o) => o.id);

  const { data: innleveringer } =
    oppgaveIder.length > 0
      ? await supabase
          .from("oppgave_innlevering")
          .select("*")
          .in("oppgave_id", oppgaveIder)
          .eq("bruker_id", brukerData.bruker.id)
      : { data: [] };

  const innleveringMap = new Map(
    (innleveringer as OppgaveInnlevering[]).map((i) => [i.oppgave_id, i])
  );

  const dato = new Date(samling.dato_tid);

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">
          {typeEtikett[samling.type] ?? samling.type}
        </p>
        <h1 className="text-lg font-bold text-[#1B3A5C]">
          {dato.toLocaleDateString("nb-NO", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          kl.{" "}
          {dato.toLocaleTimeString("nb-NO", { hour: "2-digit", minute: "2-digit" })}
        </p>

        {samling.sted_eller_lenke && (
          <div className="mt-3">
            {samling.sted_eller_lenke.startsWith("http") ? (
              <a
                href={samling.sted_eller_lenke}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-[#1B3A5C] underline"
              >
                Bli med digitalt →
              </a>
            ) : (
              <p className="text-sm text-gray-700">📍 {samling.sted_eller_lenke}</p>
            )}
          </div>
        )}

        {samling.notat && (
          <p className="mt-3 text-sm text-gray-700 bg-gray-50 rounded-lg p-3 whitespace-pre-wrap">
            {samling.notat}
          </p>
        )}
      </div>

      {oppgaveListe.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Oppgaver ({oppgaveListe.length})
          </h2>
          <div className="space-y-4">
            {oppgaveListe.map((oppgave) => {
              const innlevering = innleveringMap.get(oppgave.id);
              return (
                <div
                  key={oppgave.id}
                  className="bg-white rounded-xl border border-gray-200 overflow-hidden"
                >
                  <div className="p-4 border-b border-gray-100">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-semibold text-[#1B3A5C]">{oppgave.tittel}</h3>
                      {innlevering && (
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${
                            innlevering.status === "rettet"
                              ? "bg-green-100 text-green-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {innlevering.status === "rettet" ? "Rettet" : "Levert"}
                        </span>
                      )}
                    </div>
                    {oppgave.beskrivelse && (
                      <p className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">
                        {oppgave.beskrivelse}
                      </p>
                    )}
                    {oppgave.fil_url && (
                      <a
                        href={oppgave.fil_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 mt-2 text-sm text-[#1B3A5C] underline"
                      >
                        📄 Last ned oppgave (PDF)
                      </a>
                    )}
                  </div>

                  {innlevering?.tilbakemelding_tekst && (
                    <div className="px-4 py-3 bg-green-50 border-b border-green-100">
                      <p className="text-xs font-semibold text-green-700 mb-1">
                        Tilbakemelding fra lærer
                      </p>
                      <p className="text-sm text-green-900 whitespace-pre-wrap">
                        {innlevering.tilbakemelding_tekst}
                      </p>
                    </div>
                  )}

                  <div className="p-4">
                    {innlevering ? (
                      <div className="space-y-3">
                        <p className="text-xs font-medium text-gray-500">Din innlevering</p>
                        {innlevering.innhold_tekst && (
                          <p className="text-sm text-gray-800 bg-gray-50 rounded-lg p-3 whitespace-pre-wrap">
                            {innlevering.innhold_tekst}
                          </p>
                        )}
                        {innlevering.fil_url && (
                          <a
                            href={innlevering.fil_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-sm text-[#1B3A5C] underline"
                          >
                            📎 Se innlevert fil
                          </a>
                        )}
                        <details className="text-xs text-gray-400 cursor-pointer">
                          <summary>Endre innlevering</summary>
                          <div className="mt-3">
                            <LeverInnForm
                              oppgaveId={oppgave.id}
                              samlingId={samlingId}
                              kursSlug={slug}
                              eksisterendeTekst={innlevering.innhold_tekst}
                            />
                          </div>
                        </details>
                      </div>
                    ) : (
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-3">
                          Lever inn svar
                        </p>
                        <LeverInnForm
                          oppgaveId={oppgave.id}
                          samlingId={samlingId}
                          kursSlug={slug}
                          eksisterendeTekst={null}
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {oppgaveListe.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 text-center text-sm text-gray-400">
          Ingen oppgaver knyttet til denne samlingen ennå.
        </div>
      )}
    </div>
  );
}

function LeverInnForm({
  oppgaveId,
  samlingId,
  kursSlug,
  eksisterendeTekst,
}: {
  oppgaveId: string;
  samlingId: string;
  kursSlug: string;
  eksisterendeTekst: string | null;
}) {
  return (
    <form action={leverInnOppgaveAction} className="space-y-3" encType="multipart/form-data">
      <input type="hidden" name="oppgave_id" value={oppgaveId} />
      <input type="hidden" name="samling_id" value={samlingId} />
      <input type="hidden" name="kurs_slug" value={kursSlug} />
      <textarea
        name="innhold_tekst"
        rows={4}
        defaultValue={eksisterendeTekst ?? ""}
        placeholder="Skriv ditt svar her…"
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#1B3A5C]"
      />
      <div>
        <p className="text-xs text-gray-500 mb-1">Eller last opp fil (valgfritt)</p>
        <input
          type="file"
          name="fil"
          className="w-full text-sm text-gray-600 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
        />
      </div>
      <button
        type="submit"
        className="bg-[#1B3A5C] text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-[#16324f]"
      >
        {eksisterendeTekst !== null ? "Oppdater innlevering" : "Lever inn"}
      </button>
    </form>
  );
}
