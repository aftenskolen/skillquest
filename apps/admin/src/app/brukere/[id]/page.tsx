import { notFound } from "next/navigation";
import { createServerClient } from "@novolms/db/server";
import type { Bruker, BrukerRolle, RolleDefinisjon } from "@novolms/db/types";
import { SubmitButton } from "@/components/SubmitButton";
import { KurshistorikkSeksjon } from "@/components/KurshistorikkSeksjon";
import { tildelRolleAction, fjernRolleAction, oppdaterBrukerAction } from "./actions";

function beregnStreak(datoer: string[]): number {
  if (datoer.length === 0) return 0;
  const sortert = [...datoer].sort().reverse();
  const iDag = new Date().toISOString().slice(0, 10);
  const iGaar = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (sortert[0] !== iDag && sortert[0] !== iGaar) return 0;
  let streak = 1;
  for (let i = 1; i < sortert.length; i++) {
    const a = new Date(sortert[i - 1]!).getTime();
    const b = new Date(sortert[i]!).getTime();
    if (Math.round((a - b) / 86400000) === 1) streak++;
    else break;
  }
  return streak;
}

interface Props {
  params: { id: string };
  searchParams: { error?: string; lagret?: string };
}

export default async function BrukerDetaljPage({ params, searchParams }: Props) {
  const db = createServerClient();

  const { data: rawBruker } = await db.from("bruker").select("*").eq("id", params.id).single();
  if (!rawBruker) notFound();
  const b = rawBruker as Bruker;

  const [{ data: rawBrukerRoller }, { data: alleRollerRaw }, { data: rawStreak }] = await Promise.all([
    db.from("bruker_rolle").select("id, rolle_id, status, rolle_definisjon ( id, navn )").eq("bruker_id", params.id),
    db.from("rolle_definisjon").select("id, navn").order("navn"),
    db.from("bruker_streak").select("dato, xp_opptjent").eq("bruker_id", params.id).order("dato", { ascending: false }),
  ]);

  const streakRader = (rawStreak ?? []) as { dato: string; xp_opptjent: number }[];
  const totalXp = streakRader.reduce((sum, r) => sum + r.xp_opptjent, 0);
  const level = Math.floor(totalXp / 100) + 1;
  const xpInneverendeLevel = totalXp % 100;
  const streak = beregnStreak(streakRader.map((r) => r.dato));

  const brukerRoller = (rawBrukerRoller ?? []) as unknown as Array<
    Pick<BrukerRolle, "id" | "rolle_id" | "status"> & { rolle_definisjon: Pick<RolleDefinisjon, "id" | "navn"> | null }
  >;
  const roller = (alleRollerRaw ?? []) as Pick<RolleDefinisjon, "id" | "navn">[];
  const tildeltRolleIds = new Set(brukerRoller.map((br) => br.rolle_definisjon?.id).filter(Boolean));
  const tilgjengeligeRoller = roller.filter((r) => !tildeltRolleIds.has(r.id));

  const f = (val: string | null | undefined) => val ?? "";

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <a href="/brukere" className="text-sm text-gray-500 hover:text-[#1B3A5C]">← Tilbake til brukere</a>
      </div>

      {searchParams.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{searchParams.error}</div>
      )}
      {searchParams.lagret && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">✓ Endringer lagret</div>
      )}

      <form action={oppdaterBrukerAction} className="rounded-xl bg-white border border-gray-200 divide-y divide-gray-100">
        <input type="hidden" name="id" value={b.id} />

        {/* Systeminfo (readonly) */}
        <div className="px-6 py-4">
          <h2 className="text-base font-semibold text-[#1B3A5C] mb-3">Systeminfo</h2>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-gray-500 text-xs mb-0.5">Brukernummer</p>
              <p className="font-mono font-medium">{b.bruker_nr}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs mb-0.5">E-post</p>
              <p className="font-medium">{b.epost}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs mb-0.5">Registrert</p>
              <p className="font-medium">{new Date(b.opprettet_dato).toLocaleDateString("nb-NO")}</p>
            </div>
          </div>
        </div>

        {/* Kontaktinfo */}
        <div className="px-6 py-4 space-y-4">
          <h2 className="text-base font-semibold text-[#1B3A5C]">Kontaktinformasjon</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Fullt navn *</label>
              <input name="navn" required defaultValue={b.navn} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#1B3A5C] focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Telefon</label>
              <input name="telefon" defaultValue={f(b.telefon)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#1B3A5C] focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Adresse</label>
            <input name="adresse" defaultValue={f(b.adresse)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#1B3A5C] focus:outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Postnummer</label>
              <input name="postnummer" defaultValue={f(b.postnummer)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#1B3A5C] focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Poststed</label>
              <input name="poststed" defaultValue={f(b.poststed)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#1B3A5C] focus:outline-none" />
            </div>
          </div>
        </div>

        {/* Personopplysninger */}
        <div className="px-6 py-4 space-y-4">
          <h2 className="text-base font-semibold text-[#1B3A5C]">Personopplysninger</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Fødselsdato</label>
              <input type="date" name="fodselsdato" defaultValue={f(b.fodselsdato)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#1B3A5C] focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Kjønn</label>
              <select name="kjonn" defaultValue={b.kjonn ?? ""} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#1B3A5C] focus:outline-none">
                <option value="">– Ikke oppgitt –</option>
                <option value="mann">Mann</option>
                <option value="kvinne">Kvinne</option>
                <option value="ikke_oppgitt">Vil ikke oppgi</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Morsmål</label>
              <input name="morsmaal" defaultValue={f(b.morsmaal)} placeholder="f.eks. arabisk, somalisk" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#1B3A5C] focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Utdanningsnivå</label>
              <select name="utdanningsnivaa" defaultValue={b.utdanningsnivaa ?? ""} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#1B3A5C] focus:outline-none">
                <option value="">– Ikke oppgitt –</option>
                <option value="grunnskole">Grunnskole</option>
                <option value="vgs">Videregående skole</option>
                <option value="fagbrev">Fagbrev</option>
                <option value="hoeyere">Høyere utdanning</option>
                <option value="ukjent">Ukjent</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Foretrukket språk</label>
              <select name="foretrukket_sprak" defaultValue={b.foretrukket_sprak || "no"} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#1B3A5C] focus:outline-none">
                <option value="no">Norsk</option>
                <option value="en">Engelsk</option>
                <option value="ar">Arabisk</option>
                <option value="so">Somali</option>
                <option value="ti">Tigrinja</option>
              </select>
            </div>
          </div>
        </div>

        {/* Sensitiv info */}
        <div className="px-6 py-4 space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-[#1B3A5C]">Sensitiv informasjon</h2>
            <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">Personvern</span>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Fødselsnummer</label>
            <input name="fodselsnummer" defaultValue={f(b.fodselsnummer)} maxLength={11} placeholder="11 siffer" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:border-[#1B3A5C] focus:outline-none" />
            <p className="mt-1 text-xs text-gray-400">Lagres kryptert. Kun tilgjengelig for autoriserte brukere.</p>
          </div>
        </div>

        {/* Adminnotat + status */}
        <div className="px-6 py-4 space-y-4">
          <h2 className="text-base font-semibold text-[#1B3A5C]">Adminnotat</h2>
          <textarea name="notat" rows={3} defaultValue={f(b.notat)} placeholder="Interne notater om denne brukeren (vises ikke for brukeren)" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#1B3A5C] focus:outline-none resize-none" />
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-3">
              <label className="text-xs font-medium text-gray-600">Status</label>
              <select name="aktiv" defaultValue={b.aktiv ? "true" : "false"} className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#1B3A5C] focus:outline-none">
                <option value="true">Aktiv</option>
                <option value="false">Inaktiv</option>
              </select>
            </div>
            <SubmitButton label="Lagre endringer" />
          </div>
        </div>
      </form>

      {/* XP & Streak */}
      <div className="rounded-xl bg-white border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-[#1B3A5C] mb-4">XP & Nivå</h2>
        <div className="grid grid-cols-3 gap-6 mb-5">
          <div className="text-center rounded-lg bg-[#1B3A5C]/5 py-4">
            <p className="text-3xl font-bold text-[#1B3A5C]">{totalXp}</p>
            <p className="text-xs text-gray-500 mt-0.5">Total XP</p>
          </div>
          <div className="text-center rounded-lg bg-[#1B3A5C]/5 py-4">
            <p className="text-3xl font-bold text-[#1B3A5C]">{level}</p>
            <p className="text-xs text-gray-500 mt-0.5">Nivå</p>
          </div>
          <div className="text-center rounded-lg bg-orange-50 py-4">
            <p className="text-3xl font-bold text-orange-500">{streak}</p>
            <p className="text-xs text-gray-500 mt-0.5">Dagers streak 🔥</p>
          </div>
        </div>
        <div>
          <div className="flex justify-between text-xs text-gray-500 mb-1.5">
            <span>Nivå {level}</span>
            <span>{xpInneverendeLevel} / 100 XP</span>
          </div>
          <div className="h-2 w-full rounded-full bg-gray-100">
            <div
              className="h-2 rounded-full bg-[#1B3A5C] transition-all"
              style={{ width: `${xpInneverendeLevel}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">{100 - xpInneverendeLevel} XP til nivå {level + 1}</p>
        </div>
        {streakRader.length > 0 && (
          <div className="mt-4 border-t border-gray-100 pt-4">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Siste aktivitet</p>
            <div className="flex gap-1.5 flex-wrap">
              {streakRader.slice(0, 14).map((r) => (
                <div
                  key={r.dato}
                  title={`${r.dato}: ${r.xp_opptjent} XP`}
                  className="flex flex-col items-center gap-0.5"
                >
                  <div className={`w-7 h-7 rounded-md flex items-center justify-center text-xs font-medium ${
                    r.xp_opptjent > 0 ? "bg-[#1B3A5C] text-white" : "bg-gray-100 text-gray-400"
                  }`}>
                    {r.xp_opptjent}
                  </div>
                  <span className="text-[9px] text-gray-400">{r.dato.slice(8)}/{r.dato.slice(5, 7)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Kurshistorikk */}
      <KurshistorikkSeksjon brukerId={b.id} />

      {/* Roller */}
      <div className="rounded-xl bg-white border border-gray-200 p-6 space-y-4">
        <h2 className="text-base font-semibold text-[#1B3A5C]">Roller</h2>
        {brukerRoller.length === 0 ? (
          <p className="text-sm text-gray-400">Ingen roller tildelt</p>
        ) : (
          <div className="space-y-2">
            {brukerRoller.map((br) => (
              <div key={br.id} className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2">
                <span className="text-sm font-medium text-gray-800">{br.rolle_definisjon?.navn ?? "Ukjent"}</span>
                <form action={fjernRolleAction}>
                  <input type="hidden" name="bruker_rolle_id" value={br.id} />
                  <input type="hidden" name="bruker_id" value={b.id} />
                  <button type="submit" className="text-xs text-red-500 hover:text-red-700">Fjern</button>
                </form>
              </div>
            ))}
          </div>
        )}
        {tilgjengeligeRoller.length > 0 && (
          <form action={tildelRolleAction} className="flex gap-3 pt-2 border-t border-gray-100">
            <input type="hidden" name="bruker_id" value={b.id} />
            <select name="rolle_id" className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#1B3A5C] focus:outline-none">
              {tilgjengeligeRoller.map((r) => (
                <option key={r.id} value={r.id}>{r.navn}</option>
              ))}
            </select>
            <SubmitButton label="Tildel rolle" loadingLabel="Tildeler…" />
          </form>
        )}
      </div>
    </div>
  );
}
