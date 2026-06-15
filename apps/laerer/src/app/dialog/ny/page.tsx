import { hentInnloggetBruker } from "@novolms/auth";
import { createServerClient } from "@novolms/db/server";
import { redirect } from "next/navigation";
import type { Bruker, Klasse } from "@novolms/db";
import { sendNyMeldingAction } from "./actions";

export default async function NyDialogPage() {
  const brukerData = await hentInnloggetBruker().catch(() => null);
  if (!brukerData) redirect("/auth/logg-inn");

  const supabase = createServerClient();

  const { data: klasseRoller } = await supabase
    .from("klasse_rolle")
    .select("klasse_id")
    .eq("bruker_id", brukerData.bruker.id);

  const klasseIder = klasseRoller?.map((r) => r.klasse_id) ?? [];

  if (klasseIder.length === 0) {
    return (
      <div className="p-8 text-gray-500">Du er ikke tilknyttet noen klasser.</div>
    );
  }

  const { data: klasser } = await supabase
    .from("klasse")
    .select("id, tittel")
    .in("id", klasseIder)
    .order("tittel");

  const { data: paaMeldinger } = await supabase
    .from("paamelding")
    .select("bruker_id, klasse_id")
    .in("klasse_id", klasseIder)
    .in("status", ["aktiv", "paameldt"]);

  const brukerIder = [...new Set((paaMeldinger ?? []).map((p) => p.bruker_id))];

  const { data: deltakere } = await supabase
    .from("bruker")
    .select("id, navn")
    .in("id", brukerIder)
    .order("navn");

  const deltakerMap = new Map((deltakere ?? []).map((b) => [b.id, b as Bruker]));
  const klasseMap = new Map((klasser ?? []).map((k) => [k.id, k as Klasse]));

  const deltakerPerKlasse = new Map<string, string[]>();
  for (const p of paaMeldinger ?? []) {
    if (!deltakerPerKlasse.has(p.klasse_id)) deltakerPerKlasse.set(p.klasse_id, []);
    deltakerPerKlasse.get(p.klasse_id)!.push(p.bruker_id);
  }

  return (
    <div className="p-6 max-w-xl">
      <h1 className="text-xl font-bold text-[#1B3A5C] mb-6">Ny melding</h1>

      <form action={sendNyMeldingAction} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Klasse
          </label>
          <select
            name="klasse_id"
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A5C]"
          >
            <option value="">Velg klasse…</option>
            {(klasser ?? []).map((k) => (
              <option key={k.id} value={k.id}>
                {k.tittel}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Mottaker(e)
          </label>
          <p className="text-xs text-gray-500 mb-2">
            Hold Cmd/Ctrl for å velge flere. Alle deltakere gir én tråd per person.
          </p>
          <select
            name="deltaker_ider"
            multiple
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A5C] h-48"
          >
            {(klasser ?? []).map((k) => {
              const dIder = deltakerPerKlasse.get(k.id) ?? [];
              if (dIder.length === 0) return null;
              return (
                <optgroup key={k.id} label={k.tittel}>
                  {dIder.map((bid) => {
                    const b = deltakerMap.get(bid);
                    if (!b) return null;
                    return (
                      <option key={b.id} value={b.id}>
                        {b.navn}
                      </option>
                    );
                  })}
                </optgroup>
              );
            })}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Melding
          </label>
          <textarea
            name="innhold"
            required
            rows={5}
            placeholder="Skriv melding her…"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A5C] resize-none"
          />
        </div>

        <div className="flex gap-3">
          <a
            href="/dialog"
            className="flex-1 text-center border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Avbryt
          </a>
          <button
            type="submit"
            className="flex-1 bg-[#1B3A5C] text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-[#16324f]"
          >
            Send melding
          </button>
        </div>
      </form>
    </div>
  );
}
