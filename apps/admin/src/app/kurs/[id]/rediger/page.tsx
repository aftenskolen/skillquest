import { notFound } from "next/navigation";
import { createServerClient } from "@novolms/db/server";
import type { Kurs, InnholdModul, KursModulKobling } from "@novolms/db/types";
import { SubmitButton } from "@/components/SubmitButton";
import {
  oppdaterKursAction,
  slettKursAction,
  leggTilModulAction,
  fjernModulFraKursAction,
  flyttModulAction,
} from "./actions";

interface Props {
  params: { id: string };
  searchParams: { error?: string };
}

export default async function RedigerKursPage({ params, searchParams }: Props) {
  const db = createServerClient();

  const [{ data: rawKurs }, { data: rawKoblinger }, { data: rawAlleModuler }] = await Promise.all([
    db.from("kurs").select("*").eq("id", params.id).single(),
    db.from("kurs_modul_kobling")
      .select("id, rekkefolge, modul_id, innhold_modul ( id, tittel, beskrivelse )")
      .eq("kurs_id", params.id)
      .order("rekkefolge"),
    db.from("innhold_modul").select("id, tittel"),
  ]);

  if (!rawKurs) notFound();

  const kurs = rawKurs as Kurs;
  const koblinger = (rawKoblinger ?? []) as unknown as Array<
    KursModulKobling & { innhold_modul: Pick<InnholdModul, "id" | "tittel" | "beskrivelse"> | null }
  >;
  const alleModuler = (rawAlleModuler ?? []) as Pick<InnholdModul, "id" | "tittel">[];
  const tilknyttedeModulIds = new Set(koblinger.map((k) => k.modul_id));
  const tilgjengeligeModuler = alleModuler.filter((m) => !tilknyttedeModulIds.has(m.id));

  const tittel = (kurs.tittel as { no: string }).no;
  const beskrivelse = (kurs.beskrivelse as { no: string } | null)?.no ?? "";

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <a href="/kurs" className="text-sm text-gray-500 hover:text-[#1B3A5C]">← Tilbake til kurs</a>
      </div>
      <h1 className="text-2xl font-bold text-[#1B3A5C]">{tittel}</h1>

      {searchParams.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {searchParams.error}
        </div>
      )}

      {/* Kursdetaljer */}
      <form action={oppdaterKursAction} className="space-y-5 rounded-xl bg-white border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-[#1B3A5C]">Kursinformasjon</h2>
        <input type="hidden" name="id" value={kurs.id} />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tittel (norsk) *</label>
          <input name="tittel_no" required defaultValue={tittel} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#1B3A5C] focus:outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Beskrivelse</label>
          <textarea name="beskrivelse_no" rows={3} defaultValue={beskrivelse} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#1B3A5C] focus:outline-none resize-none" />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Kurstype *</label>
            <select name="kurstype" required defaultValue={kurs.kurstype} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#1B3A5C] focus:outline-none">
              <option value="norsk">Norsk</option>
              <option value="samfunnskunnskap">Samfunnskunnskap</option>
              <option value="norsk_og_samfunnskunnskap">Norsk og samfunnskunnskap</option>
              <option value="fagbrev">Fagbrev</option>
              <option value="arbeidsliv">Arbeidsliv</option>
              <option value="livsmestring">Livsmestring</option>
              <option value="annet">Annet</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">CEFR-nivå</label>
            <select name="cefr_nivaa" defaultValue={kurs.cefr_nivaa ?? ""} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#1B3A5C] focus:outline-none">
              <option value="">– Velg –</option>
              <option value="A1">A1</option>
              <option value="A2">A2</option>
              <option value="B1">B1</option>
              <option value="B2">B2</option>
              <option value="ingen">Ingen</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select name="aktiv" defaultValue={kurs.aktiv ? "true" : "false"} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#1B3A5C] focus:outline-none">
              <option value="true">Aktiv</option>
              <option value="false">Inaktiv</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end">
          <SubmitButton label="Lagre endringer" />
        </div>
      </form>

      {/* Moduler i kurset */}
      <div className="rounded-xl bg-white border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700">
            Moduler i kurset ({koblinger.length})
          </h2>
          <a href="/moduler/ny" className="text-xs text-[#1B3A5C] hover:underline">+ Ny modul</a>
        </div>

        {koblinger.length === 0 ? (
          <p className="px-4 py-6 text-sm text-gray-400">
            Ingen moduler ennå. Legg til en eksisterende modul eller opprett en ny.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 w-8">#</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Modul</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Handlinger</th>
              </tr>
            </thead>
            <tbody>
              {koblinger.map((k, idx) => {
                const modul = k.innhold_modul;
                return (
                  <tr key={k.id} className="border-b border-gray-100 last:border-0">
                    <td className="px-4 py-3 text-gray-400">{k.rekkefolge}</td>
                    <td className="px-4 py-3">
                      {modul ? (
                        <div>
                          <a
                            href={`/moduler/${modul.id}/rediger`}
                            className="font-medium text-[#1B3A5C] hover:underline"
                          >
                            {(modul.tittel as { no: string }).no}
                          </a>
                          {modul.beskrivelse && (
                            <p className="text-xs text-gray-400 mt-0.5">
                              {(modul.beskrivelse as { no: string }).no}
                            </p>
                          )}
                        </div>
                      ) : "–"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {idx > 0 && (
                          <form action={flyttModulAction}>
                            <input type="hidden" name="kobling_id" value={k.id} />
                            <input type="hidden" name="kurs_id" value={kurs.id} />
                            <input type="hidden" name="retning" value="opp" />
                            <input type="hidden" name="rekkefolge" value={k.rekkefolge} />
                            <button type="submit" className="px-2 py-1 text-xs text-gray-500 hover:text-[#1B3A5C] border border-gray-200 rounded">↑</button>
                          </form>
                        )}
                        {idx < koblinger.length - 1 && (
                          <form action={flyttModulAction}>
                            <input type="hidden" name="kobling_id" value={k.id} />
                            <input type="hidden" name="kurs_id" value={kurs.id} />
                            <input type="hidden" name="retning" value="ned" />
                            <input type="hidden" name="rekkefolge" value={k.rekkefolge} />
                            <button type="submit" className="px-2 py-1 text-xs text-gray-500 hover:text-[#1B3A5C] border border-gray-200 rounded">↓</button>
                          </form>
                        )}
                        <form action={fjernModulFraKursAction}>
                          <input type="hidden" name="kobling_id" value={k.id} />
                          <input type="hidden" name="kurs_id" value={kurs.id} />
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

        {/* Legg til eksisterende modul */}
        <div className="border-t border-gray-200 p-4">
          {tilgjengeligeModuler.length === 0 ? (
            <p className="text-xs text-gray-400">Alle tilgjengelige moduler er allerede lagt til.</p>
          ) : (
            <form action={leggTilModulAction} className="flex gap-3">
              <input type="hidden" name="kurs_id" value={kurs.id} />
              <select
                name="modul_id"
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#1B3A5C] focus:outline-none"
              >
                {tilgjengeligeModuler.map((m) => (
                  <option key={m.id} value={m.id}>
                    {(m.tittel as { no: string }).no}
                  </option>
                ))}
              </select>
              <SubmitButton label="Legg til modul" loadingLabel="Legger til…" />
            </form>
          )}
        </div>
      </div>

      {/* Faresone */}
      <div className="rounded-xl border border-red-200 bg-red-50 p-6">
        <h2 className="text-sm font-semibold text-red-700 mb-2">Faresone</h2>
        <p className="text-sm text-red-600 mb-4">Sletting av kurs fjerner også alle modulkoblinger, men sletter ikke selve modulene.</p>
        <form action={slettKursAction}>
          <input type="hidden" name="id" value={kurs.id} />
          <SubmitButton label="Slett kurs" loadingLabel="Sletter…" variant="danger" />
        </form>
      </div>
    </div>
  );
}
