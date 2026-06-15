import { notFound, redirect } from "next/navigation";
import { hentInnloggetBruker } from "@novolms/auth";
import { createServerClient } from "@novolms/db/server";
import type { InnholdsBlokk } from "@novolms/db/types";
import { LeksjonViewer } from "@/components/leksjon/LeksjonViewer";
import { hentEllerOpprettProgresjon } from "./actions";

interface Props {
  params: { slug: string; leksjonId: string };
}

export default async function LeksjonSide({ params }: Props) {
  const brukerData = await hentInnloggetBruker();
  if (!brukerData) redirect("/auth/logg-inn");
  const db = createServerClient();

  const [{ data: leksjon }, { data: kurs }] = await Promise.all([
    db.from("innhold_leksjon")
      .select("*")
      .eq("id", params.leksjonId)
      .eq("status", "publisert")
      .single(),
    db.from("kurs")
      .select(`
        kurs_modul_kobling (
          rekkefolge,
          innhold_modul (
            id,
            modul_leksjon_kobling (
              rekkefolge,
              innhold_leksjon ( id, status )
            )
          )
        )
      `)
      .eq("slug", params.slug)
      .single(),
  ]);

  if (!leksjon) notFound();

  // Flatten all published lessons in curriculum order
  type RawKmk = { rekkefolge: number; innhold_modul: unknown };
  type RawModul = { modul_leksjon_kobling: Array<{ rekkefolge: number; innhold_leksjon: { id: string; status: string } | null }> };

  const alleLeksjoner = [...((kurs as { kurs_modul_kobling: RawKmk[] } | null)?.kurs_modul_kobling ?? [])]
    .sort((a, b) => a.rekkefolge - b.rekkefolge)
    .flatMap((kmk) => {
      const modul = kmk.innhold_modul as unknown as RawModul | null;
      return [...(modul?.modul_leksjon_kobling ?? [])]
        .sort((a, b) => a.rekkefolge - b.rekkefolge)
        .flatMap((mlk) =>
          mlk.innhold_leksjon?.status === "publisert" ? [mlk.innhold_leksjon.id] : []
        );
    });

  const gjeldende = alleLeksjoner.indexOf(params.leksjonId);
  const nesteLeksjonId = gjeldende !== -1 ? alleLeksjoner[gjeldende + 1] : undefined;
  const forrigeLeksjonId = gjeldende > 0 ? alleLeksjoner[gjeldende - 1] : undefined;
  const nesteLeksjonHref = nesteLeksjonId
    ? `/kurs/${params.slug}/leksjon/${nesteLeksjonId}`
    : undefined;
  const forrigeLeksjonHref = forrigeLeksjonId
    ? `/kurs/${params.slug}/leksjon/${forrigeLeksjonId}`
    : undefined;

  const progresjonId = await hentEllerOpprettProgresjon(params.leksjonId, params.slug);

  const { data: progresjon } = progresjonId
    ? await db.from("leksjon_progresjon").select("blokk_status, status").eq("id", progresjonId).single()
    : { data: null };

  const blokker = leksjon.innhold_blokker as InnholdsBlokk[];
  const tittel = (leksjon.tittel as { no: string }).no;
  const beskrivelse = leksjon.beskrivelse as { no: string } | null;

  return (
    <div className="mx-auto max-w-2xl px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#1B3A5C]">{tittel}</h1>
        {beskrivelse && <p className="mt-2 text-gray-500">{beskrivelse.no}</p>}
        {leksjon.estimert_tid_min && (
          <p className="mt-1 text-xs text-gray-400">{leksjon.estimert_tid_min as number} minutter</p>
        )}
      </div>

      <LeksjonViewer
        blokker={blokker}
        progresjonId={progresjonId}
        initiellBlokkStatus={(progresjon?.blokk_status ?? {}) as Record<string, "ikke_startet" | "fullfort">}
        leksjonFullfort={progresjon?.status === "fullfort"}
        kursSlug={params.slug}
        leksjonId={params.leksjonId}
        xpVerdi={(leksjon as { xp_verdi?: number }).xp_verdi ?? 0}
        {...(nesteLeksjonHref ? { nesteLeksjonHref } : {})}
        {...(forrigeLeksjonHref ? { forrigeLeksjonHref } : {})}
      />
    </div>
  );
}
