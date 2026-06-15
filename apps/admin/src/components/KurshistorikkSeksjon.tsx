import { createServerClient } from "@novolms/db/server";
import type { Paamelding, Klasse, Kurs } from "@novolms/db/types";

const paaMeldingStatusEtikett: Record<Paamelding["status"], string> = {
  venteliste: "Venteliste",
  paameldt: "Påmeldt",
  aktiv: "Aktiv",
  droppet: "Droppet",
  aldri_mott: "Aldri møtt",
  selvstudie: "Selvstudie",
  fullfort: "Fullført",
  avbrutt: "Avbrutt",
};

const paaMeldingStatusFarge: Record<Paamelding["status"], string> = {
  venteliste: "bg-yellow-100 text-yellow-700",
  paameldt: "bg-blue-100 text-blue-700",
  aktiv: "bg-green-100 text-green-700",
  droppet: "bg-gray-100 text-gray-500",
  aldri_mott: "bg-red-100 text-red-600",
  selvstudie: "bg-purple-100 text-purple-700",
  fullfort: "bg-teal-100 text-teal-700",
  avbrutt: "bg-red-100 text-red-600",
};

const AKTIVE_STATUSER: Paamelding["status"][] = ["paameldt", "aktiv", "selvstudie", "venteliste"];

interface PaaMeldingMedKlasse extends Paamelding {
  klasse: (Klasse & { kurs: Pick<Kurs, "id" | "tittel"> | null }) | null;
}

interface Props {
  brukerId: string;
}

export async function KurshistorikkSeksjon({ brukerId }: Props) {
  const db = createServerClient();

  // 1. Påmeldinger med klasse-join
  const { data: rawPaameldte } = await db
    .from("paamelding")
    .select("*, klasse ( id, tittel, start_dato, slutt_dato, status, kurs_id )")
    .eq("bruker_id", brukerId)
    .order("paameldt_dato", { ascending: false });

  const paameldte = (rawPaameldte ?? []) as unknown as PaaMeldingMedKlasse[];

  if (paameldte.length === 0) {
    return (
      <div className="rounded-xl bg-white border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-[#1B3A5C] mb-3">Kurshistorikk</h2>
        <p className="text-sm text-gray-400">Ingen påmeldinger registrert.</p>
      </div>
    );
  }

  const paaMeldingIds = paameldte.map((p) => p.id);
  const kursIds = [...new Set(
    paameldte.map((p) => p.klasse?.kurs_id).filter((id): id is string => Boolean(id))
  )];

  // 2. Kurs-titler og kursets modullister
  const [
    { data: rawKurs },
    { data: rawProgresjon },
    { data: rawKursModulKoblinger },
  ] = await Promise.all([
    kursIds.length > 0
      ? db.from("kurs").select("id, tittel").in("id", kursIds)
      : Promise.resolve({ data: [] }),
    paaMeldingIds.length > 0
      ? db.from("leksjon_progresjon").select("paamelding_id, status").in("paamelding_id", paaMeldingIds)
      : Promise.resolve({ data: [] }),
    kursIds.length > 0
      ? db.from("kurs_modul_kobling").select("kurs_id, modul_id").in("kurs_id", kursIds)
      : Promise.resolve({ data: [] }),
  ]);

  const kursTitler = new Map(
    (rawKurs ?? []).map((k) => [k.id as string, ((k as { tittel: { no: string } }).tittel).no])
  );

  // 3. Hent leksjonkoblinger per modul for å telle totale leksjoner per kurs
  const modulIds = [...new Set((rawKursModulKoblinger ?? []).map((k) => (k as { modul_id: string }).modul_id))];

  const { data: rawModulLeksjonKoblinger } = modulIds.length > 0
    ? await db
        .from("modul_leksjon_kobling")
        .select("modul_id, innhold_leksjon ( id, status )")
        .in("modul_id", modulIds)
    : { data: [] };

  // modul_id → leksjon_ids (bare publiserte)
  const publiserteLeksjonerPerModul = new Map<string, string[]>();
  for (const mk of (rawModulLeksjonKoblinger ?? []) as unknown as Array<{
    modul_id: string;
    innhold_leksjon: { id: string; status: string } | null;
  }>) {
    if (mk.innhold_leksjon?.status !== "publisert") continue;
    const liste = publiserteLeksjonerPerModul.get(mk.modul_id) ?? [];
    liste.push(mk.innhold_leksjon.id);
    publiserteLeksjonerPerModul.set(mk.modul_id, liste);
  }

  // kurs_id → totalt antall publiserte leksjoner
  const totalLeksjonerPerKurs = new Map<string, number>();
  for (const kmk of (rawKursModulKoblinger ?? []) as Array<{ kurs_id: string; modul_id: string }>) {
    const antall = publiserteLeksjonerPerModul.get(kmk.modul_id)?.length ?? 0;
    totalLeksjonerPerKurs.set(kmk.kurs_id, (totalLeksjonerPerKurs.get(kmk.kurs_id) ?? 0) + antall);
  }

  // 4. Progresjon per påmelding
  const fullfortPerPaamelding = new Map<string, number>();
  const paabegyntPerPaamelding = new Map<string, number>();
  for (const p of (rawProgresjon ?? []) as Array<{ paamelding_id: string; status: string }>) {
    if (p.status === "fullfort") {
      fullfortPerPaamelding.set(p.paamelding_id, (fullfortPerPaamelding.get(p.paamelding_id) ?? 0) + 1);
    } else if (p.status === "paabegynt") {
      paabegyntPerPaamelding.set(p.paamelding_id, (paabegyntPerPaamelding.get(p.paamelding_id) ?? 0) + 1);
    }
  }

  const aktive = paameldte.filter((p) => AKTIVE_STATUSER.includes(p.status));
  const historiske = paameldte.filter((p) => !AKTIVE_STATUSER.includes(p.status));

  return (
    <div className="rounded-xl bg-white border border-gray-200 divide-y divide-gray-100">
      <div className="px-6 py-4">
        <h2 className="text-base font-semibold text-[#1B3A5C]">Kurshistorikk</h2>
      </div>

      {aktive.length > 0 && (
        <div className="px-6 py-4 space-y-3">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Aktive kurs ({aktive.length})</p>
          {aktive.map((p) => (
            <KursKort
              key={p.id}
              paamelding={p}
              kursTittel={p.klasse?.kurs_id ? kursTitler.get(p.klasse.kurs_id) ?? "Ukjent kurs" : "Ukjent kurs"}
              totalLeksjoner={p.klasse?.kurs_id ? (totalLeksjonerPerKurs.get(p.klasse.kurs_id) ?? 0) : 0}
              fullfortLeksjoner={fullfortPerPaamelding.get(p.id) ?? 0}
              paabegyntLeksjoner={paabegyntPerPaamelding.get(p.id) ?? 0}
            />
          ))}
        </div>
      )}

      {historiske.length > 0 && (
        <div className="px-6 py-4 space-y-3">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Historikk ({historiske.length})</p>
          {historiske.map((p) => (
            <KursKort
              key={p.id}
              paamelding={p}
              kursTittel={p.klasse?.kurs_id ? kursTitler.get(p.klasse.kurs_id) ?? "Ukjent kurs" : "Ukjent kurs"}
              totalLeksjoner={p.klasse?.kurs_id ? (totalLeksjonerPerKurs.get(p.klasse.kurs_id) ?? 0) : 0}
              fullfortLeksjoner={fullfortPerPaamelding.get(p.id) ?? 0}
              paabegyntLeksjoner={paabegyntPerPaamelding.get(p.id) ?? 0}
            />
          ))}
        </div>
      )}

      {aktive.length === 0 && historiske.length === 0 && (
        <div className="px-6 py-4">
          <p className="text-sm text-gray-400">Ingen påmeldinger registrert.</p>
        </div>
      )}
    </div>
  );
}

interface KursKortProps {
  paamelding: PaaMeldingMedKlasse;
  kursTittel: string;
  totalLeksjoner: number;
  fullfortLeksjoner: number;
  paabegyntLeksjoner: number;
}

function KursKort({ paamelding: p, kursTittel, totalLeksjoner, fullfortLeksjoner, paabegyntLeksjoner }: KursKortProps) {
  const prosent = totalLeksjoner > 0 ? Math.round((fullfortLeksjoner / totalLeksjoner) * 100) : 0;
  const klasse = p.klasse;

  return (
    <div className="rounded-lg border border-gray-200 p-4 space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-medium text-gray-900 text-sm">{kursTittel}</p>
          {klasse && (
            <p className="text-xs text-gray-500 mt-0.5">
              {klasse.tittel} · {new Date(klasse.start_dato).toLocaleDateString("nb-NO")} – {new Date(klasse.slutt_dato).toLocaleDateString("nb-NO")}
            </p>
          )}
        </div>
        <span className={`shrink-0 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${paaMeldingStatusFarge[p.status]}`}>
          {paaMeldingStatusEtikett[p.status]}
        </span>
      </div>

      {/* Progresjon */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>
            {fullfortLeksjoner} av {totalLeksjoner > 0 ? totalLeksjoner : "?"} leksjoner fullført
            {paabegyntLeksjoner > 0 && ` · ${paabegyntLeksjoner} påbegynt`}
          </span>
          {totalLeksjoner > 0 && (
            <span className="font-medium text-gray-700">{prosent}%</span>
          )}
        </div>
        {totalLeksjoner > 0 && (
          <div className="h-1.5 w-full rounded-full bg-gray-100">
            <div
              className={`h-1.5 rounded-full transition-all ${prosent === 100 ? "bg-teal-500" : "bg-[#1B3A5C]"}`}
              style={{ width: `${prosent}%` }}
            />
          </div>
        )}
      </div>

      {p.fullfort_dato && (
        <p className="text-xs text-teal-600 font-medium">
          ✓ Fullført {new Date(p.fullfort_dato).toLocaleDateString("nb-NO")}
        </p>
      )}
    </div>
  );
}
