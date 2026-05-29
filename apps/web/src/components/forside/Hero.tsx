import { useTranslations } from 'next-intl';
import KiSok from './KiSok';

export default function Hero() {
  const t = useTranslations('hero');

  return (
    <section className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
        <h1 className="text-4xl font-bold tracking-tight text-[--color-primary] sm:text-5xl lg:text-6xl">
          {t('overskrift')}
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-500">
          {t('underoverskrift')}
        </p>
        <div className="mt-10">
          <KiSok />
        </div>
      </div>
    </section>
  );
}
