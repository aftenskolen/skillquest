import { createServerClient } from "@novolms/db/server";
import type { InnholdModul } from "@novolms/db/types";

export default async function ModulerListePage() {
  const db = createServerClient();

  const [{ data: rawModuler }, { data: rawKursKoblinger }] = await Promise.all([
    db.from("innhold_modul").select("id, tittel, tags").order("tittel->no"),
    db.from("kurs_modul_kobling").select("modul_id, kurs_id, kurs ( id, tittel )"),
  ]);

  const moduler = (rawModuler ?? []) as Pick<InnholdModul, "id" | "tittel" | "tags">[];

  // modul_id → [{ kursId, kursTittel }]
  const kursPerModul = new Map<string, { kursId: string; kursTittel: string }[]>();
  for (const k of (rawKursKoblinger ?? []) as unknown as Array<{
    modul_id: string;
    kurs_id: string;
    kurs: { id: string; tittel: { no: string } } | null;
  }>) {
    if (!k.kurs) continue;
    const liste = kursPerModul.get(k.modul_id) ?? [];
    liste.push({ kursId: k.kurs_id, kursTittel: k.kurs.tittel.no });
    kursPerModul.set(k.modul_id, liste);
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#1B3A5C]">Moduler</h1>
        <a
          href="/moduler/ny"
          className="rounded-lg bg-[#1B3A5C] px-4 py-2 text-sm font-medium text-white hover:bg-[#162f4a] transition-colors"
        >
          + Opprett modul
        </a>
      </div>

      <div className="rounded-xl bg-white border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-4 py-3 text-left font-medium text-gray-600">Modul</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Kurs</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Emneord</th>
            </tr>
          </thead>
          <tbody>
            {moduler.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-gray-400">Ingen moduler opprettet ennå</td>
              </tr>
            )}
            {moduler.map((m) => {
              const kurs = kursPerModul.get(m.id) ?? [];
              return (
                <tr key={m.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">
                    <a href={`/moduler/${m.id}/rediger`} className="text-[#1B3A5C] hover:underline">
                      {(m.tittel as { no: string }).no}
                    </a>
                  </td>
                  <td className="px-4 py-3">
                    {kurs.length === 0 ? (
                      <span className="text-gray-400 text-xs italic">Ikke koblet</span>
                    ) : (
                      <div className="space-y-0.5">
                        {kurs.map((k) => (
                          <div key={k.kursId}>
                            <a href={`/kurs/${k.kursId}/rediger`} className="text-xs text-[#1B3A5C] hover:underline">
                              {k.kursTittel}
                            </a>
                          </div>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{(m.tags ?? []).join(", ") || "–"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
