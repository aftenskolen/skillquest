import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { hentInnloggetBruker } from "@novolms/auth";
import { createServerClient } from "@novolms/db/server";
import type { LeksjonProgresjon, LeksjonBesvarelse, FlerspraakligTekst, InnholdsBlokk, MultipleChoiceBlokkData } from "@novolms/db";
import { nullstillLeksjonProgresjonAction } from "./actions";

interface Props {
  params: { id: string; brukerId: string };
}

export default async function DeltakerDetaljPage({ params }: Props) {
  const brukerData = await hentInnloggetBruker();
  if (!brukerData) redirect("/auth/logg-inn");

  const db = createServerClient();

  const { data: rolle } = await db
    .from("klasse_rolle")
    .select("id")
    .eq("klasse_id", params.id)
    .eq("bruker_id", brukerData.bruker.id)
    .single();

  if (!rolle) notFound();

  const [{ data: klasse }, { data: student }, { data: paamelding }] = await Promise.all([
    db.from("klasse").select("*").eq("id", params.id).single(),
    db.from("bruker").select("*").eq("id", params.brukerId).single(),
    db.from("paamelding").select("*").eq("klasse_id", params.id).eq("bruker_id", params.brukerId).single(),
  ]);

  if (!klasse || !student || !paamelding) notFound();

  // Course structure
  const { data: kursModulKoblinger } = await db
    .from("kurs_modul_kobling")
    .select("*")
    .eq("kurs_id", klasse.kurs_id)
    .order("rekkefolge");

  const modulIder = (kursModulKoblinger ?? []).map((k) => k.modul_id);

  const [modulerRes, leksjonKoblingerRes] = await Promise.all([
    modulIder.length > 0
      ? db.from("innhold_modul").select("id, tittel").in("id", modulIder)
      : Promise.resolve({ data: [] }),
    modulIder.length > 0
      ? db.from("modul_leksjon_kobling").select("*").in("modul_id", modulIder).order("rekkefolge")
      : Promise.resolve({ data: [] }),
  ]);

  const modulMap = new Map((modulerRes.data ?? []).map((m) => [m.id, m]));
  const leksjonKoblinger = leksjonKoblingerRes.data ?? [];
  const leksjonIder = [...new Set(leksjonKoblinger.map((k) => k.leksjon_id))];

  const { data: leksjonerRaw } = leksjonIder.length > 0
    ? await db.from("innhold_leksjon").select("id, tittel, xp_verdi, innhold_blokker").in("id", leksjonIder)
    : { data: [] };

  const leksjonMap = new Map(
    (leksjonerRaw ?? []).map((l) => [l.id, l as { id: string; tittel: FlerspraakligTekst; xp_verdi: number; innhold_blokker: InnholdsBlokk[] }])
  );

  // Student progress
  const { data: progresjonData } = await db
    .from("leksjon_progresjon")
    .select("*")
    .eq("paamelding_id", paamelding.id);

  const progresjonByLeksjon = new Map<string, LeksjonProgresjon>();
  const progresjonIder: string[] = [];
  for (const p of progresjonData ?? []) {
    progresjonByLeksjon.set(p.leksjon_id, p as LeksjonProgresjon);
    progresjonIder.push(p.id);
  }

  // Fetch all besvarelser for this student
  const { data: besvarelserRaw } = progresjonIder.length > 0
    ? await db.from("leksjon_besvarelse").select("*").in("progresjon_id", progresjonIder).order("innlevert_dato")
    : { data: [] };

  // Group besvarelser by progresjon_id and blokk_id — store ALL per blokk (sorted by date)
  const besvarelserByProgresjon = new Map<string, Map<string, LeksjonBesvarelse[]>>();
  for (const b of (besvarelserRaw ?? []).sort((a, b) =>
    (a.innlevert_dato ?? "").localeCompare(b.innlevert_dato ?? "")
  )) {
    const bv = b as LeksjonBesvarelse;
    const snapshot = bv.oppgave_snapshot as Record<string, unknown>;
    const blokkId = snapshot.blokk_id as string;
    if (!blokkId) continue;

    if (!besvarelserByProgresjon.has(bv.progresjon_id)) {
      besvarelserByProgresjon.set(bv.progresjon_id, new Map());
    }
    const inner = besvarelserByProgresjon.get(bv.progresjon_id)!;
    const list = inner.get(blokkId) ?? [];
    list.push(bv);
    inner.set(blokkId, list);
  }

  // XP and streak
  const { data: streakData } = await db
    .from("bruker_streak")
    .select("xp_opptjent, dato")
    .eq("bruker_id", params.brukerId)
    .order("dato", { ascending: false });

  const totalXp = (streakData ?? []).reduce((sum, r) => sum + (r.xp_opptjent ?? 0), 0);
  const level = Math.floor(totalXp / 100) + 1;
  const streak = beregnStreak((streakData ?? []).map((r) => r.dato));

  // Build ordered structure
  const orderedModuler = (kursModulKoblinger ?? []).map((kmk) => {
    const modul = modulMap.get(kmk.modul_id);
    if (!modul) return null;
    return {
      ...modul,
      leksjoner: leksjonKoblinger
        .filter((lk) => lk.modul_id === kmk.modul_id)
        .map((lk) => {
          const leksjon = leksjonMap.get(lk.leksjon_id);
          const prog = progresjonByLeksjon.get(lk.leksjon_id);
          const besvarelser: Map<string, LeksjonBesvarelse[]> | undefined = prog ? besvarelserByProgresjon.get(prog.id) : undefined;
          return { leksjon, prog, besvarelser };
        })
        .filter((item) => item.leksjon != null),
    };
  }).filter(Boolean);

  const fullfortTotalt = [...progresjonByLeksjon.values()].filter((p) => p.status === "fullfort").length;

  return (
    <div className="max-w-3xl">
      <div className="mb-1 flex items-center gap-2 text-sm text-gray-400">
        <Link href="/" className="hover:text-[#1B3A5C]">Mine klasser</Link>
        <span>/</span>
        <Link href={`/klasser/${params.id}`} className="hover:text-[#1B3A5C]">{klasse.tittel}</Link>
      </div>

      <h1 className="mt-1 text-2xl font-bold text-[#1B3A5C]">{student.navn}</h1>
      <p className="text-sm text-gray-400">{student.epost}</p>

      <div className="mt-5 grid grid-cols-3 gap-3">
        <StatCard label="Total XP" value={totalXp.toLocaleString("nb-NO")} />
        <StatCard label="Nivå" value={String(level)} />
        <StatCard label="Streak" value={`${streak} dag${streak !== 1 ? "er" : ""}`} />
      </div>

      <div className="mt-8 space-y-6">
        {orderedModuler.map((modul, mi) => {
          if (!modul) return null;
          const modulTittel = typeof modul.tittel === "object" ? (modul.tittel as FlerspraakligTekst).no : modul.tittel;
          const fullfortIModul = modul.leksjoner.filter((item) => item.prog?.status === "fullfort").length;

          return (
            <div key={modul.id}>
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-600">
                  Modul {mi + 1}: {modulTittel}
                </h2>
                <span className="text-xs text-gray-400">{fullfortIModul}/{modul.leksjoner.length}</span>
              </div>

              <div className="space-y-2">
                {modul.leksjoner.map((item) => {
                  if (!item.leksjon) return null;
                  const tittel = typeof item.leksjon.tittel === "object"
                    ? (item.leksjon.tittel as FlerspraakligTekst).no
                    : item.leksjon.tittel;
                  const status = item.prog?.status ?? "ikke_startet";
                  const mcBlokker = (item.leksjon.innhold_blokker ?? []).filter((b) => b.type === "multiple_choice");
                  const h5pBlokker = (item.leksjon.innhold_blokker ?? []).filter((b) => b.type === "h5p");
                  // MC uses latest besvarelse; H5P uses all
                  const mcBesvarelse = (blokkId: string) => {
                    const list = item.besvarelser?.get(blokkId) ?? [];
                    return list[list.length - 1];
                  };

                  return (
                    <div key={item.leksjon.id} className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                      {/* Leksjon header */}
                      <div className="flex items-center gap-3 px-4 py-3">
                        <StatusIkon status={status} />
                        <span className={`flex-1 text-sm font-medium ${status === "fullfort" ? "text-gray-800" : "text-gray-400"}`}>
                          {tittel}
                        </span>
                        <span className="text-xs text-gray-300">+{item.leksjon.xp_verdi} XP</span>
                        {item.prog?.sist_aktiv_dato && (
                          <span className="text-xs text-gray-300">
                            {new Date(item.prog.sist_aktiv_dato).toLocaleDateString("nb-NO", { day: "numeric", month: "short" })}
                          </span>
                        )}
                        {item.prog && status !== "ikke_startet" && (
                          <form action={nullstillLeksjonProgresjonAction}>
                            <input type="hidden" name="progresjon_id" value={item.prog.id} />
                            <input type="hidden" name="klasse_id" value={params.id} />
                            <input type="hidden" name="bruker_id" value={params.brukerId} />
                            <button
                              className="rounded-md border border-gray-200 px-2.5 py-1 text-xs text-gray-500 hover:border-[#1B3A5C] hover:text-[#1B3A5C] transition-colors"
                              title="Nullstill leksjonen slik at deltakeren kan gjøre den på nytt"
                            >
                              Prøv igjen
                            </button>
                          </form>
                        )}
                      </div>

                      {/* Svar på oppgaver */}
                      {(mcBlokker.length > 0 || h5pBlokker.length > 0) && item.prog && (
                        <div className="border-t border-gray-100 divide-y divide-gray-100">
                          {mcBlokker.map((blokk) => {
                            const mcData = blokk.data as MultipleChoiceBlokkData;
                            const besvarelse = mcBesvarelse(blokk.id);
                            const svar = besvarelse?.svar as { valgt_id?: string; forsok?: number } | undefined;
                            const riktig = (besvarelse?.score ?? 0) === 1;

                            return (
                              <div key={blokk.id} className="px-4 py-3 text-sm">
                                <p className="font-medium text-gray-700 mb-2">{mcData.sporsmaal.no}</p>
                                <div className="space-y-1">
                                  {mcData.alternativer.map((alt) => {
                                    const erValgt = alt.id === svar?.valgt_id;
                                    const erRiktig = alt.riktig;
                                    let bg = "bg-gray-50 text-gray-500";
                                    if (erValgt && riktig) bg = "bg-green-50 text-green-700 font-medium";
                                    if (erValgt && !riktig) bg = "bg-red-50 text-red-700 font-medium";
                                    if (!erValgt && erRiktig && svar) bg = "bg-green-50 text-green-600";
                                    return (
                                      <div key={alt.id} className={`flex items-center gap-2 rounded-lg px-3 py-1.5 ${bg}`}>
                                        <span className="shrink-0 text-xs">
                                          {erValgt && riktig ? "✓" : erValgt && !riktig ? "✗" : !erValgt && erRiktig && svar ? "→" : "·"}
                                        </span>
                                        <span>{alt.tekst.no}</span>
                                        {erValgt && <span className="ml-auto text-xs opacity-60">valgt</span>}
                                        {!erValgt && erRiktig && svar && <span className="ml-auto text-xs opacity-60">riktig svar</span>}
                                      </div>
                                    );
                                  })}
                                </div>
                                <div className="mt-2 flex items-center gap-3 text-xs text-gray-400">
                                  {!svar ? <span className="italic">Ikke besvart</span> : (
                                    <>
                                      <span>{riktig ? "✓ Riktig" : "✗ Feil"}</span>
                                      <span>·</span>
                                      <span>{svar.forsok ?? 1} forsøk</span>
                                      {besvarelse?.innlevert_dato && (
                                        <><span>·</span><span>{new Date(besvarelse.innlevert_dato).toLocaleDateString("nb-NO", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span></>
                                      )}
                                    </>
                                  )}
                                </div>
                              </div>
                            );
                          })}

                          {h5pBlokker.map((blokk, hi) => {
                            const alleH5P = item.besvarelser?.get(blokk.id) ?? [];
                            // Summary = last completed/passed/failed event; individual = answered events
                            const SUMMARY_VERBS = new Set([
                              "http://adlnet.gov/expapi/verbs/completed",
                              "http://adlnet.gov/expapi/verbs/passed",
                              "http://adlnet.gov/expapi/verbs/failed",
                              "http://adlnet.gov/expapi/verbs/mastered",
                            ]);
                            const summaryBv = [...alleH5P].reverse().find((b) => {
                              const v = (b.svar as { verb?: string } | null)?.verb ?? "";
                              return SUMMARY_VERBS.has(v);
                            });
                            const answeredBvs = alleH5P.filter((b) => {
                              const v = (b.svar as { verb?: string } | null)?.verb ?? "";
                              return v === "http://adlnet.gov/expapi/verbs/answered" ||
                                     v === "http://adlnet.gov/expapi/verbs/interacted";
                            });

                            return (
                              <div key={blokk.id} className="px-4 py-3 text-sm space-y-3">
                                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                                  H5P{h5pBlokker.length > 1 ? ` ${hi + 1}` : ""}
                                </p>

                                {alleH5P.length === 0 ? (
                                  <p className="italic text-gray-400">Ikke besvart ennå</p>
                                ) : (
                                  <>
                                    {/* Summary row */}
                                    {summaryBv && (() => {
                                      const svar = summaryBv.svar as H5PSvar;
                                      const harScore = svar.score_raw != null && svar.score_max != null && svar.score_max > 0;
                                      const prosent = harScore ? Math.round((svar.score_raw! / svar.score_max!) * 100) : null;
                                      const bestatt = harScore ? prosent! >= 60 : svar.success === true;
                                      const ikkebestatt = harScore ? prosent! < 60 : svar.success === false;
                                      return (
                                        <div className="space-y-1.5">
                                          <div className="flex items-center gap-3">
                                            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                              bestatt ? "bg-green-100 text-green-700" :
                                              ikkebestatt ? "bg-red-100 text-red-600" :
                                              "bg-gray-100 text-gray-500"
                                            }`}>
                                              {bestatt ? "Bestått" : ikkebestatt ? "Ikke bestått" : "Fullført"}
                                            </span>
                                            {harScore && (
                                              <span className="font-medium text-gray-700">
                                                {svar.score_raw} / {svar.score_max}
                                                <span className="ml-1 text-xs font-normal text-gray-400">({prosent}%)</span>
                                              </span>
                                            )}
                                            {svar.duration && (
                                              <span className="ml-auto text-xs text-gray-400">{formatDuration(svar.duration)}</span>
                                            )}
                                          </div>
                                          {harScore && (
                                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                                              <div
                                                className={`h-1.5 rounded-full transition-all ${bestatt ? "bg-green-500" : "bg-red-400"}`}
                                                style={{ width: `${prosent}%` }}
                                              />
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })()}

                                    {/* Individual answered events */}
                                    {answeredBvs.length > 0 && (
                                      <div className="space-y-2 border-t border-gray-100 pt-2">
                                        {answeredBvs.map((bv, qi) => {
                                          const svar = bv.svar as H5PSvar;
                                          const snapshot = bv.oppgave_snapshot as H5PSnapshot;
                                          const def = snapshot.definition as H5PDefinition | null | undefined;
                                          const sporsmal = def?.description?.["nb-NO"] ?? def?.description?.["en-US"] ?? null;
                                          const dekodetSvar = svar.response ? decodeH5PResponse(svar.response, def ?? null) : null;
                                          const dekodetRiktig = decodeH5PCorrectAnswer(def ?? null);
                                          const riktig = svar.success === true ||
                                            (svar.score_raw != null && svar.score_max != null && svar.score_raw === svar.score_max);

                                          return (
                                            <div key={qi} className="rounded-lg bg-gray-50 px-3 py-2 space-y-1">
                                              {sporsmal && (
                                                <p className="text-xs font-medium text-gray-600">{sporsmal}</p>
                                              )}
                                              {dekodetSvar && (
                                                <div className={`flex items-start gap-1.5 text-xs ${riktig ? "text-green-700" : "text-red-600"}`}>
                                                  <span className="shrink-0">{riktig ? "✓" : "✗"}</span>
                                                  <span>{dekodetSvar}</span>
                                                </div>
                                              )}
                                              {!riktig && dekodetRiktig && (
                                                <div className="flex items-start gap-1.5 text-xs text-green-600">
                                                  <span className="shrink-0">→</span>
                                                  <span className="text-gray-400">Riktig: </span>
                                                  <span>{dekodetRiktig}</span>
                                                </div>
                                              )}
                                              {!dekodetSvar && svar.response && (
                                                <p className="text-xs text-gray-500">{svar.response}</p>
                                              )}
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {orderedModuler.length === 0 && (
          <div className="rounded-xl border border-dashed border-gray-200 py-12 text-center text-sm text-gray-400">
            Ingen moduler i dette kurset
          </div>
        )}
      </div>

      <div className="mt-4 text-right text-xs text-gray-400">
        {fullfortTotalt} av {leksjonIder.length} leksjoner fullført
      </div>
    </div>
  );
}

function beregnStreak(datoer: string[]): number {
  if (datoer.length === 0) return 0;
  const iDag = new Date().toISOString().slice(0, 10);
  const iGaar = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (datoer[0] !== iDag && datoer[0] !== iGaar) return 0;
  let streak = 1;
  for (let i = 1; i < datoer.length; i++) {
    const a = new Date(datoer[i - 1]!).getTime();
    const b = new Date(datoer[i]!).getTime();
    if (Math.round((a - b) / 86400000) === 1) streak++;
    else break;
  }
  return streak;
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-4 py-3">
      <p className="text-xl font-bold text-[#1B3A5C]">{value}</p>
      <p className="text-xs text-gray-400">{label}</p>
    </div>
  );
}

// ── H5P-typer ────────────────────────────────────────────────────────────────

type H5PSvar = {
  verb?: string;
  score_raw?: number | null;
  score_max?: number | null;
  success?: boolean | null;
  response?: string | null;
  duration?: string | null;
};

type H5PDefinition = {
  description?: Record<string, string>;
  interactionType?: string;
  choices?: Array<{ id: string; description: Record<string, string> }>;
  correctResponsesPattern?: string[];
};

type H5PSnapshot = {
  blokk_id?: string;
  type?: string;
  activity_id?: string;
  verb?: string;
  definition?: H5PDefinition | null;
};

function decodeH5PResponse(response: string, def: H5PDefinition | null): string | null {
  if (!def || !response) return response || null;

  if (def.interactionType === "true-false") {
    return response === "true" ? "Sant" : "Usant";
  }

  if ((def.interactionType === "choice" || def.interactionType === "sequencing") && def.choices) {
    const ids = response.split(/\[,\]|,/).map((s) => s.trim());
    const texts = ids.map((id) => {
      const c = def.choices!.find((ch) => ch.id === id);
      return c?.description?.["nb-NO"] ?? c?.description?.["en-US"] ?? id;
    });
    return texts.join(", ");
  }

  // fill-in, long-fill-in, etc. — already human-readable
  return response;
}

function decodeH5PCorrectAnswer(def: H5PDefinition | null): string | null {
  if (!def?.correctResponsesPattern?.length) return null;

  const pattern = def.correctResponsesPattern[0]!;

  if (def.interactionType === "true-false") {
    return pattern === "true" ? "Sant" : "Usant";
  }

  if ((def.interactionType === "choice" || def.interactionType === "sequencing") && def.choices) {
    const ids = pattern.split(/\[,\]|,/).map((s) => s.trim());
    const texts = ids.map((id) => {
      const c = def.choices!.find((ch) => ch.id === id);
      return c?.description?.["nb-NO"] ?? c?.description?.["en-US"] ?? id;
    });
    return texts.join(", ");
  }

  return pattern;
}

// ISO 8601 duration → "2 min 30 sek"
function formatDuration(iso: string): string {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?/);
  if (!m) return iso;
  const h = parseInt(m[1] ?? "0");
  const min = parseInt(m[2] ?? "0") + h * 60;
  const sek = Math.round(parseFloat(m[3] ?? "0"));
  if (min > 0 && sek > 0) return `${min} min ${sek} sek`;
  if (min > 0) return `${min} min`;
  return `${sek} sek`;
}

function StatusIkon({ status }: { status: string }) {
  if (status === "fullfort") return <span className="text-base">⭐</span>;
  if (status === "paabegynt")
    return (
      <span className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-blue-400 text-xs text-blue-400">½</span>
    );
  return <span className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-gray-200" />;
}
