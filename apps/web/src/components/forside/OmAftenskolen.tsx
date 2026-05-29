import { useTranslations } from 'next-intl';

export default function OmAftenskolen() {
  const t = useTranslations('om-aftenskolen');

  const nokkelTall = [
    { verdi: t('siden-1952'), ikon: '📅' },
    { verdi: t('deltakere'), ikon: '👥' },
    { verdi: t('godkjent'), ikon: '✓' },
  ];

  return (
    <section className="border-t border-[--color-grey-border] bg-white py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="mb-10 text-center text-lg text-gray-500">{t('ingress')}</p>
        <div className="grid gap-6 sm:grid-cols-3">
          {nokkelTall.map((item) => (
            <div key={item.verdi} className="rounded-lg border border-[--color-grey-border] bg-[--color-bg] p-6 text-center">
              <p className="text-3xl mb-2">{item.ikon}</p>
              <p className="font-bold text-[--color-primary]">{item.verdi}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
