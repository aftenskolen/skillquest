'use client';

import { useState, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Input, Button } from '@skillquest/ui';
import { Search } from 'lucide-react';

export default function KiSok() {
  const t = useTranslations('hero');
  const [melding, setMelding] = useState('');
  const [svar, setSvar] = useState('');
  const [laster, setLaster] = useState(false);
  const [feil, setFeil] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!melding.trim()) return;

    setLaster(true);
    setSvar('');
    setFeil(false);

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    try {
      const res = await fetch('/api/ai/karriereveileder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ melding }),
        signal: abortRef.current.signal,
      });

      if (!res.ok || !res.body) {
        setFeil(true);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        setSvar((prev) => prev + decoder.decode(value, { stream: true }));
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') setFeil(true);
    } finally {
      setLaster(false);
    }
  }

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="flex gap-2" role="search" aria-label="KI-kurssøk">
        <Input
          value={melding}
          onChange={(e) => setMelding(e.target.value)}
          placeholder={t('sok-placeholder')}
          className="flex-1 text-base"
          aria-label={t('sok-placeholder')}
          disabled={laster}
        />
        <Button type="submit" variant="primary" disabled={laster || !melding.trim()} aria-label={t('sok-knapp')}>
          <Search size={18} aria-hidden="true" />
          <span className="ml-2 hidden sm:inline">{t('sok-knapp')}</span>
        </Button>
      </form>

      {(svar || laster || feil) && (
        <div className="mt-4 rounded-lg border border-[--color-grey-border] bg-white p-4 text-left shadow-sm">
          {feil ? (
            <p className="text-sm text-red-500">{t('ki-feil')}</p>
          ) : laster && !svar ? (
            <p className="animate-pulse text-sm text-gray-400">{t('ki-laster')}</p>
          ) : (
            <p className="text-sm text-[--color-text] whitespace-pre-wrap">{svar}</p>
          )}
        </div>
      )}
    </div>
  );
}
