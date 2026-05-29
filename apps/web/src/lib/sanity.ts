import { createClient } from '@sanity/client';
import imageUrlBuilder from '@sanity/image-url';
import type { SanityImageSource } from '@sanity/image-url/lib/types/types';
import type { Kurs, Sitat, Samarbeidspartner } from './types';
import { mockKurs, mockSitater, mockSamarbeidspartnere } from './seed-data';

const useMockData = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';

export const sanityClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? 'placeholder',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production',
  apiVersion: '2024-01-01',
  useCdn: true,
  ...(process.env.SANITY_API_TOKEN ? { token: process.env.SANITY_API_TOKEN } : {}),
});

const builder = imageUrlBuilder(sanityClient);

export function urlFor(source: SanityImageSource) {
  return builder.image(source);
}

export async function hentForsideKurs(): Promise<Kurs[]> {
  if (useMockData) {
    return mockKurs
      .filter((k) => k.forsidePrioritet && k.forsidePrioritet > 0)
      .sort((a, b) => (a.forsidePrioritet ?? 9) - (b.forsidePrioritet ?? 9));
  }
  // Sanity-spørring implementeres når CMS er konfigurert
  return [];
}

export async function hentAlleKurs(): Promise<Kurs[]> {
  if (useMockData) return mockKurs;
  return [];
}

export async function hentKurs(slug: string): Promise<Kurs | null> {
  if (useMockData) return mockKurs.find((k) => k.slug === slug) ?? null;
  return null;
}

export async function hentSitater(): Promise<Sitat[]> {
  if (useMockData) return mockSitater;
  return [];
}

export async function hentSamarbeidspartnere(): Promise<Samarbeidspartner[]> {
  if (useMockData) return mockSamarbeidspartnere;
  return [];
}
