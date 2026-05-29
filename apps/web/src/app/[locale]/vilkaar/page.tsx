import { useTranslations } from 'next-intl';

export default function Vilkaar() {
  const t = useTranslations('vilkaar');

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="mb-8 text-3xl font-bold text-[--color-primary]">{t('overskrift')}</h1>
      <div className="prose prose-sm max-w-none text-gray-600">
        <h2>Påmelding og betaling</h2>
        <p>Påmelding er bindende. Betaling skjer ved registrering med kortbetaling via Vipps eller kortbetaling.</p>
        <h2>Avmelding og refusjon</h2>
        <p>Avmelding mer enn 14 dager før kursstart gir full refusjon. Avmelding innen 14 dager gir ingen refusjon, men du kan overføre plassen til en annen.</p>
        <h2>Avlysning</h2>
        <p>Aftenskolen forbeholder seg retten til å avlyse kurs med for få påmeldte. Ved avlysning refunderes full kursavgift.</p>
        <h2>Spørsmål</h2>
        <p>Kontakt oss på post@aftenskolen.no for spørsmål om vilkårene.</p>
      </div>
    </div>
  );
}
