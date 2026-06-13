import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Input, Label, Button } from '@novolms/ui';

export default function LoggInn() {
  const t = useTranslations('auth');

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <h1 className="mb-8 text-center text-2xl font-bold text-[--color-primary]">{t('logg-inn-tittel')}</h1>

        <form className="space-y-4">
          <div>
            <Label htmlFor="epost">{t('epost')}</Label>
            <Input id="epost" type="email" autoComplete="email" required className="mt-1" />
          </div>
          <div>
            <Label htmlFor="passord">{t('passord')}</Label>
            <Input id="passord" type="password" autoComplete="current-password" required className="mt-1" />
          </div>
          <Button type="submit" variant="primary" className="w-full">
            {t('logg-inn-knapp')}
          </Button>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-[--color-grey-border]" />
            </div>
            <div className="relative flex justify-center text-xs text-gray-400">
              <span className="bg-white px-2">eller</span>
            </div>
          </div>
          <button
            type="button"
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-[--color-grey-border] bg-white py-2.5 text-sm font-medium text-[--color-text] opacity-50 cursor-not-allowed"
            disabled
            title="Kommer snart"
          >
            {t('vipps')}
          </button>
        </div>

        <p className="mt-6 text-center text-sm text-gray-500">
          {t('mangler-konto')}{' '}
          <Link href="/no/auth/registrer" className="text-[--color-secondary] hover:underline">
            {t('til-registrer')}
          </Link>
        </p>
      </div>
    </div>
  );
}
