import { createServerClient } from "@novolms/db/server";
import { SubmitButton } from "@/components/SubmitButton";
import { KursModulVelger } from "@/components/KursModulVelger";
import { opprettLeksjonAction } from "./actions";

interface Props { searchParams: { error?: string } }

export default async function NyLeksjonPage({ searchParams }: Props) {
  const db = createServerClient();

  const [{ data: rawKurs }, { data: rawKoblinger }, { data: rawModuler }] = await Promise.all([
    db.from("kurs").select("id, tittel").eq("aktiv", true).order("tittel->no"),
    db.from("kurs_modul_kobling").select("kurs_id, modul_id"),
    db.from("innhold_modul").select("id, tittel").order("tittel->no"),
  ]);

  const kurs = (rawKurs ?? []).map((k) => ({
    id: k.id as string,
    tittel: (k.tittel as { no: string }).no,
  }));

  const koblinger = (rawKoblinger ?? []) as { kurs_id: string; modul_id: string }[];

  const moduler = (rawModuler ?? []).map((m) => ({
    id: m.id as string,
    tittel: (m.tittel as { no: string }).no,
  }));

  return (
    <div className="max-w-xl">
      <div className="mb-6">
        <a href="/leksjoner" className="text-sm text-gray-500 hover:text-[#1B3A5C]">← Tilbake til leksjoner</a>
      </div>
      <h1 className="text-2xl font-bold text-[#1B3A5C] mb-6">Opprett leksjon</h1>
      {searchParams.error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{searchParams.error}</div>
      )}
      <form action={opprettLeksjonAction} className="space-y-5 rounded-xl bg-white border border-gray-200 p-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tittel *</label>
          <input name="tittel_no" required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#1B3A5C] focus:outline-none" placeholder="f.eks. Hilse og ta farvel" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Beskrivelse</label>
          <textarea name="beskrivelse_no" rows={3} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#1B3A5C] focus:outline-none resize-none" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estimert tid (min)</label>
            <input type="number" name="estimert_tid_min" min={1} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#1B3A5C] focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Leksjonstype</label>
            <select name="leksjon_type" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#1B3A5C] focus:outline-none">
              <option value="standard">Standard</option>
              <option value="forsterkning">Forsterkning</option>
              <option value="fordypning">Fordypning</option>
              <option value="adaptiv_alternativ">Adaptivt alternativ</option>
            </select>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-4">
          <KursModulVelger
            kurs={kurs}
            moduler={moduler}
            koblinger={koblinger}
            modulFieldName="modul_id"
            label="Koble til kurs og modul (valgfritt)"
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <a href="/leksjoner" className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">Avbryt</a>
          <SubmitButton label="Opprett og rediger innhold" />
        </div>
      </form>
    </div>
  );
}
