'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Menu, X } from 'lucide-react';

export default function Navbar() {
  const t = useTranslations('nav');
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[--color-grey-border] bg-white shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/no" className="flex items-center gap-2 font-bold text-[--color-primary]" aria-label="Aftenskolen – til forsiden">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
            <rect width="32" height="32" rx="8" fill="#1B3A5C" />
            <text x="16" y="22" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold" fontFamily="system-ui">A</text>
          </svg>
          <span className="text-lg">Aftenskolen</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-8 md:flex" aria-label="Hovednavigasjon">
          <div className="group relative">
            <button className="flex items-center gap-1 text-sm font-medium text-[--color-text] hover:text-[--color-secondary]">
              {t('kurs')}
            </button>
            <div className="absolute left-0 top-full hidden min-w-[180px] rounded-lg border border-[--color-grey-border] bg-white p-2 shadow-md group-hover:block">
              {(['norsk', 'fagbrev', 'arbeidsliv', 'livsmestring'] as const).map((kat) => (
                <Link
                  key={kat}
                  href={`/no/kurs?kategori=${kat}`}
                  className="block rounded px-3 py-2 text-sm hover:bg-[--color-bg]"
                >
                  {t(`kategorier.${kat}`)}
                </Link>
              ))}
            </div>
          </div>
          <Link href="/no/om-oss" className="text-sm font-medium text-[--color-text] hover:text-[--color-secondary]">
            {t('om-oss')}
          </Link>
          <Link href="/no/kontakt" className="text-sm font-medium text-[--color-text] hover:text-[--color-secondary]">
            {t('kontakt')}
          </Link>
        </nav>

        {/* Desktop CTA */}
        <div className="hidden md:block">
          <Link
            href="/no/auth/logg-inn"
            className="inline-flex h-8 items-center rounded border border-[--color-grey-border] bg-transparent px-3 text-sm font-medium hover:bg-[--color-bg]"
          >
            {t('logg-inn')}
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          className="rounded-md p-2 text-[--color-text] hover:bg-[--color-bg] md:hidden"
          onClick={() => setOpen(!open)}
          aria-label={open ? 'Lukk meny' : 'Åpne meny'}
          aria-expanded={open}
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-[--color-grey-border] bg-white px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-1" aria-label="Mobilnavigasjon">
            <Link href="/no/om-oss" className="rounded-md px-3 py-2 text-sm font-medium hover:bg-[--color-bg]" onClick={() => setOpen(false)}>
              {t('om-oss')}
            </Link>
            <Link href="/no/kontakt" className="rounded-md px-3 py-2 text-sm font-medium hover:bg-[--color-bg]" onClick={() => setOpen(false)}>
              {t('kontakt')}
            </Link>
            <div className="mt-2 border-t border-[--color-grey-border] pt-2">
              <Link href="/no/auth/logg-inn" className="block rounded-md px-3 py-2 text-sm font-medium text-[--color-secondary]" onClick={() => setOpen(false)}>
                {t('logg-inn')}
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
