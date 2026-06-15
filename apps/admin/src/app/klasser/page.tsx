import { createServerClient } from "@novolms/db/server";
import type { Klasse, Kurs } from "@novolms/db/types";

const statusEtikett: Record<Klasse["status"], string> = {
  planlagt: "Planlagt",
  aktiv: "Aktiv",
  avsluttet: "Avsluttet",
  avlyst: "Avlyst",
};

const statusFarge: Record<Klasse["status"], string> = {
  planlagt: "bg-blue-100 text-blue-700",
  aktiv: "bg-green-100 text-green-700",
  avsluttet: "bg-gray-100 text-gray-600",
  avlyst: "bg-red-100 text-red-600",
};

export default async function KlasseListePage() {
  const db = createServerClient();

  const { data: rawKlasser } = await db
    .from("klasse")
    .select(`
      *,
      kurs ( tittel ),
      paamelding ( id )
    `)
    .order("start_dato", { ascending: false });

  const klasser = (rawKlasser ?? []) as Array<
    Klasse & {
      kurs: { tittel: { no: string } } | null;
      paamelding: { id: string }[];
    }
  >;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#1B3A5C]">Klasser</h1>
        <a
          href="/klasser/ny"
          className="rounded-lg bg-[#1B3A5C] px-4 py-2 text-sm font-medium text-white hover:bg-[#162f4a] transition-colors"
        >
          + Opprett klasse
        </a>
      </div>

      <div className="rounded-xl bg-white border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-4 py-3 text-left font-medium text-gray-600">Tittel</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Kurs</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Sted</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Start</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Slutt</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Deltakere</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
            </tr>
          </thead>
          <tbody>
            {klasser.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                  Ingen klasser registrert ennå
                </td>
              </tr>
            )}
            {klasser.map((k) => (
              <tr key={k.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <a
                    href={`/klasser/${k.id}`}
                    className="font-medium text-[#1B3A5C] hover:underline"
                  >
                    {k.tittel}
                  </a>
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {k.kurs?.tittel?.no ?? "–"}
                </td>
                <td className="px-4 py-3 text-gray-600">{k.sted ?? "–"}</td>
                <td className="px-4 py-3 text-gray-500">
                  {new Date(k.start_dato).toLocaleDateString("nb-NO")}
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {new Date(k.slutt_dato).toLocaleDateString("nb-NO")}
                </td>
                <td className="px-4 py-3 text-gray-600">{k.paamelding.length}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusFarge[k.status]}`}>
                    {statusEtikett[k.status]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
