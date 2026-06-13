"use client";

import { useRef, useState } from "react";
import type { VideoBlokkData } from "@skillquest/db/types";

interface Props {
  data: VideoBlokkData;
  fullfort: boolean;
  onFullfort: () => void;
}

export function BlokkVideo({ data, fullfort, onFullfort }: Props) {
  const [godtatt, setGodtatt] = useState(false);

  function handleMelding(e: MessageEvent) {
    if (typeof e.data !== "string") return;
    try {
      const msg = JSON.parse(e.data) as { event?: string; info?: { currentTime?: number; duration?: number } };
      if (msg.event === "infoDelivery" && msg.info?.currentTime && msg.info?.duration) {
        const prosent = (msg.info.currentTime / msg.info.duration) * 100;
        if (prosent >= data.fullfor_prosent && !fullfort) {
          onFullfort();
        }
      }
    } catch {}
  }

  return (
    <div className="space-y-2">
      <div className="relative aspect-video overflow-hidden rounded-lg bg-black">
        <iframe
          src={`${data.url}${data.url.includes("?") ? "&" : "?"}enablejsapi=1`}
          className="h-full w-full"
          allowFullScreen
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          onLoad={() => {
            if (typeof window !== "undefined") {
              window.addEventListener("message", handleMelding);
            }
          }}
        />
      </div>
      {fullfort ? (
        <p className="text-xs text-green-600 font-medium">✓ Video sett</p>
      ) : (
        <p className="text-xs text-gray-400">
          Se minst {data.fullfor_prosent}% av videoen for å fullføre
        </p>
      )}
    </div>
  );
}
