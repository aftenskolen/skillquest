import Link from "next/link";
import { notFound } from "next/navigation";
import { hentInnloggetBruker } from "@skillquest/auth";
import { createServerClient } from "@skillquest/db/server";

interface Props {
  params: { slug: string };
}

export default async function KursSide({ params }: Props) {
  const { bruker } = (await hentInnloggetBruker())!;
  const db = createServerClient();

  const { data: kurs } = await db
    .from("kurs")
    .select(`
      id, tittel, beskrivelse, slug, kurstype, cefr_nivaa,
      kurs_modul_kobling (
        rekkefolge,
        modul_id,
        innhold_modul (
          id, tittel, beskrivelse,
          modul_leksjon_kobling (
            rekkefolge,
            leksjon_id,
            innhold_leksjon (
              id, tittel, estimert_tid_min, status
            )
          )
        )
      )
    `)
    .eq("slug", params.slug)
    .single();

  if (!kurs) notFound();

  const { data: paamelding } = await db
    .from("paamelding")
    .select("id")
    .eq("bruker_id", bruker.id)
    .in("status", ["aktiv", "paameldt"])
    .limit(1)
    .maybeSingle();

  const { data: progresjon } = paamelding
    ? await db
        .from("leksjon_progresjon")
        .select("leksjon_id, status")
        .eq("paamelding_id", paamelding.id)
    : { data: [] };

  const fullforte = new Set((progresjon ?? []).filter((p) => p.status === "fullfort").map((p) => p.leksjon_id));

  const moduler = [...(kurs.kurs_modul_kobling ?? [])]
    .sort((a, b) => a.rekkefolge - b.rekkefolge)
    .map((kmk) => {
      const modul = kmk.innhold_modul as unknown as {
        id: string;
        tittel: { no: string };
        beskrivelse: { no: string } | null;
        modul_leksjon_kobling: Array<{
          rekkefolge: number;
          leksjon_id: string;
          innhold_leksjon: { id: string; tittel: { no: string }; estimert_tid_min: number | null; status: string } | null;
        }>;
      } | null;
      if (!modul) return null;
      const leksjoner = [...(modul.modul_leksjon_kobling ?? [])]
        .sort((a, b) => a.rekkefolge - b.rekkefolge)
        .map((mlk) => mlk.innhold_leksjon)
        .filter((l): l is NonNullable<typeof l> => l !== null && l.status === "publisert");
      return { ...modul, leksjoner };
    })
    .filter((m): m is NonNullable<typeof m> => m !== null);

  const tittel = (kurs.tittel as { no: string }).no;
  const beskrivelse = kurs.beskrivelse as { no: string } | null;

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <Link href="/" className="text-sm text-blue-600 hover:underline">← Mine kurs</Link>

      <div className="mt-4">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
          {kurs.kurstype.replace(/_/g, " ")}
          {kurs.cefr_nivaa && kurs.cefr_nivaa !== "ingen" ? ` · ${kurs.cefr_nivaa}` : ""}
        </p>
        <h1 className="mt-1 text-3xl font-bold text-[#1B3A5C]">{tittel}</h1>
        {beskrivelse && <p className="mt-2 text-gray-500">{beskrivelse.no}</p>}
      </div>

      <div className="mt-10 space-y-8">
        {moduler.map((modul, i) => (
          <div key={modul.id}>
            <h2 className="text-lg font-semibold text-gray-800">
              {i + 1}. {modul.tittel.no}
            </h2>
            {modul.beskrivelse && (
              <p className="mt-1 text-sm text-gray-500">{modul.beskrivelse.no}</p>
            )}
            <ul className="mt-3 space-y-2">
              {modul.leksjoner.map((leksjon, j) => {
                const fullfort = fullforte.has(leksjon.id);
                return (
                  <li key={leksjon.id}>
                    <Link
                      href={`/kurs/${params.slug}/leksjon/${leksjon.id}`}
                      className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 hover:border-[#1B3A5C] hover:shadow-sm transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-medium ${
                          fullfort
                            ? "bg-green-100 text-green-600"
                            : "bg-gray-100 text-gray-500"
                        }`}>
                          {fullfort ? "✓" : j + 1}
                        </span>
                        <span className="font-medium text-gray-800">{leksjon.tittel.no}</span>
                      </div>
                      {leksjon.estimert_tid_min && (
                        <span className="text-xs text-gray-400">{leksjon.estimert_tid_min} min</span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </main>
  );
}
