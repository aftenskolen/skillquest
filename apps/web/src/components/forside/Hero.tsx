import { getTranslations } from 'next-intl/server';
import KiSok from './KiSok';

interface HeroProps {
  overskrift?: string;
  underoverskrift?: string;
}

export default async function Hero({ overskrift, underoverskrift }: HeroProps) {
  const t = await getTranslations('hero');

  return (
    <section className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
        <h1 className="text-4xl font-bold tracking-tight text-[--color-primary] sm:text-5xl lg:text-6xl">
          {overskrift ?? t('overskrift')}
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-500">
          {underoverskrift ?? t('underoverskrift')}
        </p>
        <div className="mt-10">
          <KiSok />
        </div>
      </div>
    </section>
  );
}
