import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { hentInnloggetBruker } from "@novolms/auth";
import { createServerClient } from "@novolms/db/server";
import type { Bruker, Paamelding, LeksjonProgresjon, Samling } from "@novolms/db";
import { oppdaterSamlingStatusAction } from "./actions";

interface Props {
  params: { id: string };
}

export default async function KlasseDetaljPage({ params }: Props) {
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

  const { data: klasse } = await db
    .from("klasse")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!klasse) notFound();

  const { data: kurs } = await db
    .from("kurs")
    .select("*")
    .eq("id", klasse.kurs_id)
    .single();

  // Count total lessons in this course
  const totalLeksjoner = await hentAntallLeksjoner(db, klasse.kurs_id);

  // Fetch enrollments with student info
  const { data: paaMeldinger } = await db
    .from("paamelding")
    .select("*")
    .eq("klasse_id", params.id)
    .order("paameldt_dato");

  const brukerIder = (paaMeldinger ?? []).map((p: Paamelding) => p.bruker_id);

  let brukerMap = new Map<string, Bruker>();
  if (brukerIder.length > 0) {
    const { data: brukere } = await db
      .from("bruker")
      .select("*")
      .in("id", brukerIder);
    for (const b of brukere ?? []) brukerMap.set(b.id, b);
  }

  // Fetch progress for all enrollments
  const paameldiingIder = (paaMeldinger ?? []).map((p: Paamelding) => p.id);
  const progresjonMap = await hentProgresjon(db, paameldiingIder);

  // Fetch XP for all students
  const xpMap = await hentXp(db, brukerIder);

  // Fetch samlinger for this class
  const { data: samlinger } = await db
    .from("samling")
    .select("*")
    .eq("klasse_id", params.id)
    .order("dato_tid");

  const kursTittel = kurs
    ? typeof kurs.tittel === "object"
      ? kurs.tittel.no
      : kurs.tittel
    : "—";

  const aktive = (paaMeldinger ?? []).filter((p: Paamelding) =>
    ["paameldt", "aktiv"].includes(p.status)
  ).length;

  return (
    <div>
      <div className="mb-1">
        <Link href="/" className="text-sm text-gray-400 hover:text-[#1B3A5C]">
          ← Mine klasser
        </Link>
      </div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">{kursTittel}</p>
          <h1 className="mt-0.5 text-2xl font-bold text-[#1B3A5C]">{klasse.tittel}</h1>
          {klasse.sted && <p className="mt-1 text-sm text-gray-500">{klasse.sted}</p>}
        </div>
        <div className="flex gap-3 text-sm">
          <Stat label="Deltakere" value={aktive} />
          <Stat label="Leksjoner" value={totalLeksjoner} />
        </div>
      </div>

      <SamlingerSeksjon samlinger={samlinger ?? []} klasseId={params.id} />

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
              <th className="px-4 py-3">Navn</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Fremgang</th>
              <th className="px-4 py-3 text-right">XP</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {(paaMeldinger ?? []).map((paamelding: Paamelding) => {
              const bruker = brukerMap.get(paamelding.bruker_id);
              const progresjon = progresjonMap.get(paamelding.id) ?? [];
              const fullfort = progresjon.filter(
                (p: LeksjonProgresjon) => p.status === "fullfort"
              ).length;
              const prosent =
                totalLeksjoner > 0 ? Math.round((fullfort / totalLeksjoner) * 100) : 0;
              const xp = xpMap.get(paamelding.bruker_id) ?? 0;

              return (
                <tr key={paamelding.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-[#1B3A5C]">
                    {bruker?.navn ?? "—"}
                    <div className="text-xs font-normal text-gray-400">{bruker?.epost}</div>
                  </td>
                  <td className="px-4 py-3">
                    <PaaMeldingBadge status={paamelding.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-28 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="h-2 rounded-full bg-[#1B3A5C]"
                          style={{ width: `${prosent}%` }}
                        />
                      </div>
                      <span className="w-10 text-right text-xs text-gray-500">
                        {fullfort}/{totalLeksjoner}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-[#1B3A5C]">
                    {xp.toLocaleString("nb-NO")}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {bruker && (
                      <Link
                        href={`/klasser/${params.id}/deltaker/${bruker.id}`}
                        className="rounded-lg px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-100 hover:text-[#1B3A5C]"
                      >
                        Se detaljer →
                      </Link>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {(paaMeldinger ?? []).length === 0 && (
          <div className="py-12 text-center text-sm text-gray-400">Ingen deltakere ennå</div>
        )}
      </div>
    </div>
  );
}

async function hentAntallLeksjoner(
  db: ReturnType<typeof createServerClient>,
  kursId: string
): Promise<number> {
  const { data: koblinger } = await db
    .from("kurs_modul_kobling")
    .select("modul_id")
    .eq("kurs_id", kursId);

  if (!koblinger || koblinger.length === 0) return 0;

  const modulIder = koblinger.map((k) => k.modul_id);
  const { count } = await db
    .from("modul_leksjon_kobling")
    .select("id", { count: "exact", head: true })
    .in("modul_id", modulIder);

  return count ?? 0;
}

async function hentProgresjon(
  db: ReturnType<typeof createServerClient>,
  paameldiingIder: string[]
): Promise<Map<string, LeksjonProgresjon[]>> {
  if (paameldiingIder.length === 0) return new Map();
  const { data } = await db
    .from("leksjon_progresjon")
    .select("*")
    .in("paamelding_id", paameldiingIder);

  const map = new Map<string, LeksjonProgresjon[]>();
  for (const row of data ?? []) {
    const list = map.get(row.paamelding_id) ?? [];
    list.push(row as LeksjonProgresjon);
    map.set(row.paamelding_id, list);
  }
  return map;
}

async function hentXp(
  db: ReturnType<typeof createServerClient>,
  brukerIder: string[]
): Promise<Map<string, number>> {
  if (brukerIder.length === 0) return new Map();
  const { data } = await db
    .from("bruker_streak")
    .select("bruker_id, xp_opptjent")
    .in("bruker_id", brukerIder);

  const map = new Map<string, number>();
  for (const row of data ?? []) {
    map.set(row.bruker_id, (map.get(row.bruker_id) ?? 0) + (row.xp_opptjent ?? 0));
  }
  return map;
}

function SamlingerSeksjon({ samlinger, klasseId }: { samlinger: Samling[]; klasseId: string }) {
  const kommende = samlinger.filter((s) => s.status === "planlagt");
  const tidligere = samlinger.filter((s) => s.status === "gjennomfort" || s.status === "avlyst");

  if (samlinger.length === 0) return null;

  return (
    <div className="mb-6">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-400">Samlinger</h2>

      {kommende.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          {kommende.map((s, i) => (
            <div
              key={s.id}
              className={`flex items-start justify-between gap-4 px-4 py-3 ${
                i < kommende.length - 1 ? "border-b border-gray-100" : ""
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="min-w-[3.5rem] text-center">
                  <p className="text-xs font-medium text-gray-400">
                    {new Date(s.dato_tid).toLocaleDateString("nb-NO", { weekday: "short" }).toUpperCase()}
                  </p>
                  <p className="text-lg font-bold leading-none text-[#1B3A5C]">
                    {new Date(s.dato_tid).getDate()}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(s.dato_tid).toLocaleDateString("nb-NO", { month: "short" })}
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-[#1B3A5C]">
                      {new Date(s.dato_tid).toLocaleTimeString("nb-NO", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    <SamlingTypeBadge type={s.type} />
                    <SamlingStatusBadge status={s.status} />
                  </div>
                  <div className="mt-0.5 flex items-center gap-3 text-xs text-gray-500">
                    <span>{s.varighet_timer} t</span>
                    {s.sted_eller_lenke && (
                      <>
                        <span className="text-gray-200">·</span>
                        {s.sted_eller_lenke.startsWith("http") ? (
                          <a
                            href={s.sted_eller_lenke}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            {s.sted_eller_lenke}
                          </a>
                        ) : (
                          <span>{s.sted_eller_lenke}</span>
                        )}
                      </>
                    )}
                  </div>
                  {s.notat && <p className="mt-1 text-xs text-gray-400">{s.notat}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Link
                  href={`/klasser/${klasseId}/samlinger/${s.id}`}
                  className="rounded-md border border-gray-200 px-2.5 py-1 text-xs text-gray-500 hover:border-[#1B3A5C] hover:text-[#1B3A5C] transition-colors"
                >
                  Se / Rediger →
                </Link>
                <form action={oppdaterSamlingStatusAction}>
                  <input type="hidden" name="samling_id" value={s.id} />
                  <input type="hidden" name="klasse_id" value={klasseId} />
                  <input type="hidden" name="ny_status" value="gjennomfort" />
                  <button
                    type="submit"
                    className="rounded-md border border-gray-200 px-2.5 py-1 text-xs text-gray-500 hover:border-[#1B3A5C] hover:text-[#1B3A5C] transition-colors"
                  >
                    Gjennomført
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}

      {kommende.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-200 py-6 text-center text-sm text-gray-400">
          Ingen planlagte samlinger
        </div>
      )}

      {tidligere.length > 0 && (
        <div className="mt-3">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-300">Tidligere</p>
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white opacity-60">
            {tidligere.map((s, i) => (
              <div
                key={s.id}
                className={`flex items-center gap-3 px-4 py-2.5 ${
                  i < tidligere.length - 1 ? "border-b border-gray-100" : ""
                }`}
              >
                <span className="min-w-[4.5rem] text-xs text-gray-400">
                  {new Date(s.dato_tid).toLocaleDateString("nb-NO", { day: "numeric", month: "short" })}
                </span>
                <span className="text-xs text-gray-400">
                  {new Date(s.dato_tid).toLocaleTimeString("nb-NO", { hour: "2-digit", minute: "2-digit" })}
                </span>
                <SamlingTypeBadge type={s.type} />
                <SamlingStatusBadge status={s.status} />
                {s.sted_eller_lenke && (
                  <span className="text-xs text-gray-400 truncate max-w-xs">{s.sted_eller_lenke}</span>
                )}
                <Link
                  href={`/klasser/${klasseId}/samlinger/${s.id}`}
                  className="ml-auto rounded-md px-2.5 py-1 text-xs text-gray-400 hover:text-[#1B3A5C] transition-colors"
                >
                  Se / Rediger →
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SamlingTypeBadge({ type }: { type: Samling["type"] }) {
  const config: Record<Samling["type"], { label: string; color: string }> = {
    fysisk: { label: "Fysisk", color: "bg-blue-100 text-blue-700" },
    virtuell: { label: "Virtuell", color: "bg-purple-100 text-purple-700" },
    discord: { label: "Discord", color: "bg-indigo-100 text-indigo-700" },
    asynkron: { label: "Asynkron", color: "bg-gray-100 text-gray-500" },
  };
  const c = config[type];
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${c.color}`}>{c.label}</span>
  );
}

function SamlingStatusBadge({ status }: { status: Samling["status"] }) {
  const config: Record<Samling["status"], { label: string; color: string }> = {
    planlagt: { label: "Planlagt", color: "bg-yellow-100 text-yellow-700" },
    gjennomfort: { label: "Gjennomført", color: "bg-green-100 text-green-700" },
    avlyst: { label: "Avlyst", color: "bg-red-100 text-red-600" },
  };
  const c = config[status];
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${c.color}`}>{c.label}</span>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-center">
      <p className="text-xl font-bold text-[#1B3A5C]">{value}</p>
      <p className="text-xs text-gray-400">{label}</p>
    </div>
  );
}

function PaaMeldingBadge({ status }: { status: Paamelding["status"] }) {
  const config: Record<string, { label: string; color: string }> = {
    venteliste: { label: "Venteliste", color: "bg-yellow-100 text-yellow-700" },
    paameldt: { label: "Påmeldt", color: "bg-blue-100 text-blue-700" },
    aktiv: { label: "Aktiv", color: "bg-green-100 text-green-700" },
    droppet: { label: "Droppet ut", color: "bg-red-100 text-red-600" },
    aldri_mott: { label: "Aldri møtt", color: "bg-red-100 text-red-600" },
    selvstudie: { label: "Selvstudie", color: "bg-purple-100 text-purple-700" },
    fullfort: { label: "Fullført", color: "bg-gray-100 text-gray-600" },
    avbrutt: { label: "Avbrutt", color: "bg-gray-100 text-gray-500" },
  };
  const c = config[status] ?? { label: status, color: "bg-gray-100 text-gray-500" };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${c.color}`}>{c.label}</span>
  );
}
