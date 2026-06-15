// ── Flerspråklig teksttype ────────────────────────────────────────────────────

export type FlerspraakligTekst = {
  no: string
  en?: string
  ar?: string
  so?: string
  ti?: string
  [key: string]: string | undefined
}

// ── Innholdsblokk-typer ───────────────────────────────────────────────────────

export type BlokkType =
  | 'tekst'
  | 'video'
  | 'multiple_choice'
  | 'h5p'

export type TekstBlokkData = {
  innhold: FlerspraakligTekst
}

export type VideoBlokkData = {
  url: string
  tekstingsfil_url: string | null
  fullfor_prosent: number
}

export type MultipleChoiceAlternativ = {
  id: string
  tekst: FlerspraakligTekst
  riktig: boolean
}

export type MultipleChoiceBlokkData = {
  sporsmaal: FlerspraakligTekst
  alternativer: MultipleChoiceAlternativ[]
  forklaring_ved_feil: FlerspraakligTekst | null
  antall_forsok: number
}

export type H5PBlokkData = {
  h5p_fil_url: string
  h5p_embed_url: string | null
}

export type InnholdsBlokk = {
  id: string
  type: BlokkType
  data: TekstBlokkData | VideoBlokkData | MultipleChoiceBlokkData | H5PBlokkData
  paakrevd: boolean
}

// ── Domenetyper ───────────────────────────────────────────────────────────────

export type Bruker = {
  id: string
  bruker_nr: string
  navn: string
  epost: string
  telefon: string | null
  fodselsdato: string | null
  kjonn: 'mann' | 'kvinne' | 'ikke_oppgitt' | null
  adresse: string | null
  postnummer: string | null
  poststed: string | null
  morsmaal: string | null
  utdanningsnivaa: 'grunnskole' | 'vgs' | 'fagbrev' | 'hoeyere' | 'ukjent' | null
  fodselsnummer: string | null
  foretrukket_sprak: string
  profilbilde_url: string | null
  notat: string | null
  aktiv: boolean
  opprettet_dato: string
}

export type BrukerAuthProvider = {
  id: string
  bruker_id: string
  provider: 'epost' | 'vipps' | 'feide' | 'google'
  provider_sub: string
  opprettet_dato: string
}

export type RolleDefinisjon = {
  id: string
  navn: 'superadmin' | 'admin' | 'redaktoer' | 'laerer' | 'mentor' | 'deltaker'
  beskrivelse: string | null
  kan_opprettes_av: string[] | null
}

export type BrukerRolle = {
  id: string
  bruker_id: string
  rolle_id: string
  status: 'aktiv' | 'venter_godkjenning' | 'avslatt'
  godkjent_av: string | null
  tildelt_dato: string
}

export type InnholdModul = {
  id: string
  tittel: FlerspraakligTekst
  beskrivelse: FlerspraakligTekst | null
  tags: string[] | null
}

export type InnholdLeksjon = {
  id: string
  tittel: FlerspraakligTekst
  beskrivelse: FlerspraakligTekst | null
  innhold_blokker: InnholdsBlokk[]
  tags: string[] | null
  estimert_tid_min: number | null
  xp_verdi: number
  status: 'utkast' | 'til_review' | 'publisert' | 'arkivert'
  leksjon_type: 'standard' | 'forsterkning' | 'fordypning' | 'adaptiv_alternativ'
  versjon: number
  opprettet_av: string | null
  sist_endret: string
}

export type Kurs = {
  id: string
  tittel: FlerspraakligTekst
  beskrivelse: FlerspraakligTekst | null
  slug: string
  emnekode: string | null
  kurstype:
    | 'norsk'
    | 'samfunnskunnskap'
    | 'norsk_og_samfunnskunnskap'
    | 'fagbrev'
    | 'arbeidsliv'
    | 'livsmestring'
    | 'annet'
  cefr_nivaa: 'A1' | 'A2' | 'B1' | 'B2' | 'ingen' | null
  forside_prioritet: number
  aktiv: boolean
  opprettet_dato: string
  opprettet_av: string | null
}

export type KursModulKobling = {
  id: string
  kurs_id: string
  modul_id: string
  rekkefolge: number
}

export type ModulLeksjonKobling = {
  id: string
  modul_id: string
  leksjon_id: string
  rekkefolge: number
}

export type Klasse = {
  id: string
  kurs_id: string
  tittel: string
  kommunenummer: string | null
  sted: string | null
  start_dato: string
  slutt_dato: string
  maks_deltakere: number | null
  finansieringskilde: string | null
  status: 'planlagt' | 'aktiv' | 'avsluttet' | 'avlyst'
  prismodell: 'engangsbetaling' | 'abonnement'
  pris: number
  gratis: boolean
  rullerende_oppstart: boolean
  opprettet_dato: string
}

export type KlasseRolle = {
  id: string
  klasse_id: string
  bruker_id: string
  rolle: 'laerer' | 'dagmentor' | 'kveldsmentor' | 'ekstern_sensor' | 'admin'
}

export type Samling = {
  id: string
  klasse_id: string
  type: 'fysisk' | 'virtuell' | 'discord' | 'asynkron'
  dato_tid: string
  varighet_timer: number
  sted_eller_lenke: string | null
  status: 'planlagt' | 'gjennomfort' | 'avlyst'
  notat: string | null
}

export type SamlingOppmote = {
  id: string
  samling_id: string
  bruker_id: string
  status: 'tilstede' | 'ukjent_fravaer' | 'jobb' | 'godkjent_fravaer'
  notat: string | null
  registrert_dato: string
}

export type Paamelding = {
  id: string
  bruker_id: string
  klasse_id: string
  paameldt_dato: string
  individuell_startdato: string | null
  tilgang_til: string
  status:
    | 'venteliste'
    | 'paameldt'
    | 'aktiv'
    | 'droppet'
    | 'aldri_mott'
    | 'selvstudie'
    | 'fullfort'
    | 'avbrutt'
  venteliste_prioritet: number | null
  betaling_status: 'ikke_betalt' | 'betalt' | 'fakturert' | 'fritatt' | 'reservert'
  fullfort_dato: string | null
}

export type LeksjonProgresjon = {
  id: string
  paamelding_id: string
  leksjon_id: string
  status: 'ikke_startet' | 'paabegynt' | 'fullfort'
  blokk_status: Record<string, 'ikke_startet' | 'fullfort'>
  score: number | null
  tid_brukt_sekunder: number
  sist_aktiv_dato: string | null
  startet_dato: string | null
}

export type LeksjonBesvarelse = {
  id: string
  progresjon_id: string
  oppgave_snapshot: Record<string, unknown>
  svar: Record<string, unknown>
  innlevert_dato: string
  score: number | null
  vurderingsmodus: 'auto' | 'ki' | 'laerer' | 'ki_laerer'
  oppgave_status:
    | 'ikke_startet'
    | 'paabegynt'
    | 'levert'
    | 'tilbakemelding'
    | 'godkjent'
    | 'avvist'
    | 'auto_godkjent'
}

export type XpKonfigurasjon = {
  handling: string
  xp_verdi: number
  andre_forsok_prosent: number
  sist_endret_av: string | null
}

export type LevelTerskel = {
  level: number
  xp_paakrevd: number
}

export type BrukerStreak = {
  id: string
  bruker_id: string
  dato: string
  xp_opptjent: number
  streak_frys_brukt: boolean
  innlogging_tildelt: boolean
}

export type AuditLog = {
  id: string
  tabell_navn: string
  rad_id: string
  felt_navn: string | null
  gammel_verdi: string | null
  ny_verdi: string | null
  endret_av: string | null
  endret_dato: string
}

export type Oppgave = {
  id: string
  samling_id: string
  klasse_id: string
  tittel: string
  beskrivelse: string | null
  fil_url: string | null
  opprettet_av: string
  opprettet_dato: string
}

export type OppgaveInnlevering = {
  id: string
  oppgave_id: string
  bruker_id: string
  innhold_tekst: string | null
  fil_url: string | null
  innlevert_dato: string
  tilbakemelding_tekst: string | null
  tilbakemelding_dato: string | null
  status: 'levert' | 'rettet'
}

export type MeldingTrad = {
  id: string
  klasse_id: string
  laerer_id: string
  deltaker_id: string
  opprettet_dato: string
}

export type Melding = {
  id: string
  trad_id: string
  fra_bruker_id: string
  innhold: string
  sendt_dato: string
  lest_dato: string | null
}

// ── Supabase Database-type (brukes av createClient<Database>) ─────────────────

type MakeInsert<T extends Record<string, unknown>, AutoFields extends keyof T = 'id' | 'opprettet_dato'> =
  Omit<T, AutoFields> & Partial<Pick<T, AutoFields>>

export type Database = {
  public: {
    Tables: {
      bruker: {
        Row: Bruker
        Insert: MakeInsert<Bruker, 'id' | 'bruker_nr' | 'opprettet_dato'>
        Update: Partial<Omit<Bruker, 'id' | 'bruker_nr' | 'opprettet_dato'>>
      }
      bruker_auth_provider: {
        Row: BrukerAuthProvider
        Insert: MakeInsert<BrukerAuthProvider, 'id' | 'opprettet_dato'>
        Update: Partial<Omit<BrukerAuthProvider, 'id' | 'opprettet_dato'>>
      }
      rolle_definisjon: {
        Row: RolleDefinisjon
        Insert: MakeInsert<RolleDefinisjon, 'id'>
        Update: Partial<Omit<RolleDefinisjon, 'id'>>
      }
      bruker_rolle: {
        Row: BrukerRolle
        Insert: MakeInsert<BrukerRolle, 'id' | 'tildelt_dato'>
        Update: Partial<Omit<BrukerRolle, 'id' | 'tildelt_dato'>>
      }
      innhold_modul: {
        Row: InnholdModul
        Insert: MakeInsert<InnholdModul, 'id'>
        Update: Partial<Omit<InnholdModul, 'id'>>
      }
      innhold_leksjon: {
        Row: InnholdLeksjon
        Insert: MakeInsert<InnholdLeksjon, 'id' | 'sist_endret'>
        Update: Partial<Omit<InnholdLeksjon, 'id' | 'sist_endret'>>
      }
      kurs: {
        Row: Kurs
        Insert: MakeInsert<Kurs, 'id' | 'opprettet_dato'>
        Update: Partial<Omit<Kurs, 'id' | 'opprettet_dato'>>
      }
      kurs_modul_kobling: {
        Row: KursModulKobling
        Insert: MakeInsert<KursModulKobling, 'id'>
        Update: Partial<Omit<KursModulKobling, 'id'>>
      }
      modul_leksjon_kobling: {
        Row: ModulLeksjonKobling
        Insert: MakeInsert<ModulLeksjonKobling, 'id'>
        Update: Partial<Omit<ModulLeksjonKobling, 'id'>>
      }
      klasse: {
        Row: Klasse
        Insert: MakeInsert<Klasse, 'id' | 'opprettet_dato'>
        Update: Partial<Omit<Klasse, 'id' | 'opprettet_dato'>>
      }
      klasse_rolle: {
        Row: KlasseRolle
        Insert: MakeInsert<KlasseRolle, 'id'>
        Update: Partial<Omit<KlasseRolle, 'id'>>
      }
      samling: {
        Row: Samling
        Insert: MakeInsert<Samling, 'id'>
        Update: Partial<Omit<Samling, 'id'>>
      }
      samling_oppmote: {
        Row: SamlingOppmote
        Insert: MakeInsert<SamlingOppmote, 'id' | 'registrert_dato'>
        Update: Partial<Omit<SamlingOppmote, 'id' | 'registrert_dato'>>
      }
      paamelding: {
        Row: Paamelding
        Insert: MakeInsert<Paamelding, 'id' | 'paameldt_dato'>
        Update: Partial<Omit<Paamelding, 'id' | 'paameldt_dato'>>
      }
      leksjon_progresjon: {
        Row: LeksjonProgresjon
        Insert: MakeInsert<LeksjonProgresjon, 'id'>
        Update: Partial<Omit<LeksjonProgresjon, 'id'>>
      }
      leksjon_besvarelse: {
        Row: LeksjonBesvarelse
        Insert: MakeInsert<LeksjonBesvarelse, 'id' | 'innlevert_dato'>
        Update: Partial<Omit<LeksjonBesvarelse, 'id' | 'innlevert_dato'>>
      }
      xp_konfigurasjon: {
        Row: XpKonfigurasjon
        Insert: Omit<XpKonfigurasjon, never>
        Update: Partial<XpKonfigurasjon>
      }
      level_terskel: {
        Row: LevelTerskel
        Insert: LevelTerskel
        Update: Partial<LevelTerskel>
      }
      bruker_streak: {
        Row: BrukerStreak
        Insert: MakeInsert<BrukerStreak, 'id'>
        Update: Partial<Omit<BrukerStreak, 'id'>>
      }
      audit_log: {
        Row: AuditLog
        Insert: MakeInsert<AuditLog, 'id' | 'endret_dato'>
        Update: Partial<Omit<AuditLog, 'id' | 'endret_dato'>>
      }
      oppgave: {
        Row: Oppgave
        Insert: MakeInsert<Oppgave, 'id' | 'opprettet_dato'>
        Update: Partial<Omit<Oppgave, 'id' | 'opprettet_dato'>>
      }
      oppgave_innlevering: {
        Row: OppgaveInnlevering
        Insert: MakeInsert<OppgaveInnlevering, 'id' | 'innlevert_dato'>
        Update: Partial<Omit<OppgaveInnlevering, 'id' | 'innlevert_dato'>>
      }
      melding_trad: {
        Row: MeldingTrad
        Insert: MakeInsert<MeldingTrad, 'id' | 'opprettet_dato'>
        Update: Partial<Omit<MeldingTrad, 'id' | 'opprettet_dato'>>
      }
      melding: {
        Row: Melding
        Insert: MakeInsert<Melding, 'id' | 'sendt_dato'>
        Update: Partial<Omit<Melding, 'id' | 'sendt_dato'>>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
