-- Fase 0: Fundament for Skillquest-plattformen
-- Alle tekstfelt til brukere lagres som JSONB for flerspråklig støtte

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ── TABELL 1: bruker ──────────────────────────────────────────────────────────

CREATE TABLE bruker (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bruker_nr TEXT UNIQUE NOT NULL,
  navn TEXT NOT NULL,
  epost TEXT UNIQUE NOT NULL,
  telefon TEXT,
  fodselsdato DATE,
  kjonn TEXT CHECK (kjonn IN ('mann','kvinne','ikke_oppgitt')),
  adresse TEXT,
  postnummer TEXT,
  poststed TEXT,
  morsmaal TEXT,
  utdanningsnivaa TEXT CHECK (utdanningsnivaa IN
    ('grunnskole','vgs','fagbrev','hoeyere','ukjent')),
  fodselsnummer TEXT,
  foretrukket_sprak TEXT DEFAULT 'no',
  profilbilde_url TEXT,
  notat TEXT,
  aktiv BOOLEAN DEFAULT true,
  opprettet_dato TIMESTAMPTZ DEFAULT now()
);

CREATE SEQUENCE bruker_nr_seq START 10001;

CREATE OR REPLACE FUNCTION generer_bruker_nr()
RETURNS TRIGGER AS $$
BEGIN
  NEW.bruker_nr := 'AF-' || nextval('bruker_nr_seq');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER bruker_nr_trigger
  BEFORE INSERT ON bruker
  FOR EACH ROW
  WHEN (NEW.bruker_nr IS NULL)
  EXECUTE FUNCTION generer_bruker_nr();

CREATE INDEX idx_bruker_epost ON bruker(epost);
CREATE INDEX idx_bruker_nr ON bruker(bruker_nr);

-- ── TABELL 2: bruker_auth_provider ───────────────────────────────────────────

CREATE TABLE bruker_auth_provider (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bruker_id UUID REFERENCES bruker(id) ON DELETE CASCADE NOT NULL,
  provider TEXT CHECK (provider IN ('epost','vipps','feide','google')) NOT NULL,
  provider_sub TEXT NOT NULL,
  opprettet_dato TIMESTAMPTZ DEFAULT now(),
  UNIQUE(provider, provider_sub)
);

CREATE INDEX idx_auth_provider_lookup
  ON bruker_auth_provider(provider, provider_sub);

-- ── TABELL 3: rolle_definisjon ───────────────────────────────────────────────

CREATE TABLE rolle_definisjon (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  navn TEXT UNIQUE NOT NULL,
  beskrivelse TEXT,
  kan_opprettes_av TEXT[]
);

INSERT INTO rolle_definisjon (navn, beskrivelse, kan_opprettes_av) VALUES
  ('superadmin', 'Full tilgang til alt', ARRAY['superadmin']),
  ('admin', 'Administrasjon av kurs, klasser og deltakere', ARRAY['superadmin']),
  ('redaktoer', 'Innholdsproduksjon og redigering', ARRAY['superadmin','admin']),
  ('laerer', 'Undervisning og oppfølging av egne klasser', ARRAY['superadmin','admin']),
  ('mentor', 'Veiledning innen tildelte kurskategorier', ARRAY['superadmin','admin']),
  ('deltaker', 'Gjennomfører kurs og leksjoner', ARRAY['superadmin','admin','system']);

-- ── TABELL 4: bruker_rolle ───────────────────────────────────────────────────

CREATE TABLE bruker_rolle (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bruker_id UUID REFERENCES bruker(id) ON DELETE CASCADE NOT NULL,
  rolle_id UUID REFERENCES rolle_definisjon(id) NOT NULL,
  status TEXT CHECK (status IN ('aktiv','venter_godkjenning','avslatt'))
    DEFAULT 'aktiv',
  godkjent_av UUID REFERENCES bruker(id),
  tildelt_dato TIMESTAMPTZ DEFAULT now(),
  UNIQUE(bruker_id, rolle_id)
);

CREATE INDEX idx_bruker_rolle ON bruker_rolle(bruker_id);

-- ── TABELL 5: innhold_modul ──────────────────────────────────────────────────

CREATE TABLE innhold_modul (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tittel JSONB NOT NULL DEFAULT '{"no": ""}',
  beskrivelse JSONB DEFAULT '{"no": ""}',
  tags TEXT[]
);

-- ── TABELL 6: innhold_leksjon ────────────────────────────────────────────────

CREATE TABLE innhold_leksjon (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tittel JSONB NOT NULL DEFAULT '{"no": ""}',
  beskrivelse JSONB DEFAULT '{"no": ""}',
  innhold_blokker JSONB DEFAULT '[]',
  tags TEXT[],
  estimert_tid_min INTEGER,
  status TEXT CHECK (status IN ('utkast','til_review','publisert','arkivert'))
    DEFAULT 'utkast',
  leksjon_type TEXT CHECK (leksjon_type IN
    ('standard','forsterkning','fordypning','adaptiv_alternativ'))
    DEFAULT 'standard',
  versjon INTEGER DEFAULT 1,
  opprettet_av UUID REFERENCES bruker(id),
  sist_endret TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_leksjon_status ON innhold_leksjon(status);

-- ── TABELL 7: kurs ───────────────────────────────────────────────────────────

CREATE TABLE kurs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tittel JSONB NOT NULL DEFAULT '{"no": ""}',
  beskrivelse JSONB DEFAULT '{"no": ""}',
  slug TEXT UNIQUE NOT NULL,
  emnekode TEXT,
  kurstype TEXT CHECK (kurstype IN ('norsk','samfunnskunnskap',
    'norsk_og_samfunnskunnskap','fagbrev','arbeidsliv',
    'livsmestring','annet')) NOT NULL,
  cefr_nivaa TEXT CHECK (cefr_nivaa IN ('A1','A2','B1','B2','ingen')),
  forside_prioritet INTEGER DEFAULT 0,
  aktiv BOOLEAN DEFAULT true,
  opprettet_dato TIMESTAMPTZ DEFAULT now(),
  opprettet_av UUID REFERENCES bruker(id)
);

CREATE INDEX idx_kurs_slug ON kurs(slug);
CREATE INDEX idx_kurs_type ON kurs(kurstype);

-- ── TABELL 8: kurs_modul_kobling ─────────────────────────────────────────────

CREATE TABLE kurs_modul_kobling (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kurs_id UUID REFERENCES kurs(id) ON DELETE CASCADE NOT NULL,
  modul_id UUID REFERENCES innhold_modul(id) ON DELETE CASCADE NOT NULL,
  rekkefolge INTEGER NOT NULL DEFAULT 0,
  UNIQUE(kurs_id, modul_id)
);

-- ── TABELL 9: modul_leksjon_kobling ─────────────────────────────────────────

CREATE TABLE modul_leksjon_kobling (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  modul_id UUID REFERENCES innhold_modul(id) ON DELETE CASCADE NOT NULL,
  leksjon_id UUID REFERENCES innhold_leksjon(id) ON DELETE CASCADE NOT NULL,
  rekkefolge INTEGER NOT NULL DEFAULT 0,
  UNIQUE(modul_id, leksjon_id)
);

-- ── TABELL 10: klasse ────────────────────────────────────────────────────────

CREATE TABLE klasse (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kurs_id UUID REFERENCES kurs(id) NOT NULL,
  tittel TEXT NOT NULL,
  kommunenummer TEXT,
  sted TEXT,
  start_dato DATE NOT NULL,
  slutt_dato DATE NOT NULL,
  maks_deltakere INTEGER,
  finansieringskilde TEXT,
  status TEXT CHECK (status IN ('planlagt','aktiv','avsluttet','avlyst'))
    DEFAULT 'planlagt',
  prismodell TEXT CHECK (prismodell IN ('engangsbetaling','abonnement'))
    DEFAULT 'engangsbetaling',
  pris INTEGER DEFAULT 0,
  gratis BOOLEAN DEFAULT false,
  rullerende_oppstart BOOLEAN DEFAULT false,
  opprettet_dato TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_klasse_kurs ON klasse(kurs_id);
CREATE INDEX idx_klasse_status ON klasse(status);

-- ── TABELL 11: klasse_rolle ──────────────────────────────────────────────────

CREATE TABLE klasse_rolle (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  klasse_id UUID REFERENCES klasse(id) ON DELETE CASCADE NOT NULL,
  bruker_id UUID REFERENCES bruker(id) ON DELETE CASCADE NOT NULL,
  rolle TEXT CHECK (rolle IN ('laerer','dagmentor','kveldsmentor',
    'ekstern_sensor','admin')) NOT NULL,
  UNIQUE(klasse_id, bruker_id, rolle)
);

-- ── TABELL 12: samling ───────────────────────────────────────────────────────

CREATE TABLE samling (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  klasse_id UUID REFERENCES klasse(id) ON DELETE CASCADE NOT NULL,
  type TEXT CHECK (type IN ('fysisk','virtuell','discord','asynkron')) NOT NULL,
  dato_tid TIMESTAMPTZ NOT NULL,
  varighet_timer DECIMAL NOT NULL,
  sted_eller_lenke TEXT,
  status TEXT CHECK (status IN ('planlagt','gjennomfort','avlyst'))
    DEFAULT 'planlagt',
  notat TEXT
);

-- ── TABELL 13: paamelding ────────────────────────────────────────────────────

CREATE TABLE paamelding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bruker_id UUID REFERENCES bruker(id) NOT NULL,
  klasse_id UUID REFERENCES klasse(id) NOT NULL,
  paameldt_dato TIMESTAMPTZ DEFAULT now(),
  individuell_startdato DATE,
  tilgang_til DATE NOT NULL,
  status TEXT CHECK (status IN ('venteliste','paameldt','aktiv','droppet',
    'aldri_mott','selvstudie','fullfort','avbrutt')) DEFAULT 'paameldt',
  venteliste_prioritet INTEGER,
  betaling_status TEXT CHECK (betaling_status IN
    ('ikke_betalt','betalt','fakturert','fritatt','reservert'))
    DEFAULT 'ikke_betalt',
  fullfort_dato DATE,
  UNIQUE(bruker_id, klasse_id)
);

CREATE INDEX idx_paamelding_bruker ON paamelding(bruker_id);
CREATE INDEX idx_paamelding_klasse ON paamelding(klasse_id);
CREATE INDEX idx_paamelding_status ON paamelding(status);

-- ── TABELL 14: leksjon_progresjon ────────────────────────────────────────────

CREATE TABLE leksjon_progresjon (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paamelding_id UUID REFERENCES paamelding(id) ON DELETE CASCADE NOT NULL,
  leksjon_id UUID REFERENCES innhold_leksjon(id) NOT NULL,
  status TEXT CHECK (status IN ('ikke_startet','paabegynt','fullfort'))
    DEFAULT 'ikke_startet',
  blokk_status JSONB DEFAULT '{}',
  score INTEGER CHECK (score >= 0 AND score <= 100),
  tid_brukt_sekunder INTEGER DEFAULT 0,
  sist_aktiv_dato TIMESTAMPTZ,
  startet_dato TIMESTAMPTZ,
  UNIQUE(paamelding_id, leksjon_id)
);

CREATE INDEX idx_progresjon_paamelding ON leksjon_progresjon(paamelding_id);

-- ── TABELL 15: leksjon_besvarelse ────────────────────────────────────────────

CREATE TABLE leksjon_besvarelse (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  progresjon_id UUID REFERENCES leksjon_progresjon(id) ON DELETE CASCADE NOT NULL,
  oppgave_snapshot JSONB NOT NULL,
  svar JSONB NOT NULL,
  innlevert_dato TIMESTAMPTZ DEFAULT now(),
  score INTEGER,
  vurderingsmodus TEXT CHECK (vurderingsmodus IN ('auto','ki','laerer','ki_laerer'))
    DEFAULT 'auto',
  oppgave_status TEXT CHECK (oppgave_status IN ('ikke_startet','paabegynt',
    'levert','tilbakemelding','godkjent','avvist','auto_godkjent'))
    DEFAULT 'levert'
);

-- ── TABELL 16: xp_konfigurasjon ──────────────────────────────────────────────

CREATE TABLE xp_konfigurasjon (
  handling TEXT PRIMARY KEY,
  xp_verdi INTEGER NOT NULL,
  andre_forsok_prosent INTEGER DEFAULT 50,
  sist_endret_av UUID REFERENCES bruker(id)
);

INSERT INTO xp_konfigurasjon (handling, xp_verdi) VALUES
  ('tekst_lest', 10),
  ('video_sett', 15),
  ('multiple_choice_riktig', 20),
  ('h5p_fullfort', 15),
  ('leksjon_fullfort_bonus', 25),
  ('modul_fullfort_bonus', 100),
  ('kurs_fullfort_bonus', 500);

-- ── TABELL 17: level_terskel ─────────────────────────────────────────────────

CREATE TABLE level_terskel (
  level INTEGER PRIMARY KEY,
  xp_paakrevd INTEGER NOT NULL
);

INSERT INTO level_terskel (level, xp_paakrevd) VALUES
  (1, 0), (2, 500), (3, 1500), (4, 3500), (5, 7000),
  (6, 12000), (7, 20000), (8, 32000), (9, 50000), (10, 75000);

-- ── TABELL 18: bruker_streak ─────────────────────────────────────────────────

CREATE TABLE bruker_streak (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bruker_id UUID REFERENCES bruker(id) ON DELETE CASCADE NOT NULL,
  dato DATE NOT NULL,
  xp_opptjent INTEGER DEFAULT 0,
  streak_frys_brukt BOOLEAN DEFAULT false,
  UNIQUE(bruker_id, dato)
);

CREATE INDEX idx_streak_bruker ON bruker_streak(bruker_id);

-- ── TABELL 19: audit_log ─────────────────────────────────────────────────────

CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tabell_navn TEXT NOT NULL,
  rad_id UUID NOT NULL,
  felt_navn TEXT,
  gammel_verdi TEXT,
  ny_verdi TEXT,
  endret_av UUID REFERENCES bruker(id),
  endret_dato TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_audit_rad ON audit_log(tabell_navn, rad_id);

-- ── ROW LEVEL SECURITY ───────────────────────────────────────────────────────

ALTER TABLE bruker ENABLE ROW LEVEL SECURITY;
ALTER TABLE bruker_auth_provider ENABLE ROW LEVEL SECURITY;
ALTER TABLE bruker_rolle ENABLE ROW LEVEL SECURITY;
ALTER TABLE kurs ENABLE ROW LEVEL SECURITY;
ALTER TABLE klasse ENABLE ROW LEVEL SECURITY;
ALTER TABLE klasse_rolle ENABLE ROW LEVEL SECURITY;
ALTER TABLE innhold_modul ENABLE ROW LEVEL SECURITY;
ALTER TABLE innhold_leksjon ENABLE ROW LEVEL SECURITY;
ALTER TABLE paamelding ENABLE ROW LEVEL SECURITY;
ALTER TABLE leksjon_progresjon ENABLE ROW LEVEL SECURITY;
ALTER TABLE leksjon_besvarelse ENABLE ROW LEVEL SECURITY;
ALTER TABLE samling ENABLE ROW LEVEL SECURITY;
ALTER TABLE xp_konfigurasjon ENABLE ROW LEVEL SECURITY;
ALTER TABLE bruker_streak ENABLE ROW LEVEL SECURITY;
ALTER TABLE level_terskel ENABLE ROW LEVEL SECURITY;
ALTER TABLE kurs_modul_kobling ENABLE ROW LEVEL SECURITY;
ALTER TABLE modul_leksjon_kobling ENABLE ROW LEVEL SECURITY;

-- Bruker: lese og oppdatere seg selv
CREATE POLICY bruker_se_selv ON bruker
  FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY bruker_oppdater_selv ON bruker
  FOR UPDATE USING (auth.uid()::text = id::text);

-- Bruker kan opprette sin egen brukerrad etter registrering
CREATE POLICY bruker_insert_egne ON bruker
  FOR INSERT WITH CHECK (auth.uid()::text = id::text);

-- Alle autentiserte kan se publiserte kurs
CREATE POLICY kurs_se_aktive ON kurs
  FOR SELECT USING (aktiv = true);

-- Alle autentiserte kan se publiserte leksjoner
CREATE POLICY leksjon_se_publiserte ON innhold_leksjon
  FOR SELECT USING (status = 'publisert');

-- Bruker kan se egne påmeldinger
CREATE POLICY paamelding_se_egne ON paamelding
  FOR SELECT USING (auth.uid()::text = bruker_id::text);

-- Bruker kan se egne progresjoner
CREATE POLICY progresjon_se_egne ON leksjon_progresjon
  FOR SELECT USING (
    paamelding_id IN (
      SELECT id FROM paamelding WHERE bruker_id::text = auth.uid()::text
    )
  );

-- Bruker kan oppdatere egne progresjoner
CREATE POLICY progresjon_oppdater_egne ON leksjon_progresjon
  FOR UPDATE USING (
    paamelding_id IN (
      SELECT id FROM paamelding WHERE bruker_id::text = auth.uid()::text
    )
  );

-- Bruker kan opprette egne progresjonsrader
CREATE POLICY progresjon_insert_egne ON leksjon_progresjon
  FOR INSERT WITH CHECK (
    paamelding_id IN (
      SELECT id FROM paamelding WHERE bruker_id::text = auth.uid()::text
    )
  );

-- Bruker kan opprette egne besvarelser
CREATE POLICY besvarelse_opprett_egne ON leksjon_besvarelse
  FOR INSERT WITH CHECK (
    progresjon_id IN (
      SELECT lp.id FROM leksjon_progresjon lp
      JOIN paamelding p ON lp.paamelding_id = p.id
      WHERE p.bruker_id::text = auth.uid()::text
    )
  );

-- Bruker kan se egne besvarelser
CREATE POLICY besvarelse_se_egne ON leksjon_besvarelse
  FOR SELECT USING (
    progresjon_id IN (
      SELECT lp.id FROM leksjon_progresjon lp
      JOIN paamelding p ON lp.paamelding_id = p.id
      WHERE p.bruker_id::text = auth.uid()::text
    )
  );

-- Bruker kan se egne streaks
CREATE POLICY streak_se_egne ON bruker_streak
  FOR SELECT USING (auth.uid()::text = bruker_id::text);

-- Bruker kan se sin egen auth provider kobling
CREATE POLICY auth_provider_se_egne ON bruker_auth_provider
  FOR SELECT USING (auth.uid()::text = bruker_id::text);

-- Bruker kan opprette egne auth provider koblinger
CREATE POLICY auth_provider_insert_egne ON bruker_auth_provider
  FOR INSERT WITH CHECK (auth.uid()::text = bruker_id::text);

-- Bruker kan se sine egne roller
CREATE POLICY bruker_rolle_se_egne ON bruker_rolle
  FOR SELECT USING (auth.uid()::text = bruker_id::text);

-- Bruker kan tildele seg selv deltaker-rollen ved registrering
CREATE POLICY bruker_rolle_insert_deltaker ON bruker_rolle
  FOR INSERT WITH CHECK (
    auth.uid()::text = bruker_id::text AND
    rolle_id IN (SELECT id FROM rolle_definisjon WHERE navn = 'deltaker')
  );

-- XP-konfigurasjon og level-terskler er lesbare for alle autentiserte
CREATE POLICY xp_les ON xp_konfigurasjon FOR SELECT USING (true);
CREATE POLICY level_les ON level_terskel FOR SELECT USING (true);

-- Moduler og koblingstabeller er lesbare for alle autentiserte
CREATE POLICY modul_les ON innhold_modul FOR SELECT USING (true);
CREATE POLICY kurs_modul_les ON kurs_modul_kobling FOR SELECT USING (true);
CREATE POLICY modul_leksjon_les ON modul_leksjon_kobling FOR SELECT USING (true);

-- ── STORAGE BUCKETS ──────────────────────────────────────────────────────────
-- Kjøres kun hvis storage-utvidelsen er aktivert i prosjektet

INSERT INTO storage.buckets (id, name, public)
VALUES
  ('h5p', 'h5p', true),
  ('media', 'media', true),
  ('kursbevis', 'kursbevis', false)
ON CONFLICT (id) DO NOTHING;

-- H5P: alle autentiserte kan laste opp og alle kan lese
CREATE POLICY "h5p_upload" ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'h5p');

CREATE POLICY "h5p_read" ON storage.objects FOR SELECT
  USING (bucket_id = 'h5p');

-- Media: alle kan lese, autentiserte kan laste opp
CREATE POLICY "media_read" ON storage.objects FOR SELECT
  USING (bucket_id = 'media');

CREATE POLICY "media_upload" ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'media');

-- Kursbevis: kun eier kan lese
CREATE POLICY "kursbevis_se_egne" ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'kursbevis' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
