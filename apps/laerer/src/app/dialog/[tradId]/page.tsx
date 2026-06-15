import { hentInnloggetBruker } from "@novolms/auth";
import { createServerClient } from "@novolms/db/server";
import { redirect } from "next/navigation";
import type { Melding, Bruker } from "@novolms/db";
import { sendSvarAction, markerLestAction } from "./actions";

export default async function DialogTradPage({
  params,
}: {
  params: Promise<{ tradId: string }>;
}) {
  const { tradId } = await params;
  const brukerData = await hentInnloggetBruker().catch(() => null);
  if (!brukerData) redirect("/auth/logg-inn");

  const supabase = createServerClient();

  const { data: trad } = await supabase
    .from("melding_trad")
    .select("*")
    .eq("id", tradId)
    .eq("laerer_id", brukerData.bruker.id)
    .maybeSingle();

  if (!trad) redirect("/dialog");

  const [{ data: meldinger }, { data: deltaker }, { data: klasse }] =
    await Promise.all([
      supabase
        .from("melding")
        .select("*")
        .eq("trad_id", tradId)
        .order("sendt_dato", { ascending: true }),
      supabase
        .from("bruker")
        .select("id, navn")
        .eq("id", trad.deltaker_id)
        .single(),
      supabase
        .from("klasse")
        .select("id, tittel")
        .eq("id", trad.klasse_id)
        .single(),
    ]);

  const uleste = (meldinger as Melding[])?.filter(
    (m) => !m.lest_dato && m.fra_bruker_id !== brukerData.bruker.id
  );

  if (uleste && uleste.length > 0) {
    await markerLestAction(tradId, brukerData.bruker.id);
  }

  return (
    <div className="p-6 max-w-2xl flex flex-col h-[calc(100vh-57px)]">
      <div className="mb-4">
        <a href="/dialog" className="text-sm text-[#1B3A5C] hover:underline">
          ← Tilbake
        </a>
        <h1 className="text-lg font-bold text-[#1B3A5C] mt-1">
          {(deltaker as Bruker)?.navn ?? "Ukjent"}
        </h1>
        <p className="text-xs text-gray-500">{klasse?.tittel}</p>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 mb-4">
        {(meldinger as Melding[])?.map((m) => {
          const erMin = m.fra_bruker_id === brukerData.bruker.id;
          return (
            <div
              key={m.id}
              className={`flex ${erMin ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                  erMin
                    ? "bg-[#1B3A5C] text-white rounded-br-sm"
                    : "bg-white border border-gray-200 text-gray-900 rounded-bl-sm"
                }`}
              >
                <p>{m.innhold}</p>
                <p
                  className={`text-[11px] mt-1 ${
                    erMin ? "text-blue-200" : "text-gray-400"
                  }`}
                >
                  {new Date(m.sendt_dato).toLocaleString("nb-NO", {
                    day: "2-digit",
                    month: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <form action={sendSvarAction} className="flex gap-2">
        <input type="hidden" name="trad_id" value={tradId} />
        <textarea
          name="innhold"
          required
          rows={2}
          placeholder="Skriv svar…"
          className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#1B3A5C]"
        />
        <button
          type="submit"
          className="bg-[#1B3A5C] text-white rounded-xl px-4 py-2 text-sm font-medium hover:bg-[#16324f] self-end"
        >
          Send
        </button>
      </form>
    </div>
  );
}
