export type Kurstype = 'norsk' | 'fagbrev' | 'arbeidsliv' | 'livsmestring' | 'annet';
export type CefrNivaa = 'A1' | 'A2' | 'B1' | 'B2' | 'ingen';
export type UndervisningsType = 'fysisk' | 'nettbasert' | 'hybrid';
export type Finansiering = 'imdi' | 'hkdir' | 'ingen';

export interface SanityBilde {
  asset: { _ref: string; _type: string };
  alt?: string;
}

export interface Klasse {
  id: string;
  startDato: string;
  sluttDato?: string;
  sted?: string;
  type: UndervisningsType;
  maksPlasser?: number;
  ledigePlasser?: number;
}

export interface Kurs {
  id: string;
  slug: string;
  tittel: string;
  ingress: string;
  beskrivelseLang?: string;
  hvaLaererDu?: string[];
  hvemPasser?: string;
  coverbilde?: SanityBilde | null;
  kurstype: Kurstype;
  cefrNivaa: CefrNivaa;
  forsidePrioritet?: number;
  prisOere?: number;
  gratis: boolean;
  finansiering?: Finansiering;
  klasser: Klasse[];
  laereplan?: Array<{ tittel: string; beskrivelse: string }>;
}

export interface Sitat {
  id: string;
  deltagerNavn: string;
  kursNavn: string;
  sitatTekst: string;
}

export interface Samarbeidspartner {
  id: string;
  navn: string;
  beskrivelse: string;
  lenke?: string;
  kategori?: string;
}

export interface KontaktSkjema {
  navn: string;
  epost: string;
  emne: string;
  melding: string;
}
