import type { Kurs, Kurstype, CefrNivaa, Klasse, UndervisningsType } from './types';

const WP_BASE = (process.env.WORDPRESS_URL ?? 'https://aftenskolen.no').replace(/\/$/, '');
const WP_USER = process.env.WORDPRESS_USERNAME ?? '';
const WP_PASS = process.env.WORDPRESS_APP_PASSWORD ?? '';

function wpHeaders(): HeadersInit {
  const creds = Buffer.from(`${WP_USER}:${WP_PASS}`).toString('base64');
  return { Authorization: `Basic ${creds}` };
}

// ── Type-definisjoner ──────────────────────────────────────────────────────────

interface WcProduct {
  id: number;
  name: string;
  slug: string;
  permalink: string;
  status: string;
  price: string;
  regular_price: string;
  purchasable: boolean;
  stock_status: string;
  description: string;
  short_description: string;
  categories: Array<{ id: number; name: string; slug: string }>;
  images: Array<{ src: string }>;
  meta_data: Array<{ key: string; value: unknown }>;
}

// ── Mapping-tabeller ──────────────────────────────────────────────────────────

const KATEGORI_MAP: Record<string, Kurstype> = {
  fysisk: 'fysisk',
  'fysiske-kurs': 'fysisk',
  'physical': 'fysisk',
};

const METHOD_MAP: Record<string, UndervisningsType> = {
  classroom: 'fysisk',
  hybrid: 'hybrid',
  online: 'nettbasert',
  nettkurs: 'nettbasert',
  virtual: 'nettbasert',
  nettbasert: 'nettbasert',
};

// ── Hjelpefunksjoner ──────────────────────────────────────────────────────────

function detectCefr(text: string): CefrNivaa {
  const match = text.match(/\b(A1|A2|B1|B2)\b/i);
  return match?.[1] ? (match[1].toUpperCase() as CefrNivaa) : 'ingen';
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#8211;/g, '–')
    .replace(/&#8212;/g, '—')
    .replace(/&#8230;/g, '…')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseDato(dato: string): string {
  // YYYYMMDD → YYYY-MM-DD
  if (/^\d{8}$/.test(dato)) {
    return `${dato.slice(0, 4)}-${dato.slice(4, 6)}-${dato.slice(6, 8)}`;
  }
  return dato;
}

function erVirtuelt(sted: string): boolean {
  const s = sted.toLowerCase();
  return s.includes('virtuelt') || s.includes('virtual') || s.includes('nett') || s.includes('online');
}

// ── Mapping: WooCommerce-produkt → Kurs ───────────────────────────────────────

function mapWcTilKurs(product: WcProduct): Kurs {
  const meta: Record<string, string> = {};
  for (const m of product.meta_data) {
    meta[m.key] = String(m.value ?? '');
  }

  // Kategori → Kurstype
  const catSlugs = product.categories.map((c) => c.slug);
  const kurstype =
    catSlugs.reduce<Kurstype | undefined>(
      (found, slug) => found ?? KATEGORI_MAP[slug],
      undefined,
    ) ?? 'nettkurs';

  // CEFR fra produktnavn
  const tittel = product.name;
  const cefrNivaa = detectCefr(tittel);

  // Pris (WC returnerer NOK, vi lagrer øre)
  const gratis = !product.price || product.price === '0';
  const prisOere = product.price ? Math.round(parseFloat(product.price) * 100) : 0;

  // Undervisningsform
  const method = meta.educational_method ?? 'classroom';
  const defaultType: UndervisningsType = METHOD_MAP[method] ?? 'fysisk';

  // Klasser fra linked_cohorts-meta
  const cohortRaw = meta.linked_cohorts ?? '0';
  const cohortCount = parseInt(cohortRaw, 10) || 0;
  const klasser: Klasse[] = [];
  for (let i = 0; i < cohortCount; i++) {
    const rawDato = meta[`linked_cohorts_${i}_single_cohort_date`] ?? '';
    const sted = meta[`linked_cohorts_${i}_single_cohort_location`] ?? '';
    const cohortId = meta[`linked_cohorts_${i}_single_cohort_cohort`] ?? '';
    const klassetype: UndervisningsType = erVirtuelt(sted) ? 'nettbasert' : defaultType;

    klasser.push({
      id: cohortId || `${product.id}-${i}`,
      startDato: parseDato(rawDato),
      ...(sted && !erVirtuelt(sted) ? { sted } : {}),
      type: klassetype,
    });
  }

  // Bilde
  const coverbildeUrl = product.images?.[0]?.src;

  // Beskrivelse
  const beskrivelseLang = stripHtml(product.description ?? '');
  const kortDesc = stripHtml(product.short_description ?? '');
  const forsteSetning = beskrivelseLang.split(/(?<=\.)\s+/)[0] ?? '';
  const ingress = kortDesc || forsteSetning;

  return {
    id: String(product.id),
    slug: product.slug,
    tittel,
    ingress: ingress.slice(0, 300),
    ...(beskrivelseLang ? { beskrivelseLang } : {}),
    kurstype,
    cefrNivaa,
    gratis,
    prisOere,
    finansiering: 'ingen',
    klasser,
    wordpressUrl: product.permalink,
    ...(coverbildeUrl ? { coverbildeUrl } : {}),
  };
}

// ── Eksporterte datahentingsfunksjoner ────────────────────────────────────────

export async function hentAlleWordpressKurs(): Promise<Kurs[]> {
  const res = await fetch(
    `${WP_BASE}/wp-json/wc/v3/products?per_page=100&status=publish`,
    { headers: wpHeaders(), next: { revalidate: 300 } },
  );
  if (!res.ok) return [];
  const products: WcProduct[] = await res.json();
  if (!Array.isArray(products)) return [];

  return products
    .filter((p) => p.status === 'publish')
    .map(mapWcTilKurs);
}

export async function hentWordpressKurs(slug: string): Promise<Kurs | null> {
  const res = await fetch(
    `${WP_BASE}/wp-json/wc/v3/products?slug=${encodeURIComponent(slug)}`,
    { headers: wpHeaders(), next: { revalidate: 300 } },
  );
  if (!res.ok) return null;
  const products: WcProduct[] = await res.json();
  if (!Array.isArray(products) || products.length === 0) return null;
  const product = products[0];
  if (!product) return null;
  return mapWcTilKurs(product);
}
