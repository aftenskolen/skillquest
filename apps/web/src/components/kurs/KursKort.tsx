import Link from 'next/link';
import Image from 'next/image';
import { Badge } from '@novolms/ui';
import type { Kurstype, CefrNivaa } from '@/lib/types';

interface KursKortProps {
  tittel: string;
  slug: string;
  ingress: string;
  coverbilde?: { asset: { _ref: string }; alt?: string | undefined } | null | undefined;
  coverbildeUrl?: string | undefined;
  kurstype: Kurstype;
  cefrNivaa: CefrNivaa;
  prisOere?: number | undefined;
  gratis: boolean;
  finansiering?: string | undefined;
  nesteOppstart?: string | undefined;
  badge?: string | undefined;
}

const kursFarger: Record<Kurstype, 'teal' | 'blue' | 'purple' | 'green' | 'grey'> = {
  nettkurs: 'teal',
  fysisk: 'blue',
};

const kursLabeler: Record<Kurstype, string> = {
  nettkurs: 'Nettkurs',
  fysisk: 'Fysisk kurs',
};

function formaterPris(prisOere: number, gratis: boolean, finansiering?: string): string {
  if (gratis || prisOere === 0) {
    if (finansiering === 'imdi') return 'Finansiert av IMDI';
    if (finansiering === 'hkdir') return 'Finansiert av HK Dir';
    return 'Gratis';
  }
  const kr = Math.floor(prisOere / 100);
  return `kr ${kr.toLocaleString('nb-NO')}`;
}

function formaterDato(dato: string): string {
  return new Date(dato).toLocaleDateString('nb-NO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function KursKort({
  tittel,
  slug,
  ingress,
  coverbilde,
  coverbildeUrl,
  kurstype,
  cefrNivaa,
  prisOere = 0,
  gratis,
  finansiering,
  nesteOppstart,
  badge,
}: KursKortProps) {
  const bildeUrl = coverbildeUrl ?? (coverbilde ? '/api/placeholder' : null);

  return (
    <Link
      href={`/no/kurs/${slug}`}
      className="group flex flex-col overflow-hidden rounded-lg border border-[--color-grey-border] bg-white shadow-sm transition-all hover:shadow-md hover:scale-[1.01]"
    >
      {/* Coverbilde */}
      <div className="relative aspect-video w-full overflow-hidden bg-[--color-bg]">
        {bildeUrl ? (
          <Image
            src={bildeUrl}
            alt={coverbilde?.alt ?? tittel}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-[--color-primary] to-[--color-secondary]">
            <span className="text-4xl font-bold text-white opacity-20">A</span>
          </div>
        )}
        {badge && (
          <span className="absolute right-0 top-4 bg-[--color-accent] px-3 py-1 text-xs font-bold text-white shadow-sm after:absolute after:right-0 after:top-full after:border-4 after:border-transparent after:border-r-[--color-secondary] after:content-['']">
            {badge}
          </span>
        )}
      </div>

      {/* Innhold */}
      <div className="flex flex-1 flex-col p-4">
        <div className="mb-2 flex flex-wrap gap-1">
          <Badge color={kursFarger[kurstype]}>{kursLabeler[kurstype]}</Badge>
          {cefrNivaa !== 'ingen' && (
            <Badge color="grey">{cefrNivaa}</Badge>
          )}
        </div>

        <h3 className="mb-1 font-semibold text-[--color-text] group-hover:text-[--color-secondary]">
          {tittel}
        </h3>

        <p className="mb-4 line-clamp-2 flex-1 text-sm text-gray-500">{ingress}</p>

        <div className="mt-auto flex items-center justify-between text-sm">
          <span className="text-gray-400">
            {nesteOppstart ? `Oppstart ${formaterDato(nesteOppstart)}` : 'Fleksibel oppstart'}
          </span>
          <span className={`font-semibold ${gratis || prisOere === 0 ? 'text-[--color-accent]' : 'text-[--color-primary]'}`}>
            {formaterPris(prisOere, gratis, finansiering)}
          </span>
        </div>
      </div>
    </Link>
  );
}
