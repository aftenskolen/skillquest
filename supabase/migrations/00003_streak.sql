-- Spor om daglig innlogging-XP er tildelt for denne streak-raden
ALTER TABLE bruker_streak
  ADD COLUMN IF NOT EXISTS innlogging_tildelt BOOLEAN NOT NULL DEFAULT false;

-- Legg til daglig innlogging som XP-handling
INSERT INTO xp_konfigurasjon (handling, xp_verdi)
VALUES ('daglig_innlogging', 5)
ON CONFLICT (handling) DO NOTHING;
