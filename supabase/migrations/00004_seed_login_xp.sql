-- Legg til daglig innlogging som XP-handling
INSERT INTO xp_konfigurasjon (handling, xp_verdi)
VALUES ('daglig_innlogging', 5)
ON CONFLICT (handling) DO NOTHING;
