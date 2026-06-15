import { SubmitButton } from "@/components/SubmitButton";
import { opprettBrukerAction } from "./actions";

interface Props {
  searchParams: { error?: string };
}

export default function NyBrukerPage({ searchParams }: Props) {
  return (
    <div className="max-w-xl">
      <div className="mb-6">
        <a href="/brukere" className="text-sm text-gray-500 hover:text-[#1B3A5C]">← Tilbake til brukere</a>
      </div>
      <h1 className="text-2xl font-bold text-[#1B3A5C] mb-6">Opprett bruker</h1>

      {searchParams.error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {searchParams.error}
        </div>
      )}

      <form action={opprettBrukerAction} className="space-y-5 rounded-xl bg-white border border-gray-200 p-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Fullt navn *</label>
          <input
            name="navn"
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#1B3A5C] focus:outline-none"
            placeholder="Kari Nordmann"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">E-postadresse *</label>
          <input
            type="email"
            name="epost"
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#1B3A5C] focus:outline-none"
            placeholder="kari@eksempel.no"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Passord *</label>
          <input
            type="password"
            name="passord"
            required
            minLength={8}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#1B3A5C] focus:outline-none"
            placeholder="Minimum 8 tegn"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Primærrolle</label>
          <select
            name="rolle"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#1B3A5C] focus:outline-none"
          >
            <option value="deltaker">Deltaker</option>
            <option value="laerer">Lærer</option>
            <option value="admin">Admin</option>
            <option value="superadmin">Superadmin</option>
            <option value="redaktoer">Redaktør</option>
            <option value="mentor">Mentor</option>
          </select>
          <p className="mt-1 text-xs text-gray-400">Deltaker-rollen tildeles alltid. Velg en ekstra rolle her om nødvendig.</p>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <a href="/brukere" className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
            Avbryt
          </a>
          <SubmitButton label="Opprett bruker" />
        </div>
      </form>
    </div>
  );
}
