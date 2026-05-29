import Link from 'next/link';
import { useTranslations } from 'next-intl';

export default function MinProfil() {
  const t = useTranslations('min-side');

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <h1 className="mb-8 text-3xl font-bold text-[--color-primary]">{t('profil')}</h1>
      <div className="rounded-lg border border-[--color-grey-border] bg-white p-8 text-center text-gray-500">
        <p className="mb-4">{t('ikke-logget-inn')}</p>
        <Link href="/no/auth/logg-inn" className="text-[--color-secondary] hover:underline">
          {t('logg-inn-lenke')}
        </Link>
      </div>
    </div>
  );
}
