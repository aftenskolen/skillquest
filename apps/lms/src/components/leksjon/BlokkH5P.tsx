"use client";

import { useState, useEffect, useRef } from "react";
import type { H5PBlokkData } from "@novolms/db/types";
import { lagreBesvarelseAction } from "@/app/kurs/[slug]/leksjon/[leksjonId]/actions";

interface Props {
  data: H5PBlokkData;
  fullfort: boolean;
  onFullfort: () => void;
  progresjonId: string | null;
  blokkId: string;
}

const FULLFORT_VERB = new Set([
  "http://adlnet.gov/expapi/verbs/completed",
  "http://adlnet.gov/expapi/verbs/passed",
  "http://adlnet.gov/expapi/verbs/mastered",
]);

function erEksternEmbed(url: string): boolean {
  return !url.includes("supabase");
}

export function BlokkH5P({ data, fullfort, onFullfort, progresjonId, blokkId }: Props) {
  const [lastet, setLastet] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!progresjonId) return;

    const pid = progresjonId; // narrow type inside closure

    function handleMessage(event: MessageEvent) {
      if (event.data?.type !== "h5p-xapi") return;
      const stmt = event.data.statement as Record<string, unknown>;
      if (!stmt) return;

      const verbId = (stmt.verb as { id?: string } | undefined)?.id ?? "";
      const result = stmt.result as {
        score?: { raw?: number; max?: number; scaled?: number };
        success?: boolean;
        response?: string;
        duration?: string;
      } | undefined;

      const stmtObj = stmt.object as { id?: string; definition?: Record<string, unknown> } | undefined;

      // Save to leksjon_besvarelse
      lagreBesvarelseAction(
        pid,
        blokkId,
        {
          type: "h5p",
          activity_id: stmtObj?.id ?? "",
          verb: verbId,
          definition: stmtObj?.definition ?? null,
        },
        {
          verb: verbId,
          score_raw: result?.score?.raw ?? null,
          score_max: result?.score?.max ?? null,
          score_scaled: result?.score?.scaled ?? null,
          success: result?.success ?? null,
          completion: (result as Record<string, unknown> | undefined)?.completion ?? null,
          response: result?.response ?? null,
          duration: result?.duration ?? null,
        },
        result?.success ?? false
      );

      // Auto-complete on finished verbs
      if (FULLFORT_VERB.has(verbId) && !fullfort) {
        onFullfort();
      }
    }

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [progresjonId, blokkId, fullfort, onFullfort]);

  const visUrl = data.h5p_embed_url;

  if (!visUrl && !data.h5p_fil_url) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 px-6 py-8 text-center">
        <p className="text-sm text-gray-400">H5P-innhold ikke konfigurert ennå.</p>
      </div>
    );
  }

  const iframeSrc = visUrl
    ? erEksternEmbed(visUrl)
      ? visUrl
      : `/api/h5p-player?base=${encodeURIComponent(visUrl)}`
    : null;

  return (
    <div className="space-y-3">
      {iframeSrc ? (
        <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
          {!lastet && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm text-gray-400">Laster H5P-innhold…</span>
            </div>
          )}
          <iframe
            ref={iframeRef}
            src={iframeSrc}
            className="w-full min-h-[500px]"
            style={{ opacity: lastet ? 1 : 0, transition: "opacity 0.3s" }}
            onLoad={() => setLastet(true)}
            allowFullScreen
            title="H5P innhold"
          />
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-gray-50 px-6 py-8 text-center">
          <p className="text-sm text-gray-500 mb-3">
            H5P-fil er lastet opp, men innholdsvisning er ikke tilgjengelig direkte.
          </p>
          <a
            href={data.h5p_fil_url}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-[#1B3A5C] hover:underline"
          >
            Last ned H5P-fil ↓
          </a>
        </div>
      )}

      {!fullfort && (
        <button
          onClick={onFullfort}
          className="w-full rounded-lg border border-[#1B3A5C] py-2.5 text-sm font-medium text-[#1B3A5C] hover:bg-[#1B3A5C] hover:text-white transition-colors"
        >
          ✓ Merk som fullført
        </button>
      )}
      {fullfort && (
        <p className="text-center text-sm text-green-600 font-medium">✓ Fullført</p>
      )}
    </div>
  );
}
