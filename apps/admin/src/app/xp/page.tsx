import { createServerClient } from "@novolms/db/server";
import type { XpKonfigurasjon, LevelTerskel } from "@novolms/db/types";
import { SubmitButton } from "@/components/SubmitButton";
import { oppdaterXpKonfigurasjonAction, oppdaterLevelTerskelAction } from "./actions";

const handlingEtikett: Record<string, string> = {
  tekst_lest: "Tekst lest",
  video_sett: "Video sett",
  multiple_choice_riktig: "Multiple choice riktig",
  h5p_fullfort: "H5P fullført",
  leksjon_fullfort_bonus: "Leksjon fullført (bonus)",
  modul_fullfort_bonus: "Modul fullført (bonus)",
  kurs_fullfort_bonus: "Kurs fullført (bonus)",
  daglig_innlogging: "Daglig innlogging",
};

export default async function XpAdminPage() {
  const db = createServerClient();

  const [{ data: rawKonfig }, { data: rawLeveler }] = await Promise.all([
    db.from("xp_konfigurasjon").select("*").order("handling"),
    db.from("level_terskel").select("*").order("level"),
  ]);

  const konfig = (rawKonfig ?? []) as XpKonfigurasjon[];
  const leveler = (rawLeveler ?? []) as LevelTerskel[];

  return (
    <div className="max-w-2xl space-y-8">
      <h1 className="text-2xl font-bold text-[#1B3A5C]">XP & Nivå</h1>

      {/* XP-konfigurasjoner */}
      <div className="rounded-xl bg-white border border-gray-200 divide-y divide-gray-100">
        <div className="px-6 py-4">
          <h2 className="text-base font-semibold text-[#1B3A5C]">XP per handling</h2>
          <p className="text-xs text-gray-500 mt-0.5">Hvor mye XP brukere tjener for ulike handlinger</p>
        </div>
        {konfig.map((k) => (
          <form key={k.handling} action={oppdaterXpKonfigurasjonAction} className="px-6 py-3 flex items-center gap-4">
            <input type="hidden" name="handling" value={k.handling} />
            <span className="flex-1 text-sm text-gray-700">
              {handlingEtikett[k.handling] ?? k.handling}
            </span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                name="xp_verdi"
                min={0}
                defaultValue={k.xp_verdi}
                className="w-20 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-right focus:border-[#1B3A5C] focus:outline-none"
              />
              <span className="text-xs text-gray-400 w-5">XP</span>
            </div>
            <SubmitButton label="Lagre" loadingLabel="…" />
          </form>
        ))}
        {!konfig.find((k) => k.handling === "daglig_innlogging") && (
          <form action={oppdaterXpKonfigurasjonAction} className="px-6 py-3 flex items-center gap-4 bg-yellow-50">
            <input type="hidden" name="handling" value="daglig_innlogging" />
            <span className="flex-1 text-sm text-gray-700">Daglig innlogging</span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                name="xp_verdi"
                min={0}
                defaultValue={5}
                className="w-20 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-right focus:border-[#1B3A5C] focus:outline-none"
              />
              <span className="text-xs text-gray-400 w-5">XP</span>
            </div>
            <SubmitButton label="Opprett" loadingLabel="…" />
          </form>
        )}
      </div>

      {/* Level-terskler */}
      <div className="rounded-xl bg-white border border-gray-200 divide-y divide-gray-100">
        <div className="px-6 py-4">
          <h2 className="text-base font-semibold text-[#1B3A5C]">Nivåterskler</h2>
          <p className="text-xs text-gray-500 mt-0.5">Minimum total XP for å nå hvert nivå</p>
        </div>
        <div className="px-6 py-4">
          <div className="grid grid-cols-4 gap-3">
            {leveler.map((l) => (
              <form key={l.level} action={oppdaterLevelTerskelAction} className="flex flex-col gap-1">
                <input type="hidden" name="level" value={l.level} />
                <label className="text-xs font-medium text-gray-500">Nivå {l.level}</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    name="xp_paakrevd"
                    min={0}
                    defaultValue={l.xp_paakrevd}
                    className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:border-[#1B3A5C] focus:outline-none"
                  />
                </div>
                <SubmitButton label="✓" loadingLabel="…" />
              </form>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
