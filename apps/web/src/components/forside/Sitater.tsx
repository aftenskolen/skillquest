import { hentSitater } from '@/lib/sanity';

export default async function Sitater() {
  const sitater = await hentSitater();

  if (sitater.length === 0) return null;

  return (
    <section className="bg-white py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="mb-10 text-center text-2xl font-bold text-[--color-primary] sm:text-3xl">
          Hva sier deltakerne?
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {sitater.map((s) => (
            <figure key={s.id} className="rounded-lg border border-[--color-grey-border] bg-[--color-bg] p-6">
              <blockquote>
                <p className="text-sm text-gray-600 italic">"{s.sitatTekst}"</p>
              </blockquote>
              <figcaption className="mt-4">
                <p className="font-semibold text-[--color-text] text-sm">{s.deltagerNavn}</p>
                <p className="text-xs text-gray-400">{s.kursNavn}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
