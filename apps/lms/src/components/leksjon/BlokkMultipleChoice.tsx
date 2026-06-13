"use client";

import { useState } from "react";
import type { MultipleChoiceBlokkData } from "@skillquest/db/types";

interface Props {
  data: MultipleChoiceBlokkData;
  fullfort: boolean;
  onFullfort: () => void;
}

export function BlokkMultipleChoice({ data, fullfort, onFullfort }: Props) {
  const [valgt, setValgt] = useState<string | null>(null);
  const [svart, setSvart] = useState(false);
  const [forsok, setForsok] = useState(0);

  const riktigAlternativ = data.alternativer.find((a) => a.riktig);
  const erRiktig = valgt === riktigAlternativ?.id;

  function svar() {
    if (!valgt || svart) return;
    setSvart(true);
    setForsok((f) => f + 1);
    if (erRiktig) {
      onFullfort();
    }
  }

  function provIgjen() {
    if (forsok >= data.antall_forsok) return;
    setValgt(null);
    setSvart(false);
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 space-y-4">
      <p className="font-semibold text-gray-800">{data.sporsmaal.no}</p>

      <div className="space-y-2">
        {data.alternativer.map((alt) => {
          let stil = "border-gray-200 bg-white hover:border-[#1B3A5C]";
          if (svart && alt.id === valgt) {
            stil = erRiktig
              ? "border-green-400 bg-green-50"
              : "border-red-400 bg-red-50";
          }
          if (svart && alt.riktig && !erRiktig) {
            stil = "border-green-400 bg-green-50";
          }

          return (
            <button
              key={alt.id}
              onClick={() => !svart && setValgt(alt.id)}
              disabled={svart || fullfort}
              className={`w-full rounded-lg border px-4 py-3 text-left text-sm transition-all ${stil} ${
                valgt === alt.id && !svart ? "border-[#1B3A5C] bg-blue-50" : ""
              }`}
            >
              {alt.tekst.no}
            </button>
          );
        })}
      </div>

      {!svart && !fullfort && (
        <button
          onClick={svar}
          disabled={!valgt}
          className="rounded-lg bg-[#1B3A5C] px-5 py-2 text-sm font-medium text-white disabled:opacity-40 hover:bg-[#162f4a] transition-colors"
        >
          Svar
        </button>
      )}

      {svart && !erRiktig && !fullfort && (
        <div className="space-y-2">
          {data.forklaring_ved_feil && (
            <p className="text-sm text-red-600">{data.forklaring_ved_feil.no}</p>
          )}
          {forsok < data.antall_forsok && (
            <button
              onClick={provIgjen}
              className="text-sm text-blue-600 hover:underline"
            >
              Prøv igjen ({data.antall_forsok - forsok} forsøk igjen)
            </button>
          )}
        </div>
      )}

      {(erRiktig || fullfort) && (
        <p className="text-sm font-medium text-green-600">✓ Riktig!</p>
      )}
    </div>
  );
}
