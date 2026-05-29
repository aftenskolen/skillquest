import { useTranslations } from 'next-intl';
import { hentSamarbeidspartnere } from '@/lib/sanity';

export default async function Samarbeidspartnere() {
  const t = useTranslations('samarbeidspartnere');
  const partnere = await hentSamarbeidspartnere();

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
      <div className="mb-12 text-center">
        <h1 className="mb-4 text-4xl font-bold text-[--color-primary]">{t('overskrift')}</h1>
        <p className="text-lg text-gray-500">{t('ingress')}</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {partnere.map((p) => (
          <div key={p.id} className="rounded-lg border border-[--color-grey-border] bg-white p-6 shadow-sm">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-[--color-bg] font-bold text-[--color-primary]">
              {p.navn.slice(0, 2).toUpperCase()}
            </div>
            <h2 className="mb-1 font-semibold text-[--color-text]">{p.navn}</h2>
            <p className="text-sm text-gray-500">{p.beskrivelse}</p>
            {p.lenke && (
              <a
                href={p.lenke}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-block text-sm text-[--color-secondary] hover:underline"
              >
                Les mer →
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
