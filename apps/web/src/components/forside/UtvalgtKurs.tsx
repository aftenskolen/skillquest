import { hentKurser } from '@/lib/data';
import KursKort from '@/components/kurs/KursKort';

export default async function UtvalgtKurs() {
  const kurs = await hentKurser(true);

  if (kurs.length === 0) return null;

  return (
    <section className="bg-[--color-bg] py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="mb-8 text-2xl font-bold text-[--color-primary] sm:text-3xl">
          Utvalgte kurs
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {kurs.map((k) => (
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
      </div>
    </section>
  );
}
