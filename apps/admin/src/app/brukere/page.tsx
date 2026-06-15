import { createServerClient } from "@novolms/db/server";
import type { Bruker, BrukerRolle, RolleDefinisjon } from "@novolms/db/types";

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

export default async function BrukereListePage() {
  const db = createServerClient();

  const [{ data: rawBrukere }, { data: rawRoller }, { data: rawStreak }] = await Promise.all([
    db.from("bruker").select("id, navn, epost, aktiv, opprettet_dato").order("opprettet_dato", { ascending: false }),
    db.from("bruker_rolle").select("bruker_id, rolle_definisjon ( navn )").eq("status", "aktiv"),
    db.from("bruker_streak").select("bruker_id, dato, xp_opptjent"),
  ]);

  const brukere = (rawBrukere ?? []) as Pick<Bruker, "id" | "navn" | "epost" | "aktiv" | "opprettet_dato">[];
  const rolleRader = (rawRoller ?? []) as unknown as Array<
    Pick<BrukerRolle, "bruker_id"> & { rolle_definisjon: Pick<RolleDefinisjon, "navn"> | null }
  >;
  const streakRader = (rawStreak ?? []) as { bruker_id: string; dato: string; xp_opptjent: number }[];

  const rollerPerBruker = new Map<string, string[]>();
  for (const r of rolleRader) {
    const navn = r.rolle_definisjon?.navn;
    if (!navn) continue;
    const liste = rollerPerBruker.get(r.bruker_id) ?? [];
    liste.push(navn);
    rollerPerBruker.set(r.bruker_id, liste);
  }

  const xpPerBruker = new Map<string, number>();
  const datoerPerBruker = new Map<string, string[]>();
  for (const s of streakRader) {
    xpPerBruker.set(s.bruker_id, (xpPerBruker.get(s.bruker_id) ?? 0) + s.xp_opptjent);
    const datoer = datoerPerBruker.get(s.bruker_id) ?? [];
    datoer.push(s.dato);
    datoerPerBruker.set(s.bruker_id, datoer);
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#1B3A5C]">Brukere</h1>
        <div className="flex items-center gap-4">
          <p className="text-sm text-gray-500">{brukere.length} totalt</p>
          <a
            href="/brukere/ny"
            className="rounded-lg bg-[#1B3A5C] px-4 py-2 text-sm font-medium text-white hover:bg-[#162f4a] transition-colors"
          >
            + Opprett bruker
          </a>
        </div>
      </div>

      <div className="rounded-xl bg-white border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-4 py-3 text-left font-medium text-gray-600">Navn</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">E-post</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Roller</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">XP / Nivå</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Streak</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Registrert</th>
            </tr>
          </thead>
          <tbody>
            {brukere.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                  Ingen brukere registrert ennå
                </td>
              </tr>
            )}
            {brukere.map((b) => {
              const roller = rollerPerBruker.get(b.id) ?? [];
              const totalXp = xpPerBruker.get(b.id) ?? 0;
              const level = Math.floor(totalXp / 100) + 1;
              const streak = beregnStreak(datoerPerBruker.get(b.id) ?? []);
              return (
                <tr key={b.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium">
                    <a href={`/brukere/${b.id}`} className="text-[#1B3A5C] hover:underline">{b.navn}</a>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{b.epost}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {roller.length === 0 ? (
                        <span className="text-gray-400">–</span>
                      ) : (
                        roller.map((r) => (
                          <span
                            key={r}
                            className="inline-flex items-center rounded-full bg-[#1B3A5C]/10 px-2 py-0.5 text-xs font-medium text-[#1B3A5C]"
                          >
                            {r}
                          </span>
                        ))
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {totalXp > 0 ? (
                      <div>
                        <span className="font-medium text-[#1B3A5C]">{totalXp} XP</span>
                        <span className="ml-1.5 text-xs text-gray-400">Nivå {level}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-xs">–</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {streak > 0 ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2.5 py-0.5 text-xs font-medium text-orange-600">
                        🔥 {streak} dag{streak !== 1 ? "er" : ""}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs">–</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${b.aktiv ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {b.aktiv ? "Aktiv" : "Inaktiv"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(b.opprettet_dato).toLocaleDateString("nb-NO")}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
