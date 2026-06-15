"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
  { href: "/", label: "Mine klasser", icon: "🏫", exact: true },
  { href: "/oppgaver", label: "Oppgaver", icon: "📋", exact: false },
  { href: "/dialog", label: "Dialog", icon: "💬", exact: false },
];

export function LaererSidebar({ navn }: { navn: string }) {
  const pathname = usePathname();

  return (
    <aside className="w-56 shrink-0 border-r border-gray-200 bg-white min-h-[calc(100vh-57px)]">
      <div className="px-4 py-3 border-b border-gray-100">
        <p className="text-xs text-gray-400">Innlogget som</p>
        <p className="text-sm font-medium text-[#1B3A5C] truncate">{navn}</p>
      </div>
      <nav className="p-3 space-y-1">
        {nav.map((item) => {
          const erAktiv = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                erAktiv ? "bg-[#1B3A5C] text-white" : "text-gray-700 hover:bg-gray-100"
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
