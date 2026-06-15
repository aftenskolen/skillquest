-- Én tråd per (klasse, lærer, deltaker) — individuelle samtaler
CREATE TABLE melding_trad (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  klasse_id UUID REFERENCES klasse(id) ON DELETE CASCADE NOT NULL,
  laerer_id UUID REFERENCES bruker(id) NOT NULL,
  deltaker_id UUID REFERENCES bruker(id) NOT NULL,
  opprettet_dato TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(klasse_id, laerer_id, deltaker_id)
);

CREATE TABLE melding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trad_id UUID REFERENCES melding_trad(id) ON DELETE CASCADE NOT NULL,
  fra_bruker_id UUID REFERENCES bruker(id) NOT NULL,
  innhold TEXT NOT NULL,
  sendt_dato TIMESTAMPTZ DEFAULT NOW(),
  lest_dato TIMESTAMPTZ
);

CREATE INDEX idx_melding_trad_id ON melding(trad_id, sendt_dato);
CREATE INDEX idx_melding_trad_deltaker ON melding_trad(deltaker_id);
CREATE INDEX idx_melding_trad_laerer ON melding_trad(laerer_id);
CREATE INDEX idx_melding_ulest ON melding(trad_id) WHERE lest_dato IS NULL;

ALTER TABLE melding_trad ENABLE ROW LEVEL SECURITY;
ALTER TABLE melding ENABLE ROW LEVEL SECURITY;
