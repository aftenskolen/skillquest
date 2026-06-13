"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { InnholdsBlokk, TekstBlokkData, VideoBlokkData, MultipleChoiceBlokkData } from "@skillquest/db/types";
import { BlokkTekst } from "./BlokkTekst";
import { BlokkVideo } from "./BlokkVideo";
import { BlokkMultipleChoice } from "./BlokkMultipleChoice";
import { oppdaterBlokkStatus } from "@/app/kurs/[slug]/leksjon/[leksjonId]/actions";

interface Props {
  blokker: InnholdsBlokk[];
  progresjonId: string | null;
  initiellBlokkStatus: Record<string, "ikke_startet" | "fullfort">;
  leksjonFullfort: boolean;
  kursSlug: string;
  leksjonId: string;
}

export function LeksjonViewer({
  blokker,
  progresjonId,
  initiellBlokkStatus,
  leksjonFullfort: initialLeksjonFullfort,
  kursSlug,
}: Props) {
  const [blokkStatus, setBlokkStatus] = useState(initiellBlokkStatus);
  const [leksjonFullfort, setLeksjonFullfort] = useState(initialLeksjonFullfort);
  const [, startTransition] = useTransition();
  const router = useRouter();

  const krevdeBlokkIds = blokker.filter((b) => b.paakrevd).map((b) => b.id);

  function markerBlokk(blokkId: string) {
    if (blokkStatus[blokkId] === "fullfort") return;

    const nyStatus = { ...blokkStatus, [blokkId]: "fullfort" as const };
    setBlokkStatus(nyStatus);

    const alleFullfort = krevdeBlokkIds.every((id) => nyStatus[id] === "fullfort");
    if (alleFullfort) setLeksjonFullfort(true);

    if (!progresjonId) return;
    startTransition(() => {
      oppdaterBlokkStatus(progresjonId, blokkId, krevdeBlokkIds).then(() => {
        router.refresh();
      });
    });
  }

  return (
    <div className="space-y-8">
      {blokker.map((blokk) => {
        const erFullfort = blokkStatus[blokk.id] === "fullfort";

        return (
          <div key={blokk.id} className="space-y-2">
            {blokk.type === "tekst" && (
              <BlokkTekst data={blokk.data as TekstBlokkData} />
            )}
            {blokk.type === "video" && (
              <BlokkVideo
                data={blokk.data as VideoBlokkData}
                fullfort={erFullfort}
                onFullfort={() => markerBlokk(blokk.id)}
              />
            )}
            {blokk.type === "multiple_choice" && (
              <BlokkMultipleChoice
                data={blokk.data as MultipleChoiceBlokkData}
                fullfort={erFullfort}
                onFullfort={() => markerBlokk(blokk.id)}
              />
            )}
          </div>
        );
      })}

      {leksjonFullfort && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-center">
          <p className="text-2xl">🎉</p>
          <p className="mt-2 font-semibold text-green-700">Leksjon fullført!</p>
          <a
            href={`/kurs/${kursSlug}`}
            className="mt-4 inline-block rounded-lg bg-[#1B3A5C] px-6 py-2 text-sm font-medium text-white hover:bg-[#162f4a] transition-colors"
          >
            Tilbake til kursoversikten
          </a>
        </div>
      )}
    </div>
  );
}
