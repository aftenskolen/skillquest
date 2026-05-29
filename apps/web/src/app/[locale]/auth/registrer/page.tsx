import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Input, Label, Button } from '@skillquest/ui';

export default function Registrer() {
  const t = useTranslations('auth');

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <h1 className="mb-8 text-center text-2xl font-bold text-[--color-primary]">{t('registrer-tittel')}</h1>

        <form className="space-y-4">
          <div>
            <Label htmlFor="navn">{t('navn')}</Label>
            <Input id="navn" type="text" autoComplete="name" required className="mt-1" />
          </div>
          <div>
            <Label htmlFor="epost">{t('epost')}</Label>
            <Input id="epost" type="email" autoComplete="email" required className="mt-1" />
          </div>
          <div>
            <Label htmlFor="passord">{t('passord')}</Label>
            <Input id="passord" type="password" autoComplete="new-password" required className="mt-1" />
          </div>
          <div>
            <Label htmlFor="bekreft">{t('bekreft-passord')}</Label>
            <Input id="bekreft" type="password" autoComplete="new-password" required className="mt-1" />
          </div>
          <div className="flex items-start gap-2">
            <input id="gdpr" type="checkbox" required className="mt-1 h-4 w-4 rounded border-[--color-grey-border]" />
            <label htmlFor="gdpr" className="text-sm text-gray-600">
              {t('gdpr')}{' '}
              <Link href="/no/personvern" className="text-[--color-secondary] hover:underline">
                (Les mer)
              </Link>
            </label>
          </div>
          <Button type="submit" variant="primary" className="w-full">
            {t('registrer-knapp')}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          {t('har-konto')}{' '}
          <Link href="/no/auth/logg-inn" className="text-[--color-secondary] hover:underline">
            {t('til-logg-inn')}
          </Link>
        </p>
      </div>
    </div>
  );
}
