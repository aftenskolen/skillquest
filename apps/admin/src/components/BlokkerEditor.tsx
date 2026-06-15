"use client";

import { useState } from "react";
import type {
  InnholdsBlokk,
  TekstBlokkData,
  VideoBlokkData,
  MultipleChoiceBlokkData,
  MultipleChoiceAlternativ,
  H5PBlokkData,
} from "@novolms/db/types";
import { lagreBlokkerAction, uploadH5PAction } from "@/app/leksjoner/[id]/rediger/actions";

interface Props {
  leksjonId: string;
  initialBlokker: InnholdsBlokk[];
}

const blokkTypeEtikett: Record<InnholdsBlokk["type"], string> = {
  tekst: "Tekst",
  video: "Video",
  multiple_choice: "Quiz",
  h5p: "H5P",
};

function nyId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function BlokkerEditor({ leksjonId, initialBlokker }: Props) {
  const [blokker, setBlokker] = useState<InnholdsBlokk[]>(initialBlokker);
  const [lagret, setLagret] = useState(false);

  function oppdaterBlokk(id: string, nyData: InnholdsBlokk["data"]) {
    setBlokker((prev) => prev.map((b) => (b.id === id ? { ...b, data: nyData } : b)));
    setLagret(false);
  }

  function leggTilBlokk(type: InnholdsBlokk["type"]) {
    const id = nyId();
    let data: InnholdsBlokk["data"];
    if (type === "tekst") {
      data = { innhold: { no: "" } } satisfies TekstBlokkData;
    } else if (type === "video") {
      data = { url: "", tekstingsfil_url: null, fullfor_prosent: 80 } satisfies VideoBlokkData;
    } else if (type === "h5p") {
      data = { h5p_fil_url: "", h5p_embed_url: null } satisfies H5PBlokkData;
    } else {
      data = {
        sporsmaal: { no: "" },
        alternativer: [
          { id: nyId(), tekst: { no: "" }, riktig: false },
          { id: nyId(), tekst: { no: "" }, riktig: false },
        ],
        forklaring_ved_feil: null,
        antall_forsok: 3,
      } satisfies MultipleChoiceBlokkData;
    }
    setBlokker((prev) => [...prev, { id, type, data, paakrevd: true }]);
    setLagret(false);
  }

  function fjernBlokk(id: string) {
    setBlokker((prev) => prev.filter((b) => b.id !== id));
    setLagret(false);
  }

  function flytt(id: string, retning: "opp" | "ned") {
    setBlokker((prev) => {
      const idx = prev.findIndex((b) => b.id === id);
      if (idx === -1) return prev;
      const ny = [...prev];
      const swap = retning === "opp" ? idx - 1 : idx + 1;
      if (swap < 0 || swap >= ny.length) return prev;
      const tmp = ny[idx]!;
      ny[idx] = ny[swap]!;
      ny[swap] = tmp;
      return ny;
    });
    setLagret(false);
  }

  async function handleLagre(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData();
    fd.set("leksjon_id", leksjonId);
    fd.set("blokker", JSON.stringify(blokker));
    await lagreBlokkerAction(fd);
    setLagret(true);
  }

  return (
    <div className="space-y-4">
      {blokker.length === 0 && (
        <div className="rounded-xl border-2 border-dashed border-gray-200 px-6 py-10 text-center">
          <p className="text-sm text-gray-400">Ingen blokker ennå. Legg til innhold nedenfor.</p>
        </div>
      )}

      {blokker.map((blokk, idx) => (
        <div key={blokk.id} className="rounded-xl bg-white border border-gray-200 overflow-hidden">
          {/* Blokk-header */}
          <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                {blokkTypeEtikett[blokk.type]}
              </span>
              <label className="flex items-center gap-1.5 text-xs text-gray-500">
                <input
                  type="checkbox"
                  checked={blokk.paakrevd}
                  onChange={(e) =>
                    setBlokker((prev) =>
                      prev.map((b) => (b.id === blokk.id ? { ...b, paakrevd: e.target.checked } : b))
                    )
                  }
                  className="rounded"
                />
                Påkrevd
              </label>
            </div>
            <div className="flex items-center gap-1">
              {idx > 0 && (
                <button onClick={() => flytt(blokk.id, "opp")} className="px-2 py-1 text-xs text-gray-500 hover:text-[#1B3A5C] border border-gray-200 rounded">↑</button>
              )}
              {idx < blokker.length - 1 && (
                <button onClick={() => flytt(blokk.id, "ned")} className="px-2 py-1 text-xs text-gray-500 hover:text-[#1B3A5C] border border-gray-200 rounded">↓</button>
              )}
              <button onClick={() => fjernBlokk(blokk.id)} className="px-2 py-1 text-xs text-red-500 hover:text-red-700 border border-red-100 rounded">Slett</button>
            </div>
          </div>

          {/* Blokk-innhold */}
          <div className="p-4">
            {blokk.type === "tekst" && (
              <TekstBlokk data={blokk.data as TekstBlokkData} onChange={(d) => oppdaterBlokk(blokk.id, d)} />
            )}
            {blokk.type === "video" && (
              <VideoBlokk data={blokk.data as VideoBlokkData} onChange={(d) => oppdaterBlokk(blokk.id, d)} />
            )}
            {blokk.type === "multiple_choice" && (
              <QuizBlokk data={blokk.data as MultipleChoiceBlokkData} onChange={(d) => oppdaterBlokk(blokk.id, d)} />
            )}
            {blokk.type === "h5p" && (
              <H5PBlokk data={blokk.data as H5PBlokkData} onChange={(d) => oppdaterBlokk(blokk.id, d)} />
            )}
          </div>
        </div>
      ))}

      {/* Legg til blokk */}
      <div className="flex gap-2 flex-wrap">
        {(["tekst", "video", "multiple_choice", "h5p"] as InnholdsBlokk["type"][]).map((type) => (
          <button
            key={type}
            onClick={() => leggTilBlokk(type)}
            className="flex items-center gap-2 rounded-lg border border-dashed border-gray-300 px-4 py-2.5 text-sm text-gray-600 hover:border-[#1B3A5C] hover:text-[#1B3A5C] transition-colors"
          >
            + {blokkTypeEtikett[type]}
          </button>
        ))}
      </div>

      {/* Lagre-knapp */}
      <form onSubmit={handleLagre} className="flex items-center gap-4 pt-2">
        <button
          type="submit"
          className="rounded-lg bg-[#1B3A5C] px-6 py-2.5 text-sm font-medium text-white hover:bg-[#162f4a] transition-colors"
        >
          Lagre innhold
        </button>
        {lagret && <span className="text-sm text-green-600">✓ Lagret</span>}
      </form>
    </div>
  );
}

// ── Tekst-blokk ──────────────────────────────────────────────────────────────

function TekstBlokk({ data, onChange }: { data: TekstBlokkData; onChange: (d: TekstBlokkData) => void }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">Innhold (støtter Markdown)</label>
      <textarea
        value={data.innhold.no}
        onChange={(e) => onChange({ innhold: { ...data.innhold, no: e.target.value } })}
        rows={6}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:border-[#1B3A5C] focus:outline-none resize-y"
        placeholder="Skriv tekst her... **fet**, *kursiv*, ## overskrift"
      />
    </div>
  );
}

// ── Video-blokk ───────────────────────────────────────────────────────────────

function VideoBlokk({ data, onChange }: { data: VideoBlokkData; onChange: (d: VideoBlokkData) => void }) {
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Video-URL (YouTube, Vimeo o.l.)</label>
        <input
          type="url"
          value={data.url}
          onChange={(e) => onChange({ ...data, url: e.target.value })}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#1B3A5C] focus:outline-none"
          placeholder="https://www.youtube.com/embed/..."
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Fullføringsprosent (%)</label>
          <input
            type="number"
            min={1}
            max={100}
            value={data.fullfor_prosent}
            onChange={(e) => onChange({ ...data, fullfor_prosent: Number(e.target.value) })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#1B3A5C] focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Tekstingsfil-URL (valgfri)</label>
          <input
            type="url"
            value={data.tekstingsfil_url ?? ""}
            onChange={(e) => onChange({ ...data, tekstingsfil_url: e.target.value || null })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#1B3A5C] focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
}

// ── H5P-blokk ─────────────────────────────────────────────────────────────────

function H5PBlokk({ data, onChange }: { data: H5PBlokkData; onChange: (d: H5PBlokkData) => void }) {
  const [laster, setLaster] = useState(false);
  const [feil, setFeil] = useState<string | null>(null);

  async function handleFil(e: React.ChangeEvent<HTMLInputElement>) {
    const fil = e.target.files?.[0];
    if (!fil) return;
    setLaster(true);
    setFeil(null);
    const fd = new FormData();
    fd.set("file", fil);
    const resultat = await uploadH5PAction(fd);
    setLaster(false);
    if ("error" in resultat) {
      setFeil(resultat.error);
    } else {
      onChange({ h5p_fil_url: resultat.fil_url, h5p_embed_url: resultat.innhold_url });
    }
    e.target.value = "";
  }

  const harFil = Boolean(data.h5p_fil_url);

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-medium text-gray-500 mb-2">Last opp H5P-fil</p>
        {harFil ? (
          <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3">
            <span className="text-green-600 text-sm">✓ Fil lastet opp og pakket ut</span>
            <label className="ml-auto cursor-pointer text-xs text-[#1B3A5C] hover:underline">
              Erstatt fil
              <input type="file" accept=".h5p" className="sr-only" onChange={handleFil} disabled={laster} />
            </label>
          </div>
        ) : (
          <label className={`flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-6 py-8 cursor-pointer transition-colors ${laster ? "border-gray-200 bg-gray-50" : "border-gray-300 hover:border-[#1B3A5C]"}`}>
            {laster ? (
              <>
                <span className="text-sm text-gray-500">Pakker ut H5P-innhold…</span>
                <span className="text-xs text-gray-400">Dette kan ta litt tid for store filer</span>
              </>
            ) : (
              <>
                <span className="text-2xl">📦</span>
                <span className="text-sm font-medium text-gray-700">Klikk for å laste opp .h5p-fil</span>
                <span className="text-xs text-gray-400">Filen pakkes ut og lagres automatisk</span>
              </>
            )}
            <input type="file" accept=".h5p" className="sr-only" onChange={handleFil} disabled={laster} />
          </label>
        )}
        {feil && <p className="mt-2 text-xs text-red-600">{feil}</p>}
      </div>

      <div>
        <p className="text-xs font-medium text-gray-500 mb-1">Alternativt: Embed-URL (H5P.org, Lumi o.l.)</p>
        <input
          type="url"
          value={data.h5p_embed_url ?? ""}
          onChange={(e) => onChange({ ...data, h5p_embed_url: e.target.value || null })}
          placeholder="https://h5p.org/h5p/embed/..."
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#1B3A5C] focus:outline-none"
        />
        <p className="mt-1 text-xs text-gray-400">
          Lim inn embed-URL fra H5P.org eller Lumi. Overstyres av opplastet fil.
        </p>
      </div>

      {(harFil || data.h5p_embed_url) && (
        <div className="rounded-lg bg-gray-50 px-4 py-3 text-xs text-gray-500 space-y-1">
          {data.h5p_fil_url && <p className="truncate">Fil: {data.h5p_fil_url.split("/").pop()}</p>}
          {data.h5p_embed_url && <p className="truncate">Innhold: {data.h5p_embed_url}</p>}
        </div>
      )}
    </div>
  );
}

// ── Quiz-blokk ────────────────────────────────────────────────────────────────

function QuizBlokk({ data, onChange }: { data: MultipleChoiceBlokkData; onChange: (d: MultipleChoiceBlokkData) => void }) {
  function oppdaterAlternativ(id: string, endringer: Partial<MultipleChoiceAlternativ>) {
    onChange({
      ...data,
      alternativer: data.alternativer.map((a) => (a.id === id ? { ...a, ...endringer } : a)),
    });
  }

  function leggTilAlternativ() {
    onChange({
      ...data,
      alternativer: [...data.alternativer, { id: nyId(), tekst: { no: "" }, riktig: false }],
    });
  }

  function fjernAlternativ(id: string) {
    if (data.alternativer.length <= 2) return;
    onChange({ ...data, alternativer: data.alternativer.filter((a) => a.id !== id) });
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Spørsmål</label>
        <textarea
          value={data.sporsmaal.no}
          onChange={(e) => onChange({ ...data, sporsmaal: { ...data.sporsmaal, no: e.target.value } })}
          rows={2}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#1B3A5C] focus:outline-none resize-none"
        />
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium text-gray-500">Svaralternativer (huk av riktig svar)</p>
        {data.alternativer.map((alt) => (
          <div key={alt.id} className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={alt.riktig}
              onChange={(e) => oppdaterAlternativ(alt.id, { riktig: e.target.checked })}
              className="rounded"
            />
            <input
              type="text"
              value={alt.tekst.no}
              onChange={(e) => oppdaterAlternativ(alt.id, { tekst: { ...alt.tekst, no: e.target.value } })}
              className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-[#1B3A5C] focus:outline-none"
              placeholder="Alternativ..."
            />
            <button
              type="button"
              onClick={() => fjernAlternativ(alt.id)}
              disabled={data.alternativer.length <= 2}
              className="text-xs text-red-400 hover:text-red-600 disabled:opacity-30"
            >
              ✕
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={leggTilAlternativ}
          className="text-xs text-[#1B3A5C] hover:underline"
        >
          + Legg til alternativ
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Antall forsøk</label>
          <input
            type="number"
            min={1}
            value={data.antall_forsok}
            onChange={(e) => onChange({ ...data, antall_forsok: Number(e.target.value) })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#1B3A5C] focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Forklaring ved feil (valgfri)</label>
          <input
            type="text"
            value={data.forklaring_ved_feil?.no ?? ""}
            onChange={(e) =>
              onChange({ ...data, forklaring_ved_feil: e.target.value ? { no: e.target.value } : null })
            }
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#1B3A5C] focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
}
