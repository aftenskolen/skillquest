import { notFound } from "next/navigation";
import Link from "next/link";
import { hentInnloggetBruker } from "@skillquest/auth";
import { createServerClient } from "@skillquest/db/server";
import type { InnholdsBlokk } from "@skillquest/db/types";
import { LeksjonViewer } from "@/components/leksjon/LeksjonViewer";
import { hentEllerOpprettProgresjon } from "./actions";

interface Props {
  params: { slug: string; leksjonId: string };
}

export default async function LeksjonSide({ params }: Props) {
  const { bruker } = (await hentInnloggetBruker())!;
  const db = createServerClient();

  const { data: leksjon } = await db
    .from("innhold_leksjon")
    .select("*")
    .eq("id", params.leksjonId)
    .eq("status", "publisert")
    .single();

  if (!leksjon) notFound();

  const progresjonId = await hentEllerOpprettProgresjon(params.leksjonId, params.slug);

  const { data: progresjon } = progresjonId
    ? await db.from("leksjon_progresjon").select("blokk_status, status").eq("id", progresjonId).single()
    : { data: null };

  const blokker = leksjon.innhold_blokker as InnholdsBlokk[];
  const tittel = (leksjon.tittel as { no: string }).no;
  const beskrivelse = leksjon.beskrivelse as { no: string } | null;

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <Link href={`/kurs/${params.slug}`} className="text-sm text-blue-600 hover:underline">
        ← Tilbake til kurset
      </Link>

      <div className="mt-4 mb-8">
        <h1 className="text-3xl font-bold text-[#1B3A5C]">{tittel}</h1>
        {beskrivelse && <p className="mt-2 text-gray-500">{beskrivelse.no}</p>}
        {leksjon.estimert_tid_min && (
          <p className="mt-1 text-xs text-gray-400">{leksjon.estimert_tid_min} minutter</p>
        )}
      </div>

      <LeksjonViewer
        blokker={blokker}
        progresjonId={progresjonId}
        initiellBlokkStatus={(progresjon?.blokk_status ?? {}) as Record<string, "ikke_startet" | "fullfort">}
        leksjonFullfort={progresjon?.status === "fullfort"}
        kursSlug={params.slug}
        leksjonId={params.leksjonId}
      />
    </main>
  );
}
