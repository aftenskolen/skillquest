import { sanityClient, urlFor } from './sanity';
import { hentAlleWordpressKurs, hentWordpressKurs } from './wordpress';
import { ALLE_KURS_QUERY, FORSIDE_KURS_QUERY, FORSIDE_INNHOLD_QUERY } from './sanity-queries';
import { mockKurs } from './seed-data';
import type { Kurs } from './types';
import type { SanityImageSource } from '@sanity/image-url/lib/types/types';

export interface ForsideInnhold {
  hero_overskrift?: string;
  hero_underoverskrift?: string;
  om_ingress?: string;
  om_nokkeltal?: Array<{ ikon: string; verdi: string }>;
}

export async function hentForsideInnhold(): Promise<ForsideInnhold> {
  try {
    const data = await sanityClient.fetch<ForsideInnhold>(FORSIDE_INNHOLD_QUERY);
    return data ?? {};
  } catch {
    return {};
  }
}

const useMockData = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';

interface SanityKursVisning {
  slug: string;
  forside_prioritet?: number;
  badge?: string;
  fremhevet_tittel?: string;
  ingress_override?: string;
  coverbilde_override?: SanityImageSource;
}

function mergeKurs(wpKurs: Kurs, sanity: SanityKursVisning): Kurs {
  const coverbildeUrl = sanity.coverbilde_override
    ? urlFor(sanity.coverbilde_override).width(1200).url()
    : wpKurs.coverbildeUrl;

  return {
    ...wpKurs,
    tittel: sanity.fremhevet_tittel ?? wpKurs.tittel,
    ingress: sanity.ingress_override ?? wpKurs.ingress,
    ...(coverbildeUrl ? { coverbildeUrl } : {}),
    ...(sanity.badge ? { badge: sanity.badge } : {}),
    ...(sanity.forside_prioritet !== undefined
      ? { forsidePrioritet: sanity.forside_prioritet }
      : {}),
  };
}

export async function hentKurser(kunForside = false): Promise<Kurs[]> {
  if (useMockData) {
    if (kunForside) {
      return mockKurs
        .filter((k) => k.forsidePrioritet && k.forsidePrioritet > 0)
        .sort((a, b) => (a.forsidePrioritet ?? 9) - (b.forsidePrioritet ?? 9));
    }
    return mockKurs;
  }

  const query = kunForside ? FORSIDE_KURS_QUERY : ALLE_KURS_QUERY;

  let sanityKurs: SanityKursVisning[] = [];
  try {
    sanityKurs = await sanityClient.fetch(query);
  } catch {
    // Fallback ved Sanity-feil (feil konfigurasjon, ikke publiserte kurs, osv.)
  }

  if (!sanityKurs || sanityKurs.length === 0) {
    // Fallback: hent direkte fra WordPress uten Sanity-filtrering
    const alleWp = await hentAlleWordpressKurs();
    return kunForside ? alleWp.slice(0, 3) : alleWp;
  }

  const wpResults = await Promise.all(
    sanityKurs.map((sk) => hentWordpressKurs(sk.slug)),
  );

  const merged: Kurs[] = [];
  sanityKurs.forEach((sk, i) => {
    const wpKurs = wpResults[i];
    if (wpKurs) merged.push(mergeKurs(wpKurs, sk));
  });

  return merged;
}
