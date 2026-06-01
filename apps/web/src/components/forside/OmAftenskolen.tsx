import { getTranslations } from 'next-intl/server';

interface OmAftensskolenProps {
  ingress?: string;
  nokkeltal?: Array<{ ikon: string; verdi: string }>;
}

export default async function OmAftenskolen({ ingress, nokkeltal }: OmAftensskolenProps) {
  const t = await getTranslations('om-aftenskolen');

  const tall = nokkeltal ?? [
    { ikon: '📅', verdi: t('siden-1952') },
    { ikon: '👥', verdi: t('deltakere') },
    { ikon: '✓', verdi: t('godkjent') },
  ];

  return (
    <section className="border-t border-[--color-grey-border] bg-white py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="mb-10 text-center text-lg text-gray-500">
          {ingress ?? t('ingress')}
        </p>
        <div className="grid gap-6 sm:grid-cols-3">
          {tall.map((item) => (
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
