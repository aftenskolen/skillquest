import Link from "next/link";
import { redirect } from "next/navigation";
import { hentInnloggetBruker } from "@novolms/auth";
import { createServerClient } from "@novolms/db/server";

export default async function DashboardPage() {
  const brukerData = await hentInnloggetBruker();
  if (!brukerData) redirect("/auth/logg-inn");
  const { bruker } = brukerData;
  const db = createServerClient();

  const iDag = new Date().toISOString().slice(0, 10);

  const [{ data: paameldinger }, { data: streakRader }, { data: loginXpKonfig }] = await Promise.all([
    db
      .from("paamelding")
      .select(`
        id,
        status,
        tilgang_til,
        klasse (
          id,
          tittel,
          kurs (
            id,
            tittel,
            slug,
            kurstype,
            cefr_nivaa
          )
        )
      `)
      .eq("bruker_id", bruker.id)
      .in("status", ["aktiv", "paameldt"]),
    db
      .from("bruker_streak")
      .select("dato, xp_opptjent, innlogging_tildelt")
      .eq("bruker_id", bruker.id)
      .order("dato", { ascending: false }),
    db
      .from("xp_konfigurasjon")
      .select("xp_verdi")
      .eq("handling", "daglig_innlogging")
      .maybeSingle(),
  ]);

  // Hent neste samling per klasse
  const klasseIder = (paameldinger ?? []).map((p) => {
    const klasse = p.klasse as unknown as { id: string } | null;
    return klasse?.id;
  }).filter(Boolean) as string[];

  const { data: samlinger } = klasseIder.length > 0
    ? await db.from("samling")
        .select("*")
        .in("klasse_id", klasseIder)
        .eq("status", "planlagt")
        .gte("dato_tid", new Date().toISOString())
        .order("dato_tid")
    : { data: [] };

  const nesteSamling = new Map<string, { id: string; klasse_id: string; type: string; dato_tid: string; varighet_timer: number | null; sted_eller_lenke: string | null; status: string; notat: string | null }>();
  for (const s of samlinger ?? []) {
    if (!nesteSamling.has(s.klasse_id)) nesteSamling.set(s.klasse_id, s);
  }

  // Tildel innloggings-XP første gang per dag
  const dagensRad = (streakRader ?? []).find((r) => r.dato === iDag);
  const innloggingXp = loginXpKonfig?.xp_verdi ?? 5;
  if (!dagensRad) {
    await db.from("bruker_streak").insert({
      bruker_id: bruker.id,
      dato: iDag,
      xp_opptjent: innloggingXp,
      innlogging_tildelt: true,
      streak_frys_brukt: false,
    });
  } else if (!dagensRad.innlogging_tildelt) {
    await db
      .from("bruker_streak")
      .update({ xp_opptjent: dagensRad.xp_opptjent + innloggingXp, innlogging_tildelt: true })
      .eq("bruker_id", bruker.id)
      .eq("dato", iDag);
  }

  // Beregn totalt XP inkl. dagens eventuelle nye innlogging
  const alleStreakRader = (streakRader ?? []) as { dato: string; xp_opptjent: number; innlogging_tildelt: boolean }[];
  const totalXp = alleStreakRader.reduce((sum, r) => {
    const xp = r.dato === iDag && !r.innlogging_tildelt ? r.xp_opptjent + innloggingXp : r.xp_opptjent;
    return sum + xp;
  }, dagensRad ? 0 : innloggingXp);

  const xpPerLevel = 100;
  const level = Math.floor(totalXp / xpPerLevel) + 1;
  const xpInneverendeLevel = totalXp % xpPerLevel;
  const prosent = Math.round((xpInneverendeLevel / xpPerLevel) * 100);

  // Beregn streak
  const alleDatoer = alleStreakRader.map((r) => r.dato);
  if (!alleDatoer.includes(iDag)) alleDatoer.unshift(iDag);
  const sortert = [...alleDatoer].sort().reverse();
  const iGaar = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  let streakDager = 0;
  if (sortert[0] === iDag || sortert[0] === iGaar) {
    streakDager = 1;
    for (let i = 1; i < sortert.length; i++) {
      const a = new Date(sortert[i - 1]!).getTime();
      const b = new Date(sortert[i]!).getTime();
      if (Math.round((a - b) / 86400000) === 1) streakDager++;
      else break;
    }
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#1B3A5C]">
            Hei, {bruker.navn}!
          </h1>
          <p className="mt-1 text-gray-500">Mine kurs</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white px-5 py-3 shadow-sm min-w-[220px] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Nivå {level}</span>
            <span className="text-sm font-bold text-[#1B3A5C]">{totalXp} XP</span>
          </div>
          <div className="h-2 w-full rounded-full bg-gray-100">
            <div
              className="h-2 rounded-full bg-[#1B3A5C] transition-all"
              style={{ width: `${prosent}%` }}
            />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-400">{xpInneverendeLevel} / {xpPerLevel} XP til nivå {level + 1}</p>
            {streakDager > 0 && (
              <span className="text-xs font-medium text-orange-500">🔥 {streakDager} dager</span>
            )}
          </div>
        </div>
      </div>

      {!paameldinger?.length ? (
        <p className="mt-8 text-gray-400">Du er ikke påmeldt noen kurs ennå.</p>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {paameldinger.map((p) => {
            const klasse = p.klasse as unknown as { id: string; tittel: string; kurs: { id: string; tittel: { no: string }; slug: string; kurstype: string; cefr_nivaa: string | null } } | null;
            const samling = klasse?.id ? nesteSamling.get(klasse.id) : undefined;
            if (!klasse?.kurs) return null;
            const kurs = klasse.kurs;
            return (
              <Link
                key={p.id}
                href={`/kurs/${kurs.slug}`}
                className="group rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:border-[#1B3A5C] hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                      {kurs.kurstype.replace(/_/g, " ")}
                      {kurs.cefr_nivaa && kurs.cefr_nivaa !== "ingen" ? ` · ${kurs.cefr_nivaa}` : ""}
                    </p>
                    <h2 className="mt-1 text-lg font-semibold text-[#1B3A5C] group-hover:underline">
                      {kurs.tittel.no}
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">{klasse.tittel}</p>
                  </div>
                  <span className="text-2xl text-gray-300 group-hover:text-[#1B3A5C] transition-colors">→</span>
                </div>
                <div className="mt-4">
                  <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                    p.status === "aktiv" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                  }`}>
                    {p.status === "aktiv" ? "Aktiv" : "Påmeldt"}
                  </span>
                </div>
                {samling && (() => {
                  const dato = new Date(samling.dato_tid);
                  const datoTekst = dato.toLocaleDateString("nb-NO", { weekday: "short", day: "numeric", month: "short" });
                  const klokkeTekst = "kl. " + dato.toLocaleTimeString("nb-NO", { hour: "2-digit", minute: "2-digit" });
                  const typeTekst: Record<string, string> = { fysisk: "Fysisk", virtuell: "Virtuell", discord: "Discord", asynkron: "Asynkron" };
                  const typeLabel = typeTekst[samling.type] ?? samling.type;
                  return (
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-500">
                      <span>📅</span>
                      <span>{datoTekst} · {klokkeTekst}</span>
                      <span className="rounded bg-gray-100 px-1 py-0.5 text-[10px] font-medium text-gray-600">{typeLabel}</span>
                      {samling.sted_eller_lenke && (
                        <span className="truncate max-w-[120px] text-gray-400">{samling.sted_eller_lenke}</span>
                      )}
                    </div>
                  );
                })()}
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
