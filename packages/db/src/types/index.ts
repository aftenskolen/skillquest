export type Bruker = {
  id: string;
  bruker_nr: string;
  navn: string;
  epost: string;
  telefon: string | null;
  rolle: "elev" | "laerer" | "admin";
  aktiv: boolean;
  opprettet_ved: string;
  oppdatert_ved: string;
};

export type Kurs = {
  id: string;
  tittel: string;
  slug: string;
  beskrivelse: string | null;
  kurstype: string;
  niva: string | null;
  sprakkode: string | null;
  pris_oere: number;
  maks_deltakere: number | null;
  publisert: boolean;
  opprettet_ved: string;
  oppdatert_ved: string;
};

export type Klasse = {
  id: string;
  kurs_id: string;
  navn: string;
  start_dato: string;
  slutt_dato: string | null;
  laerer_id: string | null;
  rom: string | null;
  maks_deltakere: number | null;
  opprettet_ved: string;
  oppdatert_ved: string;
};

export type Paamelding = {
  id: string;
  bruker_id: string;
  klasse_id: string;
  status: "pameldt" | "venter" | "avmeldt" | "fullfort";
  betalt: boolean;
  opprettet_ved: string;
  oppdatert_ved: string;
};

export type Betaling = {
  id: string;
  paamelding_id: string;
  belop_oere: number;
  status: "venter" | "fullfort" | "refundert" | "feilet";
  betaling_metode: string | null;
  ekstern_id: string | null;
  opprettet_ved: string;
  oppdatert_ved: string;
};

export type Modul = {
  id: string;
  kurs_id: string;
  tittel: string;
  beskrivelse: string | null;
  rekkefolge: number;
  publisert: boolean;
  opprettet_ved: string;
  oppdatert_ved: string;
};

export type Leksjon = {
  id: string;
  modul_id: string;
  tittel: string;
  innhold_type: "tekst" | "video" | "quiz" | "oppgave";
  innhold: Record<string, unknown> | null;
  rekkefolge: number;
  publisert: boolean;
  opprettet_ved: string;
  oppdatert_ved: string;
};

export type Progresjon = {
  id: string;
  bruker_id: string;
  leksjon_id: string;
  fullfort: boolean;
  fullfort_ved: string | null;
  opprettet_ved: string;
  oppdatert_ved: string;
};

export type Database = {
  public: {
    Tables: {
      bruker: {
        Row: Bruker;
        Insert: Omit<Bruker, "id" | "opprettet_ved" | "oppdatert_ved"> & { id?: string };
        Update: Partial<Omit<Bruker, "id" | "opprettet_ved" | "oppdatert_ved">>;
      };
      kurs: {
        Row: Kurs;
        Insert: Omit<Kurs, "id" | "opprettet_ved" | "oppdatert_ved"> & { id?: string };
        Update: Partial<Omit<Kurs, "id" | "opprettet_ved" | "oppdatert_ved">>;
      };
      klasse: {
        Row: Klasse;
        Insert: Omit<Klasse, "id" | "opprettet_ved" | "oppdatert_ved"> & { id?: string };
        Update: Partial<Omit<Klasse, "id" | "opprettet_ved" | "oppdatert_ved">>;
      };
      paamelding: {
        Row: Paamelding;
        Insert: Omit<Paamelding, "id" | "opprettet_ved" | "oppdatert_ved"> & { id?: string };
        Update: Partial<Omit<Paamelding, "id" | "opprettet_ved" | "oppdatert_ved">>;
      };
      betaling: {
        Row: Betaling;
        Insert: Omit<Betaling, "id" | "opprettet_ved" | "oppdatert_ved"> & { id?: string };
        Update: Partial<Omit<Betaling, "id" | "opprettet_ved" | "oppdatert_ved">>;
      };
      modul: {
        Row: Modul;
        Insert: Omit<Modul, "id" | "opprettet_ved" | "oppdatert_ved"> & { id?: string };
        Update: Partial<Omit<Modul, "id" | "opprettet_ved" | "oppdatert_ved">>;
      };
      leksjon: {
        Row: Leksjon;
        Insert: Omit<Leksjon, "id" | "opprettet_ved" | "oppdatert_ved"> & { id?: string };
        Update: Partial<Omit<Leksjon, "id" | "opprettet_ved" | "oppdatert_ved">>;
      };
      progresjon: {
        Row: Progresjon;
        Insert: Omit<Progresjon, "id" | "opprettet_ved" | "oppdatert_ved"> & { id?: string };
        Update: Partial<Omit<Progresjon, "id" | "opprettet_ved" | "oppdatert_ved">>;
      };
    };
  };
};
