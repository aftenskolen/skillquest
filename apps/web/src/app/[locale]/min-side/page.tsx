import Link from 'next/link';
import { useTranslations } from 'next-intl';

export default function MinSide() {
  const t = useTranslations('min-side');

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <h1 className="mb-8 text-3xl font-bold text-[--color-primary]">{t('overskrift')}</h1>

      <div className="mb-8 rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
        {t('ikke-logget-inn')}{' '}
        <Link href="/no/auth/logg-inn" className="font-medium underline">
          {t('logg-inn-lenke')}
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/no/min-side/kurs"
          className="rounded-lg border border-[--color-grey-border] bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
        >
          <h2 className="mb-1 font-semibold text-[--color-primary]">{t('mine-kurs')}</h2>
          <p className="text-sm text-gray-500">Se kursene du er påmeldt</p>
        </Link>
        <Link
          href="/no/min-side/profil"
          className="rounded-lg border border-[--color-grey-border] bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
        >
          <h2 className="mb-1 font-semibold text-[--color-primary]">{t('profil')}</h2>
          <p className="text-sm text-gray-500">Rediger din profilinformasjon</p>
        </Link>
      </div>
    </div>
  );
}
