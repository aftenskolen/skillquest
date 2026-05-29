'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Input, Label, Button } from '@skillquest/ui';

interface Skjema {
  navn: string;
  epost: string;
  emne: string;
  melding: string;
}

export default function Kontakt() {
  const t = useTranslations('kontakt');
  const [skjema, setSkjema] = useState<Skjema>({ navn: '', epost: '', emne: 'generelt', melding: '' });
  const [status, setStatus] = useState<'idle' | 'sender' | 'sendt' | 'feil'>('idle');

  function oppdater(felt: keyof Skjema, verdi: string) {
    setSkjema((prev) => ({ ...prev, [felt]: verdi }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('sender');
    try {
      const res = await fetch('/api/kontakt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(skjema),
      });
      setStatus(res.ok ? 'sendt' : 'feil');
    } catch {
      setStatus('feil');
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
      <div className="mb-12 text-center">
        <h1 className="mb-4 text-4xl font-bold text-[--color-primary]">{t('overskrift')}</h1>
        <p className="text-lg text-gray-500">{t('ingress')}</p>
      </div>

      <div className="grid gap-10 lg:grid-cols-2">
        {/* Skjema */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <Label htmlFor="navn">{t('navn')}</Label>
            <Input id="navn" value={skjema.navn} onChange={(e) => oppdater('navn', e.target.value)} required className="mt-1" />
          </div>
          <div>
            <Label htmlFor="epost">{t('epost')}</Label>
            <Input id="epost" type="email" value={skjema.epost} onChange={(e) => oppdater('epost', e.target.value)} required className="mt-1" />
          </div>
          <div>
            <Label htmlFor="emne">{t('emne')}</Label>
            <select
              id="emne"
              value={skjema.emne}
              onChange={(e) => oppdater('emne', e.target.value)}
              className="mt-1 w-full rounded-lg border border-[--color-grey-border] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[--color-secondary]"
            >
              <option value="generelt">{t('emne-generelt')}</option>
              <option value="kurs">{t('emne-kurs')}</option>
              <option value="faktura">{t('emne-faktura')}</option>
              <option value="annet">{t('emne-annet')}</option>
            </select>
          </div>
          <div>
            <Label htmlFor="melding">{t('melding')}</Label>
            <textarea
              id="melding"
              value={skjema.melding}
              onChange={(e) => oppdater('melding', e.target.value)}
              required
              rows={5}
              className="mt-1 w-full rounded-lg border border-[--color-grey-border] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[--color-secondary]"
            />
          </div>

          {status === 'sendt' ? (
            <p className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">{t('sendt')}</p>
          ) : (
            <Button type="submit" variant="primary" disabled={status === 'sender'} className="w-full">
              {status === 'sender' ? 'Sender...' : t('send')}
            </Button>
          )}
          {status === 'feil' && (
            <p className="text-sm text-red-500">{t('feil')}</p>
          )}
        </form>

        {/* Kontaktinfo */}
        <div className="space-y-6">
          <div>
            <h2 className="mb-2 font-semibold text-[--color-primary]">E-post</h2>
            <a href="mailto:post@aftenskolen.no" className="text-[--color-secondary] hover:underline">
              post@aftenskolen.no
            </a>
          </div>
          <div>
            <h2 className="mb-2 font-semibold text-[--color-primary]">Adresse</h2>
            <p className="text-sm text-gray-600">Sørlandets kunnskapspark</p>
            <p className="text-sm text-gray-600">Universitetsveien 19, 4630 Kristiansand</p>
          </div>
          <div className="rounded-lg border border-[--color-grey-border] bg-[--color-bg] p-4">
            <h2 className="mb-1 font-semibold text-[--color-primary]">Discord</h2>
            <p className="mb-2 text-sm text-gray-500">Bli med i vår Discord-kanal</p>
            <span className="inline-block rounded bg-[--color-secondary] px-3 py-1 text-sm text-white opacity-50">
              Kommer snart
            </span>
          </div>
          <div className="rounded-lg border border-[--color-grey-border] bg-[--color-bg] p-4">
            <h2 className="mb-1 font-semibold text-[--color-primary]">WhatsApp</h2>
            <p className="mb-2 text-sm text-gray-500">Kontakt oss på WhatsApp</p>
            <span className="inline-block rounded bg-green-600 px-3 py-1 text-sm text-white opacity-50">
              Kommer snart
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
