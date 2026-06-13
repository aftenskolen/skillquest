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

interface Props {
  kursTittel: string;
  kursSlug: string;
  moduler: SidebarModul[];
}

export function KursSidebar({ kursTittel, kursSlug, moduler }: Props) {
  const pathname = usePathname();

  return (
    <aside className="w-72 shrink-0 self-start sticky top-0 max-h-screen overflow-y-auto border-r border-gray-200 bg-white">
      <div className="p-5 border-b border-gray-100">
        <Link
          href={`/kurs/${kursSlug}`}
          className="text-sm font-semibold text-[#1B3A5C] hover:underline line-clamp-2"
        >
          {kursTittel}
        </Link>
      </div>

      <nav className="p-4 space-y-6">
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
                      <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-medium ${
                        leksjon.fullfort
                          ? erAktiv ? "bg-white/20 text-white" : "bg-green-100 text-green-600"
                          : erAktiv ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
                      }`}>
                        {leksjon.fullfort ? "✓" : li + 1}
                      </span>
                      <span className="line-clamp-2">{leksjon.tittel}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
