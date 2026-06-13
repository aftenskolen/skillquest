"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { InnholdsBlokk, TekstBlokkData, VideoBlokkData, MultipleChoiceBlokkData } from "@novolms/db/types";
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
  nesteLeksjonHref?: string;
  forrigeLeksjonHref?: string;
}

export function LeksjonViewer({
  blokker,
  progresjonId,
  initiellBlokkStatus,
  leksjonFullfort: initialLeksjonFullfort,
  kursSlug,
  nesteLeksjonHref,
  forrigeLeksjonHref,
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
        <div className="rounded-xl border border-green-200 bg-green-50 px-6 py-4 text-center">
          <p className="font-semibold text-green-700">✓ Leksjon fullført!</p>
        </div>
      )}

      <div className="flex items-center justify-between border-t border-gray-200 pt-6">
        <div>
          {forrigeLeksjonHref && (
            <a
              href={forrigeLeksjonHref}
              className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:border-[#1B3A5C] hover:text-[#1B3A5C] transition-colors"
            >
              ← Forrige leksjon
            </a>
          )}
        </div>
        <div>
          {nesteLeksjonHref ? (
            <a
              href={nesteLeksjonHref}
              className="flex items-center gap-2 rounded-lg bg-[#1B3A5C] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#162f4a] transition-colors"
            >
              Neste leksjon →
            </a>
          ) : (
            <a
              href={`/kurs/${kursSlug}`}
              className="flex items-center gap-2 rounded-lg bg-[#1B3A5C] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#162f4a] transition-colors"
            >
              Tilbake til oversikten
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
