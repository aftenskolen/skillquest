-- ── XP per leksjon ───────────────────────────────────────────────────────────
ALTER TABLE innhold_leksjon
  ADD COLUMN IF NOT EXISTS xp_verdi INTEGER NOT NULL DEFAULT 10;

-- ── Oppdater level_terskel: 100 XP per nivå ──────────────────────────────────
DELETE FROM level_terskel;

INSERT INTO level_terskel (level, xp_paakrevd) VALUES
  (1, 0),    (2, 100),  (3, 200),  (4, 300),  (5, 400),
  (6, 500),  (7, 600),  (8, 700),  (9, 800),  (10, 900),
  (11, 1000),(12, 1100),(13, 1200),(14, 1300),(15, 1400),
  (16, 1500),(17, 1600),(18, 1700),(19, 1800),(20, 1900);
