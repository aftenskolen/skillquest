import { createServerClient } from "@novolms/db/server";
import type { Kurs } from "@novolms/db/types";

const kursTyepEtiketter: Record<Kurs["kurstype"], string> = {
  norsk: "Norsk",
  samfunnskunnskap: "Samfunnskunnskap",
  norsk_og_samfunnskunnskap: "Norsk og samfunnskunnskap",
  fagbrev: "Fagbrev",
  arbeidsliv: "Arbeidsliv",
  livsmestring: "Livsmestring",
  annet: "Annet",
};

export default async function KursListePage() {
  const db = createServerClient();

  const { data: kursliste } = await db
    .from("kurs")
    .select("*")
    .order("opprettet_dato", { ascending: false });

  const kurs = (kursliste ?? []) as Kurs[];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#1B3A5C]">Kurs</h1>
        <a
          href="/kurs/ny"
          className="rounded-lg bg-[#1B3A5C] px-4 py-2 text-sm font-medium text-white hover:bg-[#162f4a] transition-colors"
        >
          + Opprett kurs
        </a>
      </div>

      <div className="rounded-xl bg-white border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-4 py-3 text-left font-medium text-gray-600">Tittel</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Type</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">CEFR</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Opprettet</th>
            </tr>
          </thead>
          <tbody>
            {kurs.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                  Ingen kurs registrert ennå
                </td>
              </tr>
            )}
            {kurs.map((k) => (
              <tr key={k.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-medium text-[#1B3A5C]">
                  <a href={`/kurs/${k.id}/rediger`} className="hover:underline">
                    {(k.tittel as { no: string }).no}
                  </a>
                </td>
                <td className="px-4 py-3 text-gray-600">{kursTyepEtiketter[k.kurstype]}</td>
                <td className="px-4 py-3 text-gray-600">{k.cefr_nivaa ?? "–"}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      k.aktiv ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {k.aktiv ? "Aktiv" : "Inaktiv"}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {new Date(k.opprettet_dato).toLocaleDateString("nb-NO")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
