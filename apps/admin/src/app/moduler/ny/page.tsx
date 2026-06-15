import { SubmitButton } from "@/components/SubmitButton";
import { opprettModulAction } from "./actions";

interface Props { searchParams: { error?: string } }

export default function NyModulPage({ searchParams }: Props) {
  return (
    <div className="max-w-xl">
      <div className="mb-6"><a href="/moduler" className="text-sm text-gray-500 hover:text-[#1B3A5C]">← Tilbake</a></div>
      <h1 className="text-2xl font-bold text-[#1B3A5C] mb-6">Opprett modul</h1>
      {searchParams.error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{searchParams.error}</div>
      )}
      <form action={opprettModulAction} className="space-y-5 rounded-xl bg-white border border-gray-200 p-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tittel *</label>
          <input name="tittel_no" required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#1B3A5C] focus:outline-none" placeholder="f.eks. Presentere seg selv" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Beskrivelse</label>
          <textarea name="beskrivelse_no" rows={3} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#1B3A5C] focus:outline-none resize-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Emneord (kommaseparert)</label>
          <input name="tags" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#1B3A5C] focus:outline-none" placeholder="norsk, A1, grammatikk" />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <a href="/moduler" className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">Avbryt</a>
          <SubmitButton label="Opprett modul" />
        </div>
      </form>
    </div>
  );
}
