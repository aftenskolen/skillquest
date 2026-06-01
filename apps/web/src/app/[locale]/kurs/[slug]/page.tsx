import { notFound } from 'next/navigation';
import Image from 'next/image';
import { Badge } from '@skillquest/ui';
import { hentKurs } from '@/lib/sanity';
import PaameldingsFlyt from '@/components/kurs/PaameldingsFlyt';

const kursTypeLabeler: Record<string, string> = {
  norsk: 'Norsk',
  fagbrev: 'Fagbrev',
  arbeidsliv: 'Arbeidsliv',
  livsmestring: 'Livsmestring',
  annet: 'Annet',
};

export default async function KursDetaljSide({
  params,
}: {
  params: { slug: string; locale: string };
}) {
  const kurs = await hentKurs(params.slug);
  if (!kurs) notFound();

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="lg:grid lg:grid-cols-3 lg:gap-10">
        {/* Venstre: innhold */}
        <div className="lg:col-span-2">
          {/* Coverbilde */}
          <div className="relative mb-6 aspect-video w-full overflow-hidden rounded-lg bg-[--color-bg]">
            {(kurs.coverbildeUrl ?? kurs.coverbilde) ? (
              <Image
                src={kurs.coverbildeUrl ?? '/api/placeholder'}
                alt={kurs.coverbilde?.alt ?? kurs.tittel}
                fill
                className="object-cover"
                priority
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-gradient-to-br from-[--color-primary] to-[--color-secondary]">
                <span className="text-6xl font-bold text-white opacity-20">A</span>
              </div>
            )}
          </div>

          {/* Badges */}
          <div className="mb-3 flex flex-wrap gap-2">
            <Badge color="teal">{kursTypeLabeler[kurs.kurstype] ?? kurs.kurstype}</Badge>
            {kurs.cefrNivaa !== 'ingen' && <Badge color="grey">{kurs.cefrNivaa}</Badge>}
            {kurs.klasser[0] && (
              <Badge color="grey">
                {kurs.klasser[0].type === 'nettbasert' ? 'Nettbasert' : kurs.klasser[0].type === 'hybrid' ? 'Hybrid' : 'Fysisk'}
              </Badge>
            )}
          </div>

          <h1 className="mb-3 text-3xl font-bold text-[--color-primary]">{kurs.tittel}</h1>
          <p className="mb-6 text-lg text-gray-500">{kurs.ingress}</p>

          {kurs.beskrivelseLang && (
            <div className="mb-8 prose prose-sm max-w-none text-[--color-text]">
              <p>{kurs.beskrivelseLang}</p>
            </div>
          )}

          {/* Hva lærer du */}
          {kurs.hvaLaererDu && kurs.hvaLaererDu.length > 0 && (
            <section className="mb-8">
              <h2 className="mb-3 text-xl font-semibold text-[--color-primary]">Hva lærer du?</h2>
              <ul className="space-y-2">
                {kurs.hvaLaererDu.map((punkt) => (
                  <li key={punkt} className="flex items-start gap-2 text-sm text-[--color-text]">
                    <span className="mt-0.5 text-[--color-accent]" aria-hidden="true">✓</span>
                    {punkt}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Hvem passer */}
          {kurs.hvemPasser && (
            <section className="mb-8 rounded-lg bg-[--color-bg] p-4">
              <h2 className="mb-2 font-semibold text-[--color-primary]">Hvem passer kurset for?</h2>
              <p className="text-sm text-gray-600">{kurs.hvemPasser}</p>
            </section>
          )}

          {/* Læreplan */}
          {kurs.laereplan && kurs.laereplan.length > 0 && (
            <section className="mb-8">
              <h2 className="mb-4 text-xl font-semibold text-[--color-primary]">Læreplan</h2>
              <div className="space-y-3">
                {kurs.laereplan.map((modul, i) => (
                  <details key={i} className="rounded-lg border border-[--color-grey-border] bg-white">
                    <summary className="cursor-pointer px-4 py-3 font-medium text-[--color-text] hover:bg-[--color-bg]">
                      {modul.tittel}
                    </summary>
                    <p className="px-4 pb-3 pt-1 text-sm text-gray-500">{modul.beskrivelse}</p>
                  </details>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Høyre: påmeldingskort */}
        <div className="mt-8 lg:mt-0">
          <div className="lg:sticky lg:top-24">
            <PaameldingsFlyt
              prisOere={kurs.prisOere ?? 0}
              gratis={kurs.gratis}
              finansiering={kurs.finansiering}
              klasser={kurs.klasser}
              wordpressUrl={kurs.wordpressUrl}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
