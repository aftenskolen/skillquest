import { useTranslations } from 'next-intl';

export default function Personvern() {
  const t = useTranslations('personvern');

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="mb-8 text-3xl font-bold text-[--color-primary]">{t('overskrift')}</h1>
      <div className="prose prose-sm max-w-none text-gray-600">
        <p>Denne personvernerklæringen beskriver hvordan Aftenskolen (org.nr. 927 408 236) behandler personopplysninger.</p>
        <h2>Hvilke opplysninger samler vi inn?</h2>
        <p>Vi samler inn navn, e-postadresse og telefonnummer når du registrerer deg eller tar kontakt med oss.</p>
        <h2>Hvordan bruker vi opplysningene?</h2>
        <p>Opplysningene brukes til å administrere kursregistreringer, sende informasjon om kurs og besvare henvendelser.</p>
        <h2>Dine rettigheter</h2>
        <p>Du har rett til innsyn, retting og sletting av dine personopplysninger. Ta kontakt på post@aftenskolen.no.</p>
        <h2>Kontakt</h2>
        <p>Spørsmål om personvern rettes til post@aftenskolen.no.</p>
      </div>
    </div>
  );
}
