"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { InnholdsBlokk, TekstBlokkData, VideoBlokkData, MultipleChoiceBlokkData, H5PBlokkData } from "@novolms/db/types";
import { BlokkTekst } from "./BlokkTekst";
import { BlokkVideo } from "./BlokkVideo";
import { BlokkMultipleChoice } from "./BlokkMultipleChoice";
import { BlokkH5P } from "./BlokkH5P";
import { oppdaterBlokkStatus, nullstillProgresjonAction } from "@/app/kurs/[slug]/leksjon/[leksjonId]/actions";

interface Props {
  blokker: InnholdsBlokk[];
  progresjonId: string | null;
  initiellBlokkStatus: Record<string, "ikke_startet" | "fullfort">;
  leksjonFullfort: boolean;
  kursSlug: string;
  leksjonId: string;
  xpVerdi?: number;
  nesteLeksjonHref?: string;
  forrigeLeksjonHref?: string;
}

export function LeksjonViewer({
  blokker,
  progresjonId,
  initiellBlokkStatus,
  leksjonFullfort: initialLeksjonFullfort,
  kursSlug,
  xpVerdi = 0,
  nesteLeksjonHref,
  forrigeLeksjonHref,
}: Props) {
  const [blokkStatus, setBlokkStatus] = useState(initiellBlokkStatus);
  const [leksjonFullfort, setLeksjonFullfort] = useState(initialLeksjonFullfort);
  const [nullstiller, startTransition] = useTransition();
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

  function provIgjen() {
    if (!progresjonId) return;
    startTransition(() => {
      nullstillProgresjonAction(progresjonId).then(() => {
        setBlokkStatus({});
        setLeksjonFullfort(false);
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
                progresjonId={progresjonId}
                blokkId={blokk.id}
              />
            )}
            {blokk.type === "h5p" && (
              <BlokkH5P
                data={blokk.data as H5PBlokkData}
                fullfort={erFullfort}
                onFullfort={() => markerBlokk(blokk.id)}
                progresjonId={progresjonId}
                blokkId={blokk.id}
              />
            )}
          </div>
        );
      })}

      {leksjonFullfort && (
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 px-6 py-6 text-center space-y-3">
          <div className="flex justify-center gap-1">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="text-3xl"
                style={{
                  display: "inline-block",
                  animation: "starPop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) both",
                  animationDelay: `${i * 0.12}s`,
                }}
              >
                ⭐
              </span>
            ))}
          </div>
          <p className="font-semibold text-yellow-800">Leksjon fullført!</p>
          {xpVerdi > 0 && (
            <span className="inline-block rounded-full bg-yellow-200 px-4 py-1 text-sm font-bold text-yellow-800">
              +{xpVerdi} XP
            </span>
          )}
          <div>
            <button
              onClick={provIgjen}
              disabled={nullstiller}
              className="mt-1 text-sm text-yellow-700 underline underline-offset-2 hover:text-yellow-900 disabled:opacity-50"
            >
              {nullstiller ? "Nullstiller…" : "Prøv igjen"}
            </button>
          </div>
          <style>{`
            @keyframes starPop {
              0%   { transform: scale(0) rotate(-30deg); opacity: 0; }
              70%  { transform: scale(1.3) rotate(5deg); }
              100% { transform: scale(1) rotate(0deg); opacity: 1; }
            }
          `}</style>
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
