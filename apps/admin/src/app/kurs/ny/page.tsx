import { SubmitButton } from "@/components/SubmitButton";
import { opprettKursAction } from "./actions";

interface Props {
  searchParams: { error?: string };
}

export default function NyttKursPage({ searchParams }: Props) {
  return (
    <div className="max-w-xl">
      <div className="mb-6">
        <a href="/kurs" className="text-sm text-gray-500 hover:text-[#1B3A5C]">← Tilbake til kurs</a>
      </div>
      <h1 className="text-2xl font-bold text-[#1B3A5C] mb-6">Opprett kurs</h1>

      {searchParams.error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {searchParams.error}
        </div>
      )}

      <form action={opprettKursAction} className="space-y-5 rounded-xl bg-white border border-gray-200 p-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tittel (norsk) *</label>
          <input
            name="tittel_no"
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#1B3A5C] focus:outline-none"
            placeholder="f.eks. Norsk for voksne A1"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Beskrivelse</label>
          <textarea
            name="beskrivelse_no"
            rows={3}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#1B3A5C] focus:outline-none resize-none"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Kurstype *</label>
            <select
              name="kurstype"
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#1B3A5C] focus:outline-none"
            >
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
            <select
              name="cefr_nivaa"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#1B3A5C] focus:outline-none"
            >
              <option value="">– Velg –</option>
              <option value="A1">A1</option>
              <option value="A2">A2</option>
              <option value="B1">B1</option>
              <option value="B2">B2</option>
              <option value="ingen">Ingen</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            name="aktiv"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#1B3A5C] focus:outline-none"
          >
            <option value="true">Aktiv</option>
            <option value="false">Inaktiv</option>
          </select>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <a href="/kurs" className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
            Avbryt
          </a>
          <SubmitButton label="Opprett kurs" />
        </div>
      </form>
    </div>
  );
}
