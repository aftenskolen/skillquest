import { notFound } from "next/navigation";
import { createServerClient } from "@novolms/db/server";
import type { Klasse, Paamelding, Bruker, LeksjonProgresjon } from "@novolms/db/types";
import { SubmitButton } from "@/components/SubmitButton";
import { meldPaaAction, oppdaterPaaMeldingStatusAction, oppdaterKlasseAction, leggTilKlasseRolleAction, fjernKlasseRolleAction, opprettSamlingAction, oppdaterSamlingStatusAction, slettSamlingAction } from "./actions";
import type { KlasseRolle, Samling } from "@novolms/db/types";

const rolleEtikett: Record<KlasseRolle["rolle"], string> = {
  laerer: "Lærer",
  dagmentor: "Dagmentor",
  kveldsmentor: "Kveldsmentor",
  ekstern_sensor: "Ekstern sensor",
  admin: "Admin",
};

const statusEtikett: Record<Paamelding["status"], string> = {
  venteliste: "Venteliste",
  paameldt: "Påmeldt",
  aktiv: "Aktiv",
  droppet: "Droppet",
  aldri_mott: "Aldri møtt",
  selvstudie: "Selvstudie",
  fullfort: "Fullført",
  avbrutt: "Avbrutt",
};

const statusFarge: Record<Paamelding["status"], string> = {
  venteliste: "bg-yellow-100 text-yellow-700",
  paameldt: "bg-blue-100 text-blue-700",
  aktiv: "bg-green-100 text-green-700",
  droppet: "bg-gray-100 text-gray-500",
  aldri_mott: "bg-red-100 text-red-600",
  selvstudie: "bg-purple-100 text-purple-700",
  fullfort: "bg-teal-100 text-teal-700",
  avbrutt: "bg-red-100 text-red-600",
};

const samlingTypeEtikett: Record<Samling["type"], string> = {
  fysisk: "Fysisk",
  virtuell: "Virtuell",
  discord: "Discord",
  asynkron: "Asynkron",
};

const samlingTypeFarge: Record<Samling["type"], string> = {
  fysisk: "bg-blue-100 text-blue-700",
  virtuell: "bg-purple-100 text-purple-700",
  discord: "bg-indigo-100 text-indigo-700",
  asynkron: "bg-gray-100 text-gray-600",
};

const samlingStatusEtikett: Record<Samling["status"], string> = {
  planlagt: "Planlagt",
  gjennomfort: "Gjennomført",
  avlyst: "Avlyst",
};

const samlingStatusFarge: Record<Samling["status"], string> = {
  planlagt: "bg-yellow-100 text-yellow-700",
  gjennomfort: "bg-green-100 text-green-700",
  avlyst: "bg-red-100 text-red-600",
};

interface Props {
  params: { id: string };
  searchParams: { error?: string };
}

export default async function KlasseDetaljPage({ params, searchParams }: Props) {
  const db = createServerClient();

  const { data: rawKlasse } = await db
    .from("klasse")
    .select("*, kurs ( tittel )")
    .eq("id", params.id)
    .single();

  if (!rawKlasse) notFound();

  const klasse = rawKlasse as Klasse & { kurs: { tittel: { no: string } } | null };

  const { data: rawKlasseRoller } = await db
    .from("klasse_rolle")
    .select("*, bruker ( id, navn, epost )")
    .eq("klasse_id", params.id);

  const klasseRoller = (rawKlasseRoller ?? []) as unknown as Array<
    KlasseRolle & { bruker: Pick<Bruker, "id" | "navn" | "epost"> | null }
  >;

  const { data: rawPaameldte } = await db
    .from("paamelding")
    .select("*, bruker ( id, navn, epost )")
    .eq("klasse_id", params.id)
    .order("paameldt_dato", { ascending: false });

  const paameldte = (rawPaameldte ?? []) as unknown as Array<
    Paamelding & { bruker: Pick<Bruker, "id" | "navn" | "epost"> | null }
  >;

  const paaMeldingIds = paameldte.map((p) => p.id);
  const { data: progresjonRader } = paaMeldingIds.length > 0
    ? await db.from("leksjon_progresjon").select("paamelding_id, status").in("paamelding_id", paaMeldingIds)
    : { data: [] };

  const progresjonPerPaamelding = new Map<string, { fullfort: number; paabegynt: number }>();
  for (const p of progresjonRader ?? []) {
    const rad = p as Pick<LeksjonProgresjon, "paamelding_id" | "status">;
    const g = progresjonPerPaamelding.get(rad.paamelding_id) ?? { fullfort: 0, paabegynt: 0 };
    if (rad.status === "fullfort") g.fullfort += 1;
    else if (rad.status === "paabegynt") g.paabegynt += 1;
    progresjonPerPaamelding.set(rad.paamelding_id, g);
  }

  const { data: rawSamlinger } = await db
    .from("samling")
    .select("*")
    .eq("klasse_id", params.id)
    .order("dato_tid", { ascending: true });

  const samlinger = (rawSamlinger ?? []) as Samling[];

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <a href="/klasser" className="text-sm text-gray-500 hover:text-[#1B3A5C]">← Tilbake til klasser</a>
      </div>

      {searchParams.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {searchParams.error}
        </div>
      )}

      {/* Rediger klasse */}
      <form action={oppdaterKlasseAction} className="rounded-xl bg-white border border-gray-200 p-6 space-y-4">
        <h2 className="text-base font-semibold text-[#1B3A5C]">Klasseopplysninger</h2>
        <input type="hidden" name="id" value={klasse.id} />
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Klassenavn</label>
            <input
              name="tittel"
              required
              defaultValue={klasse.tittel}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#1B3A5C] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sted</label>
            <input
              name="sted"
              defaultValue={klasse.sted ?? ""}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#1B3A5C] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Startdato</label>
            <input
              type="date"
              name="start_dato"
              required
              defaultValue={klasse.start_dato}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#1B3A5C] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sluttdato</label>
            <input
              type="date"
              name="slutt_dato"
              required
              defaultValue={klasse.slutt_dato}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#1B3A5C] focus:outline-none"
            />
          </div>
        </div>
        <div className="w-48">
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            name="status"
            defaultValue={klasse.status}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#1B3A5C] focus:outline-none"
          >
            <option value="planlagt">Planlagt</option>
            <option value="aktiv">Aktiv</option>
            <option value="avsluttet">Avsluttet</option>
            <option value="avlyst">Avlyst</option>
          </select>
        </div>
        <div className="flex justify-end">
          <SubmitButton label="Lagre endringer" />
        </div>
      </form>

      {/* Lærere og ansatte */}
      <div className="rounded-xl bg-white border border-gray-200 p-6 space-y-4">
        <h2 className="text-base font-semibold text-[#1B3A5C]">Lærere og ansatte</h2>

        {klasseRoller.length > 0 && (
          <div className="divide-y divide-gray-100 rounded-lg border border-gray-200 overflow-hidden">
            {klasseRoller.map((kr) => (
              <div key={kr.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                <div>
                  <span className="font-medium text-gray-800">{kr.bruker?.navn ?? "–"}</span>
                  <span className="ml-2 text-gray-400 text-xs">{kr.bruker?.epost}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                    {rolleEtikett[kr.rolle]}
                  </span>
                  <form action={fjernKlasseRolleAction}>
                    <input type="hidden" name="id" value={kr.id} />
                    <input type="hidden" name="klasse_id" value={klasse.id} />
                    <button className="text-xs text-red-400 hover:text-red-600">Fjern</button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}

        <form action={leggTilKlasseRolleAction} className="flex gap-3 items-end">
          <input type="hidden" name="klasse_id" value={klasse.id} />
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-600 mb-1">E-post</label>
            <input
              type="email"
              name="epost"
              required
              placeholder="laerer@skole.no"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#1B3A5C] focus:outline-none"
            />
          </div>
          <div className="w-44">
            <label className="block text-xs font-medium text-gray-600 mb-1">Rolle</label>
            <select
              name="rolle"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#1B3A5C] focus:outline-none"
            >
              <option value="laerer">Lærer</option>
              <option value="dagmentor">Dagmentor</option>
              <option value="kveldsmentor">Kveldsmentor</option>
              <option value="ekstern_sensor">Ekstern sensor</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <SubmitButton label="Legg til" loadingLabel="Legger til…" />
        </form>
        <p className="text-xs text-gray-400">Brukeren må være registrert i systemet. Gir tilgang i Lærerportalen.</p>
      </div>

      {/* Meld på ny deltaker */}
      <div className="rounded-xl bg-white border border-gray-200 p-6 space-y-4">
        <h2 className="text-base font-semibold text-[#1B3A5C]">Meld på deltaker</h2>
        <form action={meldPaaAction} className="flex gap-3">
          <input type="hidden" name="klasse_id" value={klasse.id} />
          <input
            type="email"
            name="epost"
            required
            placeholder="deltaker@epost.no"
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#1B3A5C] focus:outline-none"
          />
          <SubmitButton label="Meld på" loadingLabel="Melder på…" />
        </form>
        <p className="text-xs text-gray-400">Brukeren må være registrert i systemet. Søk på e-postadresse.</p>
      </div>

      {/* Samlinger */}
      <div className="rounded-xl bg-white border border-gray-200 p-6 space-y-4">
        <h2 className="text-base font-semibold text-[#1B3A5C]">Samlinger</h2>

        {samlinger.length > 0 && (
          <div className="divide-y divide-gray-100 rounded-lg border border-gray-200 overflow-hidden">
            {samlinger.map((s) => {
              const dato = new Date(s.dato_tid);
              const datoStr = dato.toLocaleDateString("nb-NO", { day: "2-digit", month: "2-digit", year: "numeric" });
              const tidStr = dato.toLocaleTimeString("nb-NO", { hour: "2-digit", minute: "2-digit" });
              return (
                <div key={s.id} className="flex items-center justify-between px-4 py-3 text-sm gap-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="font-medium text-gray-800 whitespace-nowrap">{datoStr} {tidStr}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ${samlingTypeFarge[s.type]}`}>
                      {samlingTypeEtikett[s.type]}
                    </span>
                    <span className="text-gray-500 whitespace-nowrap">{s.varighet_timer} t</span>
                    {s.sted_eller_lenke && (
                      <span className="text-gray-500 truncate">{s.sted_eller_lenke}</span>
                    )}
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ${samlingStatusFarge[s.status]}`}>
                      {samlingStatusEtikett[s.status]}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={`/klasser/${klasse.id}/samlinger/${s.id}`}
                      className="text-xs text-[#1B3A5C] hover:underline"
                    >
                      Rediger
                    </a>
                    {s.status !== "gjennomfort" && (
                      <form action={oppdaterSamlingStatusAction}>
                        <input type="hidden" name="id" value={s.id} />
                        <input type="hidden" name="klasse_id" value={klasse.id} />
                        <input type="hidden" name="status" value="gjennomfort" />
                        <button className="text-xs text-green-600 hover:text-green-800">Gjennomført</button>
                      </form>
                    )}
                    {s.status !== "avlyst" && (
                      <form action={oppdaterSamlingStatusAction}>
                        <input type="hidden" name="id" value={s.id} />
                        <input type="hidden" name="klasse_id" value={klasse.id} />
                        <input type="hidden" name="status" value="avlyst" />
                        <button className="text-xs text-yellow-600 hover:text-yellow-800">Avlyst</button>
                      </form>
                    )}
                    <form action={slettSamlingAction}>
                      <input type="hidden" name="id" value={s.id} />
                      <input type="hidden" name="klasse_id" value={klasse.id} />
                      <button className="text-xs text-red-400 hover:text-red-600">Slett</button>
                    </form>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {samlinger.length === 0 && (
          <p className="text-sm text-gray-400">Ingen samlinger registrert ennå.</p>
        )}

        <form action={opprettSamlingAction} className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">Legg til samling</h3>
          <input type="hidden" name="klasse_id" value={klasse.id} />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
              <select
                name="type"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#1B3A5C] focus:outline-none"
              >
                <option value="fysisk">Fysisk</option>
                <option value="virtuell">Virtuell</option>
                <option value="discord">Discord</option>
                <option value="asynkron">Asynkron</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Varighet (timer)</label>
              <input
                type="number"
                name="varighet_timer"
                required
                defaultValue={2}
                min={0.5}
                step={0.5}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#1B3A5C] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Dato</label>
              <input
                type="date"
                name="dato"
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#1B3A5C] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Tid</label>
              <input
                type="time"
                name="tid"
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#1B3A5C] focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Sted eller lenke (valgfritt)</label>
            <input
              type="text"
              name="sted_eller_lenke"
              placeholder="f.eks. Auditoriet, eller https://meet.google.com/…"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#1B3A5C] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Notat (valgfritt)</label>
            <textarea
              name="notat"
              rows={2}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#1B3A5C] focus:outline-none resize-none"
            />
          </div>
          <div className="flex justify-end">
            <SubmitButton label="Legg til samling" loadingLabel="Legger til…" />
          </div>
        </form>
      </div>

      {/* Deltakerliste */}
      <div className="rounded-xl bg-white border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
          <h2 className="text-sm font-semibold text-gray-700">Deltakere ({paameldte.length})</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="px-4 py-3 text-left font-medium text-gray-600">Navn</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">E-post</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Progresjon</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Endre status</th>
            </tr>
          </thead>
          <tbody>
            {paameldte.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">Ingen deltakere ennå</td>
              </tr>
            )}
            {paameldte.map((p) => {
              const prog = progresjonPerPaamelding.get(p.id);
              return (
                <tr key={p.id} className="border-b border-gray-100 last:border-0">
                  <td className="px-4 py-3 font-medium text-gray-900">{p.bruker?.navn ?? "–"}</td>
                  <td className="px-4 py-3 text-gray-600">{p.bruker?.epost ?? "–"}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusFarge[p.status]}`}>
                      {statusEtikett[p.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">
                    {prog ? `${prog.fullfort} fullf., ${prog.paabegynt} påb.` : "–"}
                  </td>
                  <td className="px-4 py-3">
                    <form action={oppdaterPaaMeldingStatusAction} className="flex gap-2 items-center">
                      <input type="hidden" name="paamelding_id" value={p.id} />
                      <input type="hidden" name="klasse_id" value={klasse.id} />
                      <select
                        name="status"
                        defaultValue={p.status}
                        className="rounded-md border border-gray-300 px-2 py-1 text-xs focus:border-[#1B3A5C] focus:outline-none"
                      >
                        {(Object.keys(statusEtikett) as Paamelding["status"][]).map((s) => (
                          <option key={s} value={s}>{statusEtikett[s]}</option>
                        ))}
                      </select>
                      <SubmitButton label="Lagre" loadingLabel="…" />
                    </form>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
