import { createServerClient } from "@novolms/db/server";
import type { InnholdLeksjon } from "@novolms/db/types";

type LeksjonRad = Pick<InnholdLeksjon, "id" | "tittel" | "status" | "leksjon_type" | "estimert_tid_min">;

type KoblingInfo = {
  modulId: string;
  modulTittel: string;
  kursId: string;
  kursTittel: string;
};

const statusFarge: Record<InnholdLeksjon["status"], string> = {
  utkast: "bg-gray-100 text-gray-600",
  til_review: "bg-yellow-100 text-yellow-700",
  publisert: "bg-green-100 text-green-700",
  arkivert: "bg-red-100 text-red-600",
};

const statusEtikett: Record<InnholdLeksjon["status"], string> = {
  utkast: "Utkast",
  til_review: "Til review",
  publisert: "Publisert",
  arkivert: "Arkivert",
};

export default async function LeksjonerListePage() {
  const db = createServerClient();

  const [
    { data: rawLeksjoner },
    { data: rawModulKoblinger },
    { data: rawKursKoblinger },
  ] = await Promise.all([
    db.from("innhold_leksjon")
      .select("id, tittel, status, leksjon_type, estimert_tid_min")
      .order("tittel->no"),
    db.from("modul_leksjon_kobling")
      .select("leksjon_id, modul_id, innhold_modul ( id, tittel )"),
    db.from("kurs_modul_kobling")
      .select("modul_id, kurs_id, kurs ( id, tittel )"),
  ]);

  const leksjoner = (rawLeksjoner ?? []) as LeksjonRad[];

  // modul_id → kurs-info
  const kursPerModul = new Map<string, { kursId: string; kursTittel: string }>();
  for (const k of (rawKursKoblinger ?? []) as unknown as Array<{
    modul_id: string;
    kurs_id: string;
    kurs: { id: string; tittel: { no: string } } | null;
  }>) {
    if (k.kurs) {
      kursPerModul.set(k.modul_id, { kursId: k.kurs_id, kursTittel: k.kurs.tittel.no });
    }
  }

  // leksjon_id → [KoblingInfo]
  const koblingerPerLeksjon = new Map<string, KoblingInfo[]>();
  for (const mk of (rawModulKoblinger ?? []) as unknown as Array<{
    leksjon_id: string;
    modul_id: string;
    innhold_modul: { id: string; tittel: { no: string } } | null;
  }>) {
    if (!mk.innhold_modul) continue;
    const kursInfo = kursPerModul.get(mk.modul_id);
    const info: KoblingInfo = {
      modulId: mk.modul_id,
      modulTittel: mk.innhold_modul.tittel.no,
      kursId: kursInfo?.kursId ?? "",
      kursTittel: kursInfo?.kursTittel ?? "–",
    };
    const eksisterende = koblingerPerLeksjon.get(mk.leksjon_id) ?? [];
    eksisterende.push(info);
    koblingerPerLeksjon.set(mk.leksjon_id, eksisterende);
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#1B3A5C]">Leksjoner</h1>
        <a
          href="/leksjoner/ny"
          className="rounded-lg bg-[#1B3A5C] px-4 py-2 text-sm font-medium text-white hover:bg-[#162f4a] transition-colors"
        >
          + Opprett leksjon
        </a>
      </div>

      <div className="rounded-xl bg-white border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-4 py-3 text-left font-medium text-gray-600">Leksjon</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Kurs</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Modul</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Tid</th>
            </tr>
          </thead>
          <tbody>
            {leksjoner.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                  Ingen leksjoner opprettet ennå
                </td>
              </tr>
            )}
            {leksjoner.map((l) => {
              const koblinger = koblingerPerLeksjon.get(l.id) ?? [];
              return (
                <tr key={l.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">
                    <a href={`/leksjoner/${l.id}/rediger`} className="text-[#1B3A5C] hover:underline">
                      {(l.tittel as { no: string }).no}
                    </a>
                  </td>
                  <td className="px-4 py-3">
                    {koblinger.length === 0 ? (
                      <span className="text-gray-400 text-xs italic">Ikke koblet</span>
                    ) : (
                      <div className="space-y-0.5">
                        {koblinger.map((k, i) => (
                          <div key={i}>
                            {k.kursId ? (
                              <a href={`/kurs/${k.kursId}/rediger`} className="text-xs text-[#1B3A5C] hover:underline">
                                {k.kursTittel}
                              </a>
                            ) : (
                              <span className="text-xs text-gray-400">–</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {koblinger.length === 0 ? (
                      <span className="text-gray-400 text-xs italic">–</span>
                    ) : (
                      <div className="space-y-0.5">
                        {koblinger.map((k, i) => (
                          <div key={i}>
                            <a href={`/moduler/${k.modulId}/rediger`} className="text-xs text-[#1B3A5C] hover:underline">
                              {k.modulTittel}
                            </a>
                          </div>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusFarge[l.status]}`}>
                      {statusEtikett[l.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {l.estimert_tid_min ? `${l.estimert_tid_min} min` : "–"}
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
