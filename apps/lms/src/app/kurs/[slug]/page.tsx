import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerClient } from "@novolms/db/server";

interface Props {
  params: { slug: string };
}

export default async function KursOversiktSide({ params }: Props) {
  const db = createServerClient();

  const { data: kurs } = await db
    .from("kurs")
    .select("id, tittel, beskrivelse, kurstype, cefr_nivaa")
    .eq("slug", params.slug)
    .single();

  if (!kurs) notFound();

  const tittel = (kurs.tittel as unknown as { no: string }).no;
  const beskrivelse = kurs.beskrivelse as unknown as { no: string } | null;

  return (
    <div className="mx-auto max-w-xl px-8 py-12">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
        {(kurs.kurstype as string).replace(/_/g, " ")}
        {kurs.cefr_nivaa && kurs.cefr_nivaa !== "ingen" ? ` · ${kurs.cefr_nivaa as string}` : ""}
      </p>
      <h1 className="mt-1 text-3xl font-bold text-[#1B3A5C]">{tittel}</h1>
      {beskrivelse && (
        <p className="mt-3 text-gray-500 leading-relaxed">{beskrivelse.no}</p>
      )}
      <p className="mt-8 text-sm text-gray-400">
        Velg en leksjon fra menyen til venstre for å starte.
      </p>
      <Link
        href="/"
        className="mt-6 inline-block text-sm text-blue-600 hover:underline"
      >
        ← Mine kurs
      </Link>
    </div>
  );
}
