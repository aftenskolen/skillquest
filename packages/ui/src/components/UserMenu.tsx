"use client";

import { useState, useRef, useEffect } from "react";
import { loggUt } from "@skillquest/auth";
import type { Bruker } from "@skillquest/db/types";

interface UserMenuProps {
  /**
   * Brukerdata hentet server-side via hentInnloggetBruker() fra @skillquest/auth.
   * Sendes som prop fra parent server component.
   */
  bruker: Pick<Bruker, "navn" | "epost" | "profilbilde_url">
  roller: string[]
  minSideUrl?: string
  onLoggetUt?: () => void
}

export function UserMenu({
  bruker,
  roller,
  minSideUrl = "/min-side",
  onLoggetUt,
}: UserMenuProps) {
  const [aapen, setAapen] = useState(false);
  const [laster, setLaster] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setAapen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleLoggUt() {
    setLaster(true);
    try {
      await loggUt();
      onLoggetUt?.();
      window.location.href = "/auth/logg-inn";
    } catch {
      setLaster(false);
    }
  }

  const initialer = bruker.navn
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setAapen((v) => !v)}
        className="flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-expanded={aapen}
        aria-haspopup="true"
      >
        {bruker.profilbilde_url ? (
          <img
            src={bruker.profilbilde_url}
            alt={bruker.navn}
            className="h-9 w-9 rounded-full object-cover"
          />
        ) : (
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-sm font-medium text-white">
            {initialer}
          </span>
        )}
        <span className="hidden text-sm font-medium text-gray-700 sm:block">
          {bruker.navn}
        </span>
      </button>

      {aapen && (
        <div className="absolute right-0 mt-2 w-48 rounded-md border border-gray-200 bg-white shadow-lg z-50">
          <div className="border-b border-gray-100 px-4 py-3">
            <p className="truncate text-sm font-medium text-gray-900">{bruker.navn}</p>
            <p className="truncate text-xs text-gray-500">{bruker.epost}</p>
            {roller.length > 0 && (
              <p className="mt-1 text-xs text-blue-600 capitalize">{roller[0]}</p>
            )}
          </div>
          <div className="py-1">
            <a
              href={minSideUrl}
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              onClick={() => setAapen(false)}
            >
              Min side
            </a>
            <button
              onClick={handleLoggUt}
              disabled={laster}
              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              {laster ? "Logger ut..." : "Logg ut"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
