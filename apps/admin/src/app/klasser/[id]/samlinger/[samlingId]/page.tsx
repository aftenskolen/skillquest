import { notFound } from "next/navigation";
import { createServerClient } from "@novolms/db/server";
import type { Samling, SamlingOppmote, Bruker, Paamelding } from "@novolms/db/types";
import { SubmitButton } from "@/components/SubmitButton";
import { oppdaterSamlingAction, lagreFremmoteAction } from "./actions";

interface Props {
  params: { id: string; samlingId: string };
  searchParams: { error?: string };
}

const samlingTypeEtikett: Record<Samling["type"], string> = {
  fysisk: "Fysisk",
  virtuell: "Virtuell",
  discord: "Discord",
  asynkron: "Asynkron",
};

const samlingStatusEtikett: Record<Samling["status"], string> = {
  planlagt: "Planlagt",
  gjennomfort: "Gjennomført",
  avlyst: "Avlyst",
};

const oppmoteStatusEtikett: Record<SamlingOppmote["status"], string> = {
  tilstede: "Tilstede",
  ukjent_fravaer: "Ukjent fravær",
  jobb: "Jobb",
  godkjent_fravaer: "Godkjent fravær",
};

export default async function SamlingDetaljPage({ params, searchParams }: Props) {
  const db = createServerClient();
  const { id: klasseId, samlingId } = params;

  const [{ data: rawSamling }, { data: rawKlasse }, { data: rawPaameldte }, { data: rawOppmote }] =
    await Promise.all([
      db.from("samling").select("*").eq("id", samlingId).single(),
      db.from("klasse").select("id, tittel").eq("id", klasseId).single(),
      db
        .from("paamelding")
        .select("bruker_id, bruker ( id, navn, epost )")
        .eq("klasse_id", klasseId)
        .in("status", ["paameldt", "aktiv", "selvstudie"]),
      db.from("samling_oppmote").select("*").eq("samling_id", samlingId),
    ]);

  if (!rawSamling || !rawKlasse) notFound();

  const samling = rawSamling as Samling;
  const klasse = rawKlasse as { id: string; tittel: string };

  const paameldte = (rawPaameldte ?? []) as unknown as Array<
    Pick<Paamelding, "bruker_id"> & { bruker: Pick<Bruker, "id" | "navn" | "epost"> | null }
  >;

  const oppmoteMap = new Map<string, SamlingOppmote>();
  for (const o of rawOppmote ?? []) {
    oppmoteMap.set((o as SamlingOppmote).bruker_id, o as SamlingOppmote);
  }

  // Extract date and time from dato_tid
  const datoTidDate = new Date(samling.dato_tid);
  const datoValue = datoTidDate.toISOString().slice(0, 10);
  const tidValue = datoTidDate.toISOString().slice(11, 16);

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <a
          href={`/klasser/${klasseId}`}
          className="text-sm text-gray-500 hover:text-[#1B3A5C]"
        >
          ← Tilbake
        </a>
      </div>

      <h1 className="text-xl font-bold text-[#1B3A5C]">
        {klasse.tittel} —{" "}
        {datoTidDate.toLocaleDateString("nb-NO", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        })}
      </h1>

      {searchParams.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {searchParams.error}
        </div>
      )}

      {/* Rediger samling */}
      <form
        action={oppdaterSamlingAction}
        className="rounded-xl bg-white border border-gray-200 p-6 space-y-4"
      >
        <h2 className="text-base font-semibold text-[#1B3A5C]">Samlingsdetaljer</h2>
        <input type="hidden" name="samling_id" value={samling.id} />
        <input type="hidden" name="klasse_id" value={klasseId} />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              name="type"
              defaultValue={samling.type}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#1B3A5C] focus:outline-none"
            >
              {(Object.keys(samlingTypeEtikett) as Samling["type"][]).map((t) => (
                <option key={t} value={t}>
                  {samlingTypeEtikett[t]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              name="status"
              defaultValue={samling.status}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#1B3A5C] focus:outline-none"
            >
              {(Object.keys(samlingStatusEtikett) as Samling["status"][]).map((s) => (
                <option key={s} value={s}>
                  {samlingStatusEtikett[s]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dato</label>
            <input
              type="date"
              name="dato"
              required
              defaultValue={datoValue}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#1B3A5C] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tid</label>
            <input
              type="time"
              name="tid"
              required
              defaultValue={tidValue}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#1B3A5C] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Varighet (timer)
            </label>
            <input
              type="number"
              name="varighet_timer"
              required
              defaultValue={samling.varighet_timer}
              min={0.5}
              step={0.5}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#1B3A5C] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sted eller lenke
            </label>
            <input
              type="text"
              name="sted_eller_lenke"
              defaultValue={samling.sted_eller_lenke ?? ""}
              placeholder="f.eks. Auditoriet, eller https://meet.google.com/…"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#1B3A5C] focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notat</label>
          <textarea
            name="notat"
            rows={3}
            defaultValue={samling.notat ?? ""}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#1B3A5C] focus:outline-none resize-none"
          />
        </div>

        <div className="flex justify-end">
          <SubmitButton label="Lagre endringer" />
        </div>
      </form>

      {/* Fremmøte */}
      <form
        action={lagreFremmoteAction}
        className="rounded-xl bg-white border border-gray-200 p-6 space-y-4"
      >
        <h2 className="text-base font-semibold text-[#1B3A5C]">Fremmøte</h2>
        <input type="hidden" name="samling_id" value={samling.id} />
        <input type="hidden" name="klasse_id" value={klasseId} />
        <input
          type="hidden"
          name="bruker_ids"
          value={paameldte.map((p) => p.bruker_id).join(",")}
        />

        {paameldte.length === 0 ? (
          <p className="text-sm text-gray-400">
            Ingen aktive deltakere påmeldt denne klassen.
          </p>
        ) : (
          <div className="rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Navn</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">E-post</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {paameldte.map((p) => {
                  const existing = oppmoteMap.get(p.bruker_id);
                  const defaultStatus: SamlingOppmote["status"] =
                    existing?.status ?? "ukjent_fravaer";
                  return (
                    <tr
                      key={p.bruker_id}
                      className="border-b border-gray-100 last:border-0"
                    >
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {p.bruker?.navn ?? "–"}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{p.bruker?.epost ?? "–"}</td>
                      <td className="px-4 py-3">
                        <select
                          name={`status_${p.bruker_id}`}
                          defaultValue={defaultStatus}
                          className="rounded-md border border-gray-300 px-2 py-1 text-xs focus:border-[#1B3A5C] focus:outline-none"
                        >
                          {(
                            Object.keys(
                              oppmoteStatusEtikett
                            ) as SamlingOppmote["status"][]
                          ).map((s) => (
                            <option key={s} value={s}>
                              {oppmoteStatusEtikett[s]}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {paameldte.length > 0 && (
          <div className="flex justify-end">
            <SubmitButton label="Lagre fremmøte" />
          </div>
        )}
      </form>
    </div>
  );
}
