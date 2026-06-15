CREATE TABLE samling_oppmote (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  samling_id UUID REFERENCES samling(id) ON DELETE CASCADE NOT NULL,
  bruker_id UUID REFERENCES bruker(id) NOT NULL,
  status TEXT CHECK (status IN ('tilstede','ukjent_fravaer','jobb','godkjent_fravaer')) NOT NULL,
  notat TEXT,
  registrert_dato TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(samling_id, bruker_id)
);

ALTER TABLE samling_oppmote ENABLE ROW LEVEL SECURITY;
