import { notFound } from "next/navigation";
import { createServerClient } from "@novolms/db/server";
import type { InnholdModul, InnholdLeksjon, ModulLeksjonKobling } from "@novolms/db/types";
import { SubmitButton } from "@/components/SubmitButton";
import {
  oppdaterModulAction,
  leggTilLeksjonAction,
  fjernLeksjonFraModulAction,
  flyttLeksjonAction,
} from "./actions";

interface Props {
  params: { id: string };
  searchParams: { error?: string };
}

export default async function RedigerModulPage({ params, searchParams }: Props) {
  const db = createServerClient();

  const [{ data: rawModul }, { data: rawKoblinger }, { data: rawAlleLeksjoner }] = await Promise.all([
    db.from("innhold_modul").select("*").eq("id", params.id).single(),
    db.from("modul_leksjon_kobling")
      .select("id, rekkefolge, innhold_leksjon ( id, tittel, status, estimert_tid_min )")
      .eq("modul_id", params.id)
      .order("rekkefolge"),
    db.from("innhold_leksjon").select("id, tittel, status").order("tittel->no"),
  ]);

  if (!rawModul) notFound();

  const modul = rawModul as InnholdModul;
  const koblinger = (rawKoblinger ?? []) as unknown as Array<
    ModulLeksjonKobling & {
      innhold_leksjon: Pick<InnholdLeksjon, "id" | "tittel" | "status" | "estimert_tid_min"> | null;
    }
  >;
  const alleLeksjoner = (rawAlleLeksjoner ?? []) as Pick<InnholdLeksjon, "id" | "tittel" | "status">[];
  const tilknyttedeLeksjonIds = new Set(koblinger.map((k) => k.leksjon_id));
  const tilgjengeligeLeksjoner = alleLeksjoner.filter((l) => !tilknyttedeLeksjonIds.has(l.id));

  const tittel = (modul.tittel as { no: string }).no;
  const beskrivelse = (modul.beskrivelse as { no: string } | null)?.no ?? "";

  return (
    <div className="max-w-3xl space-y-6">
      <div><a href="/moduler" className="text-sm text-gray-500 hover:text-[#1B3A5C]">← Tilbake til moduler</a></div>

      {searchParams.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{searchParams.error}</div>
      )}

      {/* Moduldetaljer */}
      <form action={oppdaterModulAction} className="rounded-xl bg-white border border-gray-200 p-6 space-y-4">
        <h2 className="text-base font-semibold text-[#1B3A5C]">Modulinformasjon</h2>
        <input type="hidden" name="id" value={modul.id} />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tittel *</label>
          <input name="tittel_no" required defaultValue={tittel} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#1B3A5C] focus:outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Beskrivelse</label>
          <textarea name="beskrivelse_no" rows={3} defaultValue={beskrivelse} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#1B3A5C] focus:outline-none resize-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Emneord (kommaseparert)</label>
          <input name="tags" defaultValue={(modul.tags ?? []).join(", ")} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#1B3A5C] focus:outline-none" />
        </div>
        <div className="flex justify-end">
          <SubmitButton label="Lagre endringer" />
        </div>
      </form>

      {/* Leksjoner i modulen */}
      <div className="rounded-xl bg-white border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700">Leksjoner i modulen ({koblinger.length})</h2>
          <a href="/leksjoner/ny" className="text-xs text-[#1B3A5C] hover:underline">+ Ny leksjon</a>
        </div>

        {koblinger.length === 0 ? (
          <p className="px-4 py-6 text-sm text-gray-400">Ingen leksjoner ennå. Legg til en eksisterende eller opprett ny.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">#</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Tittel</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Status</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Tid</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Handlinger</th>
              </tr>
            </thead>
            <tbody>
              {koblinger.map((k, idx) => {
                const leksjon = k.innhold_leksjon;
                return (
                  <tr key={k.id} className="border-b border-gray-100 last:border-0">
                    <td className="px-4 py-2.5 text-gray-400 w-8">{k.rekkefolge}</td>
                    <td className="px-4 py-2.5 font-medium">
                      {leksjon ? (
                        <a href={`/leksjoner/${leksjon.id}/rediger`} className="text-[#1B3A5C] hover:underline">
                          {(leksjon.tittel as { no: string }).no}
                        </a>
                      ) : "–"}
                    </td>
                    <td className="px-4 py-2.5">
                      <StatusBadge status={leksjon?.status ?? "utkast"} />
                    </td>
                    <td className="px-4 py-2.5 text-gray-500 text-xs">
                      {leksjon?.estimert_tid_min ? `${leksjon.estimert_tid_min} min` : "–"}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center justify-end gap-1">
                        {idx > 0 && (
                          <form action={flyttLeksjonAction}>
                            <input type="hidden" name="kobling_id" value={k.id} />
                            <input type="hidden" name="modul_id" value={params.id} />
                            <input type="hidden" name="retning" value="opp" />
                            <input type="hidden" name="rekkefolge" value={k.rekkefolge} />
                            <button type="submit" className="px-2 py-1 text-xs text-gray-500 hover:text-[#1B3A5C] border border-gray-200 rounded">↑</button>
                          </form>
                        )}
                        {idx < koblinger.length - 1 && (
                          <form action={flyttLeksjonAction}>
                            <input type="hidden" name="kobling_id" value={k.id} />
                            <input type="hidden" name="modul_id" value={params.id} />
                            <input type="hidden" name="retning" value="ned" />
                            <input type="hidden" name="rekkefolge" value={k.rekkefolge} />
                            <button type="submit" className="px-2 py-1 text-xs text-gray-500 hover:text-[#1B3A5C] border border-gray-200 rounded">↓</button>
                          </form>
                        )}
                        <form action={fjernLeksjonFraModulAction}>
                          <input type="hidden" name="kobling_id" value={k.id} />
                          <input type="hidden" name="modul_id" value={params.id} />
                          <button type="submit" className="px-2 py-1 text-xs text-red-500 hover:text-red-700 border border-red-100 rounded">Fjern</button>
                        </form>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* Legg til eksisterende leksjon */}
        {tilgjengeligeLeksjoner.length > 0 && (
          <div className="border-t border-gray-200 p-4">
            <form action={leggTilLeksjonAction} className="flex gap-3">
              <input type="hidden" name="modul_id" value={params.id} />
              <select name="leksjon_id" className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#1B3A5C] focus:outline-none">
                {tilgjengeligeLeksjoner.map((l) => (
                  <option key={l.id} value={l.id}>{(l.tittel as { no: string }).no}</option>
                ))}
              </select>
              <SubmitButton label="Legg til leksjon" loadingLabel="Legger til…" />
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    utkast: "bg-gray-100 text-gray-600",
    til_review: "bg-yellow-100 text-yellow-700",
    publisert: "bg-green-100 text-green-700",
    arkivert: "bg-red-100 text-red-600",
  };
  const labels: Record<string, string> = { utkast: "Utkast", til_review: "Til review", publisert: "Publisert", arkivert: "Arkivert" };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${map[status] ?? "bg-gray-100 text-gray-600"}`}>
      {labels[status] ?? status}
    </span>
  );
}
