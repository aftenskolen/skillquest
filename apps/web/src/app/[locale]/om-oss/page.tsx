import Link from 'next/link';
import { useTranslations } from 'next-intl';

export default function OmOss() {
  const t = useTranslations('om-oss');

  const verdier = [
    { tittel: t('verdi-1-tittel'), tekst: t('verdi-1') },
    { tittel: t('verdi-2-tittel'), tekst: t('verdi-2') },
    { tittel: t('verdi-3-tittel'), tekst: t('verdi-3') },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      {/* Hero */}
      <div className="mb-16 text-center">
        <h1 className="mb-4 text-4xl font-bold text-[--color-primary]">{t('overskrift')}</h1>
        <p className="text-lg text-gray-500">{t('ingress')}</p>
      </div>

      {/* Historikk */}
      <section className="mb-16">
        <h2 className="mb-4 text-2xl font-semibold text-[--color-primary]">{t('historikk-tittel')}</h2>
        <p className="text-gray-600 leading-relaxed">{t('historikk')}</p>
      </section>

      {/* Verdier */}
      <section className="mb-16">
        <h2 className="mb-6 text-2xl font-semibold text-[--color-primary]">{t('verdier-tittel')}</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {verdier.map((v) => (
            <div key={v.tittel} className="rounded-lg border border-[--color-grey-border] bg-white p-5">
              <h3 className="mb-2 font-semibold text-[--color-primary]">{v.tittel}</h3>
              <p className="text-sm text-gray-500">{v.tekst}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Ansatte */}
      <section className="mb-16">
        <h2 className="mb-6 text-2xl font-semibold text-[--color-primary]">{t('ansatte-tittel')}</h2>
        <div className="flex items-center gap-4 rounded-lg border border-[--color-grey-border] bg-white p-5">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[--color-primary] text-white font-bold text-lg">
            BG
          </div>
          <div>
            <p className="font-semibold text-[--color-text]">Benjamin Grønvold</p>
            <p className="text-sm text-gray-500">{t('daglig-leder')}</p>
          </div>
        </div>
      </section>

      {/* Adresse */}
      <section className="mb-10 rounded-lg bg-[--color-bg] p-6">
        <h2 className="mb-2 font-semibold text-[--color-primary]">Besøksadresse</h2>
        <p className="text-sm text-gray-600">Sørlandets kunnskapspark</p>
        <p className="text-sm text-gray-600">Universitetsveien 19</p>
        <p className="text-sm text-gray-600">4630 Kristiansand</p>
      </section>

      <Link
        href="/no/om-oss/samarbeidspartnere"
        className="text-[--color-secondary] hover:underline"
      >
        {t('samarbeidspartnere-lenke')} →
      </Link>
    </div>
  );
}
