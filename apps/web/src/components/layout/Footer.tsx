import Link from 'next/link';
import { useTranslations } from 'next-intl';

export default function Footer() {
  const t = useTranslations('footer');
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-[--color-grey-border] bg-white">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="col-span-full lg:col-span-2">
            <p className="font-bold text-[--color-primary]">Sykurs.no</p>
            <p className="mt-1 text-sm text-gray-500">{t('tagline')}</p>
            <p className="mt-3 text-sm text-gray-400">{t('adresse')}</p>
            <p className="text-sm text-gray-400">{t('orgnr')}</p>
          </div>

          {/* Links */}
          <div>
            <nav className="flex flex-col gap-2" aria-label="Foternavigasjon">
              <Link href="/no/personvern" className="text-sm text-gray-500 hover:text-[--color-secondary]">{t('personvern')}</Link>
              <Link href="/no/vilkaar" className="text-sm text-gray-500 hover:text-[--color-secondary]">{t('vilkaar')}</Link>
            </nav>
          </div>
        </div>

        <div className="mt-8 border-t border-[--color-grey-border] pt-6 text-center text-xs text-gray-400">
          © {year} Sykurs.no
        </div>
      </div>
    </footer>
  );
}
