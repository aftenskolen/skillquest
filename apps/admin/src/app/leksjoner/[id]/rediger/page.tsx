import { notFound } from "next/navigation";
import { createServerClient } from "@novolms/db/server";
import type { InnholdLeksjon, InnholdsBlokk } from "@novolms/db/types";
import { SubmitButton } from "@/components/SubmitButton";
import { BlokkerEditor } from "@/components/BlokkerEditor";
import { KursModulVelger } from "@/components/KursModulVelger";
import {
  lagreLeksjonMetadataAction,
  leggTilModulKoblingAction,
  fjernModulKoblingAction,
} from "./actions";

interface Props {
  params: { id: string };
  searchParams: { error?: string; lagret?: string };
}

export default async function RedigerLeksjonPage({ params, searchParams }: Props) {
  const db = createServerClient();

  const [
    { data },
    { data: rawKoblinger },
    { data: rawAlleKurs },
    { data: rawAlleKursModulKoblinger },
    { data: rawAlleModuler },
  ] = await Promise.all([
    db.from("innhold_leksjon").select("*").eq("id", params.id).single(),
    db.from("modul_leksjon_kobling").select("id, modul_id, rekkefolge").eq("leksjon_id", params.id),
    db.from("kurs").select("id, tittel").eq("aktiv", true).order("tittel->no"),
    db.from("kurs_modul_kobling").select("kurs_id, modul_id"),
    db.from("innhold_modul").select("id, tittel").order("tittel->no"),
  ]);

  if (!data) notFound();
  const leksjon = data as InnholdLeksjon;
  const tittel = (leksjon.tittel as { no: string }).no;
  const beskrivelse = (leksjon.beskrivelse as { no: string } | null)?.no ?? "";
  const blokker = (leksjon.innhold_blokker ?? []) as InnholdsBlokk[];

  // Beregn nåværende tilknytninger (leksjon → modul → kurs)
  const koblinger = (rawKoblinger ?? []) as { id: string; modul_id: string; rekkefolge: number }[];
  const alleKursModulKoblinger = (rawAlleKursModulKoblinger ?? []) as { kurs_id: string; modul_id: string }[];
  const alleModuler = (rawAlleModuler ?? []).map((m) => ({
    id: m.id as string,
    tittel: (m.tittel as { no: string }).no,
  }));
  const alleKurs = (rawAlleKurs ?? []).map((k) => ({
    id: k.id as string,
    tittel: (k.tittel as { no: string }).no,
  }));

  const modulTittelMap = new Map(alleModuler.map((m) => [m.id, m.tittel]));
  const kursTittelMap = new Map(alleKurs.map((k) => [k.id, k.tittel]));

  // modul_id → kurs_id
  const kursForModul = new Map<string, string>();
  for (const kmk of alleKursModulKoblinger) {
    kursForModul.set(kmk.modul_id, kmk.kurs_id);
  }

  const tilknytninger = koblinger.map((k) => {
    const kursId = kursForModul.get(k.modul_id);
    return {
      koblingId: k.id,
      modulId: k.modul_id,
      modulTittel: modulTittelMap.get(k.modul_id) ?? "Ukjent modul",
      kursTittel: kursId ? (kursTittelMap.get(kursId) ?? "Ukjent kurs") : "Ikke koblet til kurs",
    };
  });

  // Moduler som leksjonen IKKE allerede er koblet til (for "legg til"-velgeren)
  const alleredeTilknyttedeModulIds = new Set(koblinger.map((k) => k.modul_id));
  const tilgjengeligeKoblinger = alleKursModulKoblinger.filter(
    (k) => !alleredeTilknyttedeModulIds.has(k.modul_id)
  );

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <a href="/leksjoner" className="text-sm text-gray-500 hover:text-[#1B3A5C]">← Tilbake til leksjoner</a>
      </div>
      <h1 className="text-2xl font-bold text-[#1B3A5C]">{tittel}</h1>

      {searchParams.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{searchParams.error}</div>
      )}
      {searchParams.lagret && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">✓ Endringer lagret</div>
      )}

      {/* Metadata */}
      <form action={lagreLeksjonMetadataAction} className="rounded-xl bg-white border border-gray-200 p-6 space-y-4">
        <h2 className="text-base font-semibold text-[#1B3A5C]">Leksjonsinformasjon</h2>
        <input type="hidden" name="id" value={leksjon.id} />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tittel *</label>
          <input name="tittel_no" required defaultValue={tittel} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#1B3A5C] focus:outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Beskrivelse</label>
          <textarea name="beskrivelse_no" rows={2} defaultValue={beskrivelse} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#1B3A5C] focus:outline-none resize-none" />
        </div>
        <div className="grid grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select name="status" defaultValue={leksjon.status} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#1B3A5C] focus:outline-none">
              <option value="utkast">Utkast</option>
              <option value="til_review">Til review</option>
              <option value="publisert">Publisert</option>
              <option value="arkivert">Arkivert</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select name="leksjon_type" defaultValue={leksjon.leksjon_type} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#1B3A5C] focus:outline-none">
              <option value="standard">Standard</option>
              <option value="forsterkning">Forsterkning</option>
              <option value="fordypning">Fordypning</option>
              <option value="adaptiv_alternativ">Adaptivt alternativ</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estimert tid (min)</label>
            <input type="number" name="estimert_tid_min" min={1} defaultValue={leksjon.estimert_tid_min ?? ""} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#1B3A5C] focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">XP-verdi</label>
            <input type="number" name="xp_verdi" min={0} required defaultValue={leksjon.xp_verdi ?? 10} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#1B3A5C] focus:outline-none" />
          </div>
        </div>
        <div className="flex justify-end">
          <SubmitButton label="Lagre metadata" />
        </div>
      </form>

      {/* Tilknytninger */}
      <div className="rounded-xl bg-white border border-gray-200 divide-y divide-gray-100">
        <div className="px-6 py-4">
          <h2 className="text-base font-semibold text-[#1B3A5C]">Tilknytninger</h2>
          <p className="text-xs text-gray-500 mt-0.5">Hvilket kurs og modul leksjonen er en del av</p>
        </div>

        {tilknytninger.length === 0 ? (
          <div className="px-6 py-4">
            <p className="text-sm text-gray-400">Ikke koblet til noen moduler ennå.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {tilknytninger.map((t) => (
              <div key={t.koblingId} className="flex items-center justify-between px-6 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-800">{t.modulTittel}</p>
                  <p className="text-xs text-gray-400">{t.kursTittel}</p>
                </div>
                <form action={fjernModulKoblingAction}>
                  <input type="hidden" name="kobling_id" value={t.koblingId} />
                  <input type="hidden" name="leksjon_id" value={leksjon.id} />
                  <button type="submit" className="text-xs text-red-500 hover:text-red-700">Fjern</button>
                </form>
              </div>
            ))}
          </div>
        )}

        {tilgjengeligeKoblinger.length > 0 && (
          <form action={leggTilModulKoblingAction} className="px-6 py-4 space-y-3">
            <input type="hidden" name="leksjon_id" value={leksjon.id} />
            <KursModulVelger
              kurs={alleKurs}
              moduler={alleModuler}
              koblinger={tilgjengeligeKoblinger}
              modulFieldName="modul_id"
              label="Legg til i modul"
            />
            <div className="flex justify-end">
              <SubmitButton label="Koble til modul" loadingLabel="Kobler…" />
            </div>
          </form>
        )}
      </div>

      {/* Blokk-redigerer */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold text-[#1B3A5C]">Innhold ({blokker.length} blokk{blokker.length !== 1 ? "er" : ""})</h2>
        <BlokkerEditor leksjonId={leksjon.id} initialBlokker={blokker} />
      </div>
    </div>
  );
}
