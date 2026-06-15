"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type SidebarLeksjon = {
  id: string;
  tittel: string;
  href: string;
  fullfort: boolean;
};

export type SidebarModul = {
  id: string;
  tittel: string;
  leksjoner: SidebarLeksjon[];
};

export type SidebarSamling = {
  id: string;
  dato_tid: string;
  type: string;
  status: string;
  antall_oppgaver: number;
  href: string;
};

interface Props {
  kursTittel: string;
  kursSlug: string;
  moduler: SidebarModul[];
  samlinger: SidebarSamling[];
}

const typeEtikett: Record<string, string> = {
  fysisk: "Fysisk",
  virtuell: "Virtuell",
  discord: "Discord",
  asynkron: "Asynkron",
};

const statusFarge: Record<string, string> = {
  planlagt: "text-blue-600",
  gjennomfort: "text-green-600",
  avlyst: "text-red-500",
};

export function KursSidebar({ kursTittel, kursSlug, moduler, samlinger }: Props) {
  const pathname = usePathname();
  const aktivTab: "nettkurs" | "samlinger" = pathname.includes("/samlinger")
    ? "samlinger"
    : "nettkurs";

  return (
    <aside className="w-72 shrink-0 self-start sticky top-0 max-h-screen overflow-y-auto border-r border-gray-200 bg-white flex flex-col">
      <div className="p-5 border-b border-gray-100">
        <Link
          href={`/kurs/${kursSlug}`}
          className="text-sm font-semibold text-[#1B3A5C] hover:underline line-clamp-2"
        >
          {kursTittel}
        </Link>
      </div>

      <div className="flex border-b border-gray-100">
        <Link
          href={`/kurs/${kursSlug}`}
          className={`flex-1 py-2.5 text-xs font-semibold text-center transition-colors ${
            aktivTab === "nettkurs"
              ? "text-[#1B3A5C] border-b-2 border-[#1B3A5C]"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Nettkurs
        </Link>
        <Link
          href={
            samlinger.length > 0
              ? (samlinger[0]?.href ?? `/kurs/${kursSlug}`)
              : `/kurs/${kursSlug}`
          }
          className={`flex-1 py-2.5 text-xs font-semibold text-center transition-colors relative ${
            aktivTab === "samlinger"
              ? "text-[#1B3A5C] border-b-2 border-[#1B3A5C]"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Samlinger
          {samlinger.length > 0 && (
            <span className="ml-1 text-[10px] text-gray-400">({samlinger.length})</span>
          )}
        </Link>
      </div>

      {aktivTab === "nettkurs" && (
        <nav className="p-4 space-y-6 flex-1">
          {moduler.map((modul, mi) => (
            <div key={modul.id}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                Modul {mi + 1} · {modul.tittel}
              </p>
              <ul className="space-y-1">
                {modul.leksjoner.map((leksjon, li) => {
                  const erAktiv = pathname === leksjon.href;
                  return (
                    <li key={leksjon.id}>
                      <Link
                        href={leksjon.href}
                        className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                          erAktiv
                            ? "bg-[#1B3A5C] text-white"
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        {leksjon.fullfort ? (
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center text-base leading-none">
                            ⭐
                          </span>
                        ) : (
                          <span
                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-medium ${
                              erAktiv ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
                            }`}
                          >
                            {li + 1}
                          </span>
                        )}
                        <span className="line-clamp-2">{leksjon.tittel}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      )}

      {aktivTab === "samlinger" && (
        <nav className="p-3 space-y-1 flex-1">
          {samlinger.length === 0 ? (
            <p className="text-xs text-gray-400 px-3 py-4">Ingen samlinger planlagt.</p>
          ) : (
            samlinger.map((s) => {
              const erAktiv = pathname === s.href;
              const dato = new Date(s.dato_tid);
              return (
                <Link
                  key={s.id}
                  href={s.href}
                  className={`flex flex-col gap-0.5 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                    erAktiv
                      ? "bg-[#1B3A5C] text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <span className="font-medium">
                    {dato.toLocaleDateString("nb-NO", {
                      weekday: "short",
                      day: "2-digit",
                      month: "2-digit",
                    })}
                    {" "}
                    <span className={erAktiv ? "text-blue-200" : statusFarge[s.status]}>
                      · {typeEtikett[s.type] ?? s.type}
                    </span>
                  </span>
                  {s.antall_oppgaver > 0 && (
                    <span className={`text-xs ${erAktiv ? "text-blue-200" : "text-gray-400"}`}>
                      {s.antall_oppgaver} oppgave{s.antall_oppgaver !== 1 ? "r" : ""}
                    </span>
                  )}
                </Link>
              );
            })
          )}
        </nav>
      )}
    </aside>
  );
}
