import { createServerClient } from "@novolms/db/server";
import type { Kurs } from "@novolms/db/types";
import { SubmitButton } from "@/components/SubmitButton";
import { opprettKlasseAction } from "./actions";

interface Props {
  searchParams: { error?: string };
}

export default async function NyKlassePage({ searchParams }: Props) {
  const db = createServerClient();
  const { data } = await db.from("kurs").select("id, tittel").eq("aktiv", true).order("opprettet_dato");
  const kursliste = (data ?? []) as Array<{ id: string; tittel: { no: string } }>;

  return (
    <div className="max-w-xl">
      <div className="mb-6">
        <a href="/klasser" className="text-sm text-gray-500 hover:text-[#1B3A5C]">← Tilbake til klasser</a>
      </div>
      <h1 className="text-2xl font-bold text-[#1B3A5C] mb-6">Opprett klasse</h1>

      {searchParams.error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {searchParams.error}
        </div>
      )}

      <form action={opprettKlasseAction} className="space-y-5 rounded-xl bg-white border border-gray-200 p-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Kurs *</label>
          <select
            name="kurs_id"
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#1B3A5C] focus:outline-none"
          >
            <option value="">– Velg kurs –</option>
            {kursliste.map((k) => (
              <option key={k.id} value={k.id}>{k.tittel.no}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Klassenavn *</label>
          <input
            name="tittel"
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#1B3A5C] focus:outline-none"
            placeholder="f.eks. Norsk A1 – Høst 2026"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Sted</label>
          <input
            name="sted"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#1B3A5C] focus:outline-none"
            placeholder="f.eks. Oslo Voksenopplæring"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Startdato *</label>
            <input
              type="date"
              name="start_dato"
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#1B3A5C] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sluttdato *</label>
            <input
              type="date"
              name="slutt_dato"
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#1B3A5C] focus:outline-none"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Maks deltakere</label>
            <input
              type="number"
              name="maks_deltakere"
              min={1}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#1B3A5C] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
            <select
              name="status"
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#1B3A5C] focus:outline-none"
            >
              <option value="planlagt">Planlagt</option>
              <option value="aktiv">Aktiv</option>
              <option value="avsluttet">Avsluttet</option>
              <option value="avlyst">Avlyst</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Betaling</label>
            <select
              name="gratis"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#1B3A5C] focus:outline-none"
            >
              <option value="true">Gratis</option>
              <option value="false">Betalt</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pris (kr)</label>
            <input
              type="number"
              name="pris"
              min={0}
              defaultValue={0}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#1B3A5C] focus:outline-none"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Lærer (valgfritt)</label>
          <input
            type="email"
            name="laerer_epost"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#1B3A5C] focus:outline-none"
            placeholder="laerer@skole.no"
          />
          <p className="mt-1 text-xs text-gray-400">Brukeren får tilgang i Lærerportalen. Kan endres senere.</p>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <a href="/klasser" className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
            Avbryt
          </a>
          <SubmitButton label="Opprett klasse" />
        </div>
      </form>
    </div>
  );
}
