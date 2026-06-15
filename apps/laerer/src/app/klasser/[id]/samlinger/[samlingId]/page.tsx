import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { hentInnloggetBruker } from "@novolms/auth";
import { createServerClient } from "@novolms/db/server";
import type { Bruker, Paamelding, Samling, SamlingOppmote } from "@novolms/db";
import { oppdaterSamlingAction, lagreFremmoteAction } from "./actions";

interface Props {
  params: { id: string; samlingId: string };
}

export default async function SamlingDetaljPage({ params }: Props) {
  const brukerData = await hentInnloggetBruker();
  if (!brukerData) redirect("/auth/logg-inn");

  const db = createServerClient();

  // Verify teacher has access to this class
  const { data: rolle } = await db
    .from("klasse_rolle")
    .select("id")
    .eq("klasse_id", params.id)
    .eq("bruker_id", brukerData.bruker.id)
    .single();

  if (!rolle) notFound();

  // Fetch samling, klasse, enrollments and existing oppmøte in parallel
  const [
    { data: samling },
    { data: klasse },
    { data: paaMeldinger },
    { data: eksisterendeOppmote },
  ] = await Promise.all([
    db.from("samling").select("*").eq("id", params.samlingId).eq("klasse_id", params.id).single(),
    db.from("klasse").select("*").eq("id", params.id).single(),
    db
      .from("paamelding")
      .select("*")
      .eq("klasse_id", params.id)
      .in("status", ["paameldt", "aktiv", "selvstudie"])
      .order("paameldt_dato"),
    db.from("samling_oppmote").select("*").eq("samling_id", params.samlingId),
  ]);

  if (!samling || !klasse) notFound();

  // Fetch bruker details for enrolled students
  const brukerIder = (paaMeldinger ?? []).map((p: Paamelding) => p.bruker_id);
  let brukerMap = new Map<string, Bruker>();
  if (brukerIder.length > 0) {
    const { data: brukere } = await db.from("bruker").select("*").in("id", brukerIder);
    for (const b of brukere ?? []) brukerMap.set(b.id, b);
  }

  // Build oppmøte map keyed by bruker_id
  const oppmoteMap = new Map<string, SamlingOppmote>();
  for (const o of eksisterendeOppmote ?? []) {
    oppmoteMap.set(o.bruker_id, o as SamlingOppmote);
  }

  // Parse dato and tid from dato_tid
  const datoParts = samling.dato_tid.slice(0, 16); // "YYYY-MM-DDTHH:mm"
  const datoValue = datoParts.slice(0, 10); // "YYYY-MM-DD"
  const tidValue = datoParts.slice(11, 16); // "HH:mm"

  return (
    <div className="max-w-3xl">
      {/* Breadcrumb */}
      <div className="mb-1">
        <Link
          href={`/klasser/${params.id}`}
          className="text-sm text-gray-400 hover:text-[#1B3A5C]"
        >
          ← {klasse.tittel}
        </Link>
      </div>

      <h1 className="mb-6 text-2xl font-bold text-[#1B3A5C]">
        Samling —{" "}
        {new Date(samling.dato_tid).toLocaleDateString("nb-NO", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        })}
      </h1>

      {/* Section 1 — Rediger samling */}
      <section className="mb-8 overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-100 px-5 py-4">
          <h2 className="text-sm font-semibold text-[#1B3A5C]">Rediger samling</h2>
        </div>
        <form action={oppdaterSamlingAction} className="px-5 py-4 space-y-4">
          <input type="hidden" name="samling_id" value={samling.id} />
          <input type="hidden" name="klasse_id" value={params.id} />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-500" htmlFor="type">
                Type
              </label>
              <select
                id="type"
                name="type"
                defaultValue={samling.type}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-[#1B3A5C] focus:outline-none"
              >
                <option value="fysisk">Fysisk</option>
                <option value="virtuell">Virtuell</option>
                <option value="discord">Discord</option>
                <option value="asynkron">Asynkron</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-500" htmlFor="status">
                Status
              </label>
              <select
                id="status"
                name="status"
                defaultValue={samling.status}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-[#1B3A5C] focus:outline-none"
              >
                <option value="planlagt">Planlagt</option>
                <option value="gjennomfort">Gjennomført</option>
                <option value="avlyst">Avlyst</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-500" htmlFor="dato">
                Dato
              </label>
              <input
                id="dato"
                type="date"
                name="dato"
                defaultValue={datoValue}
                required
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-[#1B3A5C] focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-500" htmlFor="tid">
                Tid
              </label>
              <input
                id="tid"
                type="time"
                name="tid"
                defaultValue={tidValue}
                required
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-[#1B3A5C] focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-500" htmlFor="varighet_timer">
                Varighet (timer)
              </label>
              <input
                id="varighet_timer"
                type="number"
                name="varighet_timer"
                defaultValue={samling.varighet_timer}
                min="0.5"
                step="0.5"
                required
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-[#1B3A5C] focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-medium text-gray-500" htmlFor="sted_eller_lenke">
              Sted eller lenke
            </label>
            <input
              id="sted_eller_lenke"
              type="text"
              name="sted_eller_lenke"
              defaultValue={samling.sted_eller_lenke ?? ""}
              placeholder="F.eks. Rom 201 eller https://meet.google.com/..."
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 placeholder:text-gray-300 focus:border-[#1B3A5C] focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-medium text-gray-500" htmlFor="notat">
              Notat
            </label>
            <textarea
              id="notat"
              name="notat"
              defaultValue={samling.notat ?? ""}
              rows={3}
              placeholder="Interne merknader om denne samlingen..."
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 placeholder:text-gray-300 focus:border-[#1B3A5C] focus:outline-none resize-none"
            />
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              className="rounded-lg bg-[#1B3A5C] px-4 py-2 text-sm font-medium text-white hover:bg-[#15304d] transition-colors"
            >
              Lagre endringer
            </button>
          </div>
        </form>
      </section>

      {/* Section 2 — Fremmøte */}
      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-100 px-5 py-4">
          <h2 className="text-sm font-semibold text-[#1B3A5C]">Fremmøte</h2>
          <p className="mt-0.5 text-xs text-gray-400">
            {(paaMeldinger ?? []).length} aktive deltakere
          </p>
        </div>

        {(paaMeldinger ?? []).length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-400">
            Ingen aktive deltakere i klassen
          </div>
        ) : (
          <form action={lagreFremmoteAction}>
            <input type="hidden" name="samling_id" value={samling.id} />
            <input type="hidden" name="klasse_id" value={params.id} />
            <input
              type="hidden"
              name="bruker_ider"
              value={(paaMeldinger ?? []).map((p: Paamelding) => p.bruker_id).join(",")}
            />

            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
                  <th className="px-4 py-3">Navn</th>
                  <th className="px-4 py-3">E-post</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Notat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(paaMeldinger ?? []).map((paamelding: Paamelding) => {
                  const bruker = brukerMap.get(paamelding.bruker_id);
                  const eksisterende = oppmoteMap.get(paamelding.bruker_id);
                  const gjeldendStatus = eksisterende?.status ?? "ukjent_fravaer";

                  return (
                    <tr key={paamelding.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-[#1B3A5C]">
                        <div className="flex items-center gap-2">
                          <OppmoteBadge status={gjeldendStatus} />
                          {bruker?.navn ?? "—"}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {bruker?.epost ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <select
                          name={`status_${paamelding.bruker_id}`}
                          defaultValue={gjeldendStatus}
                          className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-700 focus:border-[#1B3A5C] focus:outline-none"
                        >
                          <option value="tilstede">Tilstede</option>
                          <option value="ukjent_fravaer">Ukjent fravær</option>
                          <option value="jobb">Jobb</option>
                          <option value="godkjent_fravaer">Godkjent fravær</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          name={`notat_${paamelding.bruker_id}`}
                          defaultValue={eksisterende?.notat ?? ""}
                          placeholder="Valgfritt notat..."
                          className="w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs text-gray-700 placeholder:text-gray-300 focus:border-[#1B3A5C] focus:outline-none"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="border-t border-gray-100 px-4 py-3 flex justify-end">
              <button
                type="submit"
                className="rounded-lg bg-[#1B3A5C] px-4 py-2 text-sm font-medium text-white hover:bg-[#15304d] transition-colors"
              >
                Lagre fremmøte
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}

function OppmoteBadge({ status }: { status: SamlingOppmote["status"] }) {
  const config: Record<SamlingOppmote["status"], { color: string; dot: string }> = {
    tilstede: { color: "bg-green-100 text-green-700", dot: "bg-green-500" },
    ukjent_fravaer: { color: "bg-gray-100 text-gray-500", dot: "bg-gray-400" },
    jobb: { color: "bg-blue-100 text-blue-700", dot: "bg-blue-500" },
    godkjent_fravaer: { color: "bg-yellow-100 text-yellow-700", dot: "bg-yellow-400" },
  };
  const c = config[status];
  return (
    <span
      className={`inline-block h-2 w-2 shrink-0 rounded-full ${c.dot}`}
      title={status}
    />
  );
}
