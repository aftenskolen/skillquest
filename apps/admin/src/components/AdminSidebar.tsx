"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
  { href: "/", label: "Dashboard", icon: "⊞" },
  { href: "/kurs", label: "Kurs", icon: "📚" },
  { href: "/moduler", label: "Moduler", icon: "🧩" },
  { href: "/leksjoner", label: "Leksjoner", icon: "📄" },
  { href: "/klasser", label: "Klasser", icon: "🏫" },
  { href: "/brukere", label: "Brukere", icon: "👥" },
  { href: "/xp", label: "XP & Nivå", icon: "⚡" },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 shrink-0 border-r border-gray-200 bg-white min-h-[calc(100vh-57px)]">
      <nav className="p-3 space-y-1">
        {nav.map((item) => {
          const erAktiv =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                erAktiv
                  ? "bg-[#1B3A5C] text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
