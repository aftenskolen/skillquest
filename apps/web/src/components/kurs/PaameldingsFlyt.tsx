'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@skillquest/ui';
import type { Klasse } from '@/lib/types';
import { formatNok } from '@skillquest/utils';

interface PaameldingsFlytProps {
  prisOere: number;
  gratis: boolean;
  finansiering?: string | undefined;
  klasser: Klasse[];
}

function prisLabel(prisOere: number, gratis: boolean, finansiering?: string): string {
  if (gratis || prisOere === 0) {
    if (finansiering === 'imdi') return 'Finansiert av IMDI';
    if (finansiering === 'hkdir') return 'Finansiert av HK Dir';
    return 'Gratis';
  }
  return formatNok(prisOere);
}

export default function PaameldingsFlyt({ prisOere, gratis, finansiering, klasser }: PaameldingsFlytProps) {
  const [valgtKlasse, setValgtKlasse] = useState(klasser[0]?.id ?? '');
  const valgt = klasser.find((k) => k.id === valgtKlasse);
  const erFull = valgt ? (valgt.ledigePlasser ?? 1) === 0 : false;

  return (
    <div className="rounded-lg border border-[--color-grey-border] bg-white p-6 shadow-sm">
      {/* Pris */}
      <p className={`mb-4 text-3xl font-bold ${gratis || prisOere === 0 ? 'text-[--color-accent]' : 'text-[--color-primary]'}`}>
        {prisLabel(prisOere, gratis, finansiering)}
      </p>

      {/* Velg klasse */}
      {klasser.length > 0 ? (
        <div className="mb-4">
          <label htmlFor="klasse-select" className="mb-1 block text-sm font-medium text-[--color-text]">
            Velg klasse
          </label>
          <select
            id="klasse-select"
            value={valgtKlasse}
            onChange={(e) => setValgtKlasse(e.target.value)}
            className="w-full rounded-lg border border-[--color-grey-border] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[--color-secondary]"
          >
            {klasser.map((k) => (
              <option key={k.id} value={k.id}>
                {new Date(k.startDato).toLocaleDateString('nb-NO', { day: 'numeric', month: 'long', year: 'numeric' })}
                {k.sted ? ` – ${k.sted}` : ''}
                {k.ledigePlasser !== undefined ? ` (${k.ledigePlasser} plasser)` : ''}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <p className="mb-4 text-sm text-gray-500">Ingen klasser tilgjengelig</p>
      )}

      {/* CTA */}
      {erFull ? (
        <div>
          <Button variant="outline" className="w-full" disabled>
            Klassen er full
          </Button>
          <p className="mt-2 text-center text-xs text-gray-400">
            <Link href="/no/auth/logg-inn" className="text-[--color-secondary] hover:underline">
              Logg inn
            </Link>{' '}
            for å stå på venteliste
          </p>
        </div>
      ) : (
        <Link
          href="/no/auth/logg-inn"
          className="flex h-10 w-full items-center justify-center rounded bg-[--color-primary] px-4 text-sm font-medium text-white hover:bg-[--color-secondary]"
        >
          Meld deg på
        </Link>
      )}

      <p className="mt-3 text-center text-xs text-gray-400">
        Du må logge inn for å melde deg på
      </p>
    </div>
  );
}
