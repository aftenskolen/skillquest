"use client";

import { useEffect, useRef } from "react";
import type { VideoBlokkData } from "@novolms/db/types";

interface Props {
  data: VideoBlokkData;
  fullfort: boolean;
  onFullfort: () => void;
}

export function BlokkVideo({ data, fullfort, onFullfort }: Props) {
  const onFullfortRef = useRef(onFullfort);
  onFullfortRef.current = onFullfort;

  useEffect(() => {
    function handleMelding(e: MessageEvent) {
      if (typeof e.data !== "string") return;
      try {
        const msg = JSON.parse(e.data) as {
          event?: string;
          info?: { currentTime?: number; duration?: number };
        };
        if (
          msg.event === "infoDelivery" &&
          msg.info?.currentTime &&
          msg.info?.duration
        ) {
          const prosent = (msg.info.currentTime / msg.info.duration) * 100;
          if (prosent >= data.fullfor_prosent) {
            onFullfortRef.current();
          }
        }
      } catch {}
    }

    window.addEventListener("message", handleMelding);
    return () => window.removeEventListener("message", handleMelding);
  }, [data.fullfor_prosent]);

  return (
    <div className="space-y-3">
      <div className="relative aspect-video overflow-hidden rounded-lg bg-black">
        <iframe
          src={`${data.url}${data.url.includes("?") ? "&" : "?"}enablejsapi=1`}
          className="h-full w-full"
          allowFullScreen
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        />
      </div>

      {fullfort ? (
        <p className="text-sm text-green-600 font-medium">✓ Video sett</p>
      ) : (
        <div className="flex items-center gap-4">
          <p className="text-xs text-gray-400">
            Se minst {data.fullfor_prosent}% av videoen for å fullføre
          </p>
          <button
            onClick={onFullfort}
            className="text-xs text-blue-600 hover:underline shrink-0"
          >
            Merk som sett ✓
          </button>
        </div>
      )}
    </div>
  );
}
