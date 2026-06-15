"use client";

import { useState } from "react";

interface KursItem { id: string; tittel: string }
interface ModulItem { id: string; tittel: string }
interface KoblingItem { kurs_id: string; modul_id: string }

interface Props {
  kurs: KursItem[];
  moduler: ModulItem[];
  koblinger: KoblingItem[];
  modulFieldName?: string;
  label?: string;
  required?: boolean;
  defaultKursId?: string;
  defaultModulId?: string;
}

export function KursModulVelger({
  kurs,
  moduler,
  koblinger,
  modulFieldName = "modul_id",
  label = "Koble til kurs og modul",
  required = false,
  defaultKursId = "",
  defaultModulId = "",
}: Props) {
  const [kursId, setKursId] = useState(defaultKursId);

  const modulerForKurs = koblinger
    .filter((k) => k.kurs_id === kursId)
    .map((k) => moduler.find((m) => m.id === k.modul_id))
    .filter((m): m is ModulItem => Boolean(m));

  return (
    <div className="space-y-3">
      {label && <p className="text-sm font-medium text-gray-700">{label}</p>}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Kurs</label>
          <select
            value={kursId}
            onChange={(e) => setKursId(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#1B3A5C] focus:outline-none"
          >
            <option value="">– Velg kurs –</option>
            {kurs.map((k) => (
              <option key={k.id} value={k.id}>{k.tittel}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Modul {required && kursId ? "*" : ""}
          </label>
          <select
            name={modulFieldName}
            required={required && Boolean(kursId)}
            disabled={!kursId}
            defaultValue={defaultModulId}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#1B3A5C] focus:outline-none disabled:bg-gray-50 disabled:text-gray-400"
          >
            <option value="">
              {kursId ? (modulerForKurs.length === 0 ? "Ingen moduler i kurset" : "– Velg modul –") : "– Velg kurs først –"}
            </option>
            {modulerForKurs.map((m) => (
              <option key={m.id} value={m.id}>{m.tittel}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
