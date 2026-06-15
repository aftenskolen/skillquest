import { hentInnloggetBruker } from "@novolms/auth";
import { createServerClient } from "@novolms/db/server";
import { redirect } from "next/navigation";
import type { Klasse, Samling } from "@novolms/db";
import { opprettOppgaveAction } from "./actions";

export default async function NyOppgavePage() {
  const brukerData = await hentInnloggetBruker().catch(() => null);
  if (!brukerData) redirect("/auth/logg-inn");

  const supabase = createServerClient();

  const { data: klasseRoller } = await supabase
    .from("klasse_rolle")
    .select("klasse_id")
    .eq("bruker_id", brukerData.bruker.id);

  const klasseIder = klasseRoller?.map((r) => r.klasse_id) ?? [];

  if (klasseIder.length === 0) {
    return <div className="p-8 text-gray-500">Du er ikke tilknyttet noen klasser.</div>;
  }

  const [{ data: klasser }, { data: samlinger }] = await Promise.all([
    supabase.from("klasse").select("id, tittel").in("id", klasseIder).order("tittel"),
    supabase
      .from("samling")
      .select("id, klasse_id, dato_tid, type, status")
      .in("klasse_id", klasseIder)
      .neq("status", "avlyst")
      .order("dato_tid"),
  ]);

  const samlingerPerKlasse = new Map<string, Samling[]>();
  for (const s of (samlinger as Samling[]) ?? []) {
    if (!samlingerPerKlasse.has(s.klasse_id)) samlingerPerKlasse.set(s.klasse_id, []);
    samlingerPerKlasse.get(s.klasse_id)!.push(s);
  }

  const typeEtikett: Record<string, string> = {
    fysisk: "Fysisk",
    virtuell: "Virtuell",
    discord: "Discord",
    asynkron: "Asynkron",
  };

  return (
    <div className="p-6 max-w-xl">
      <a href="/oppgaver" className="text-sm text-[#1B3A5C] hover:underline">
        ← Tilbake
      </a>
      <h1 className="text-xl font-bold text-[#1B3A5C] mt-3 mb-6">Ny oppgave</h1>

      <form action={opprettOppgaveAction} className="space-y-5" encType="multipart/form-data">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Klasse</label>
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Samling</label>
          <select
            name="samling_id"
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A5C]"
          >
            <option value="">Velg samling…</option>
            {(klasser ?? []).map((k) => {
              const sIder = samlingerPerKlasse.get(k.id) ?? [];
              if (sIder.length === 0) return null;
              return (
                <optgroup key={k.id} label={k.tittel}>
                  {sIder.map((s) => (
                    <option key={s.id} value={s.id}>
                      {new Date(s.dato_tid).toLocaleDateString("nb-NO", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}{" "}
                      — {typeEtikett[s.type] ?? s.type}
                    </option>
                  ))}
                </optgroup>
              );
            })}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tittel</label>
          <input
            type="text"
            name="tittel"
            required
            placeholder="Navn på oppgaven"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A5C]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Beskrivelse
          </label>
          <textarea
            name="beskrivelse"
            rows={6}
            placeholder="Oppgavebeskrivelse — hva skal deltakerne gjøre?"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A5C] resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Vedlegg (PDF, valgfritt)
          </label>
          <input
            type="file"
            name="fil"
            accept=".pdf"
            className="w-full text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-[#1B3A5C] file:text-white hover:file:bg-[#16324f]"
          />
        </div>

        <div className="flex gap-3">
          <a
            href="/oppgaver"
            className="flex-1 text-center border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Avbryt
          </a>
          <button
            type="submit"
            className="flex-1 bg-[#1B3A5C] text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-[#16324f]"
          >
            Opprett oppgave
          </button>
        </div>
      </form>
    </div>
  );
}
