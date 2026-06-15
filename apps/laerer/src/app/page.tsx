import { redirect } from "next/navigation";
import Link from "next/link";
import { hentInnloggetBruker } from "@novolms/auth";
import { createServerClient } from "@novolms/db/server";
import type { Klasse, KlasseRolle, Kurs } from "@novolms/db";

export default async function DashboardPage() {
  const brukerData = await hentInnloggetBruker();
  if (!brukerData) redirect("/auth/logg-inn");

  const db = createServerClient();

  const { data: roller } = await db
    .from("klasse_rolle")
    .select("*")
    .eq("bruker_id", brukerData.bruker.id);

  const klasseIder = (roller ?? []).map((r: KlasseRolle) => r.klasse_id);

  let klasser: Klasse[] = [];
  let kursMap = new Map<string, Kurs>();

  if (klasseIder.length > 0) {
    const { data: klasseData } = await db
      .from("klasse")
      .select("*")
      .in("id", klasseIder)
      .order("start_dato", { ascending: false });

    klasser = klasseData ?? [];

    const kursIder = [...new Set(klasser.map((k) => k.kurs_id))];
    const { data: kursData } = await db
      .from("kurs")
      .select("*")
      .in("id", kursIder);

    for (const k of kursData ?? []) kursMap.set(k.id, k);
  }

  const deltakertall = await hentDeltakertall(db, klasseIder);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1B3A5C]">Mine klasser</h1>
        <p className="mt-1 text-sm text-gray-500">
          {klasser.length === 0
            ? "Du er ikke tilknyttet noen klasser ennå."
            : `${klasser.length} klasse${klasser.length !== 1 ? "r" : ""} totalt`}
        </p>
      </div>

      {klasser.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center">
          <p className="text-gray-400">Ingen klasser ennå</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {klasser.map((klasse) => {
            const kurs = kursMap.get(klasse.kurs_id);
            const antall = deltakertall.get(klasse.id) ?? 0;
            return (
              <Link
                key={klasse.id}
                href={`/klasser/${klasse.id}`}
                className="group block rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium uppercase tracking-wide text-gray-400">
                      {kurs ? (typeof kurs.tittel === "object" ? kurs.tittel.no : kurs.tittel) : "—"}
                    </p>
                    <h2 className="mt-0.5 truncate text-base font-semibold text-[#1B3A5C] group-hover:underline">
                      {klasse.tittel}
                    </h2>
                  </div>
                  <StatusBadge status={klasse.status} />
                </div>

                <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
                  <span>
                    {new Date(klasse.start_dato).toLocaleDateString("nb-NO", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                  <span>·</span>
                  <span>{antall} deltakere</span>
                </div>

                {klasse.sted && (
                  <p className="mt-1 truncate text-xs text-gray-400">{klasse.sted}</p>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

async function hentDeltakertall(
  db: ReturnType<typeof createServerClient>,
  klasseIder: string[]
): Promise<Map<string, number>> {
  if (klasseIder.length === 0) return new Map();
  const { data } = await db
    .from("paamelding")
    .select("klasse_id")
    .in("klasse_id", klasseIder)
    .in("status", ["paameldt", "aktiv", "fullfort"]);

  const map = new Map<string, number>();
  for (const row of data ?? []) {
    map.set(row.klasse_id, (map.get(row.klasse_id) ?? 0) + 1);
  }
  return map;
}

function StatusBadge({ status }: { status: Klasse["status"] }) {
  const config = {
    planlagt: { label: "Planlagt", color: "bg-yellow-100 text-yellow-700" },
    aktiv: { label: "Aktiv", color: "bg-green-100 text-green-700" },
    avsluttet: { label: "Avsluttet", color: "bg-gray-100 text-gray-500" },
    avlyst: { label: "Avlyst", color: "bg-red-100 text-red-600" },
  } as const;
  const c = config[status] ?? config.planlagt;
  return (
    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${c.color}`}>
      {c.label}
    </span>
  );
}
