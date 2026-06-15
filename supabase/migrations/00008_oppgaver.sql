-- Storage buckets for file uploads
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('oppgave-filer', 'oppgave-filer', true),
  ('innlevering-filer', 'innlevering-filer', false)
ON CONFLICT (id) DO NOTHING;

-- Teacher-created assignments linked to a samling
CREATE TABLE oppgave (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  samling_id UUID REFERENCES samling(id) ON DELETE CASCADE NOT NULL,
  klasse_id UUID REFERENCES klasse(id) ON DELETE CASCADE NOT NULL,
  tittel TEXT NOT NULL,
  beskrivelse TEXT,
  fil_url TEXT,
  opprettet_av UUID REFERENCES bruker(id) NOT NULL,
  opprettet_dato TIMESTAMPTZ DEFAULT NOW()
);

-- Student submissions — one per (oppgave, bruker)
CREATE TABLE oppgave_innlevering (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  oppgave_id UUID REFERENCES oppgave(id) ON DELETE CASCADE NOT NULL,
  bruker_id UUID REFERENCES bruker(id) NOT NULL,
  innhold_tekst TEXT,
  fil_url TEXT,
  innlevert_dato TIMESTAMPTZ DEFAULT NOW(),
  tilbakemelding_tekst TEXT,
  tilbakemelding_dato TIMESTAMPTZ,
  status TEXT CHECK (status IN ('levert', 'rettet')) NOT NULL DEFAULT 'levert',
  UNIQUE(oppgave_id, bruker_id)
);

CREATE INDEX idx_oppgave_samling ON oppgave(samling_id);
CREATE INDEX idx_oppgave_klasse ON oppgave(klasse_id);
CREATE INDEX idx_innlevering_oppgave ON oppgave_innlevering(oppgave_id);
CREATE INDEX idx_innlevering_bruker ON oppgave_innlevering(bruker_id);

ALTER TABLE oppgave ENABLE ROW LEVEL SECURITY;
ALTER TABLE oppgave_innlevering ENABLE ROW LEVEL SECURITY;
