import { hentKurser } from '@/lib/data';
import KursKort from '@/components/kurs/KursKort';
import type { Kurstype } from '@/lib/types';

const kategoriLabeler: Record<Kurstype, string> = {
  norsk: 'Norskopplæring',
  fagbrev: 'Fagbrev',
  arbeidsliv: 'Arbeidsliv',
  livsmestring: 'Livsmestring',
  annet: 'Annet',
};

const gyldigeKategorier: Kurstype[] = ['norsk', 'fagbrev', 'arbeidsliv', 'livsmestring', 'annet'];

export default async function KursListeSide({
  searchParams,
}: {
  searchParams: { kategori?: string };
}) {
  const alleKurs = await hentKurser();
  const valgtKategori = gyldigeKategorier.find((k) => k === searchParams.kategori);

  const filtrerte = valgtKategori
    ? alleKurs.filter((k) => k.kurstype === valgtKategori)
    : alleKurs;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Overskrift */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[--color-primary]">
          {valgtKategori ? kategoriLabeler[valgtKategori] : 'Alle kurs'}
        </h1>
        {valgtKategori === 'norsk' && (
          <p className="mt-2 text-gray-500">
            Norskopplæring for alle nivåer – fra nybegynner til viderekommende.
          </p>
        )}
      </div>

      {/* Kategori-filter */}
      <div className="mb-8 flex flex-wrap gap-2">
        <a
          href="/no/kurs"
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            !valgtKategori
              ? 'bg-[--color-primary] text-white'
              : 'bg-[--color-bg] text-[--color-text] hover:bg-[--color-grey-border]'
          }`}
        >
          Alle
        </a>
        {gyldigeKategorier.slice(0, -1).map((kat) => (
          <a
            key={kat}
            href={`/no/kurs?kategori=${kat}`}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              valgtKategori === kat
                ? 'bg-[--color-primary] text-white'
                : 'bg-[--color-bg] text-[--color-text] hover:bg-[--color-grey-border]'
            }`}
          >
            {kategoriLabeler[kat]}
          </a>
        ))}
      </div>

      {/* Kurskort */}
      {filtrerte.length === 0 ? (
        <p className="text-gray-500">Ingen kurs funnet.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtrerte.map((k) => (
            <KursKort
              key={k.id}
              tittel={k.tittel}
              slug={k.slug}
              ingress={k.ingress}
              coverbilde={k.coverbilde}
              coverbildeUrl={k.coverbildeUrl}
              kurstype={k.kurstype}
              cefrNivaa={k.cefrNivaa}
              prisOere={k.prisOere}
              gratis={k.gratis}
              finansiering={k.finansiering}
              nesteOppstart={k.klasser[0]?.startDato}
            />
          ))}
        </div>
      )}
    </div>
  );
}
