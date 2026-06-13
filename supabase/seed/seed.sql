-- Seed-data for dev-miljø
-- Kjøres KUN mot lokal/dev Supabase-instans

-- ── Testbrukere ───────────────────────────────────────────────────────────────

INSERT INTO bruker (id, navn, epost) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Test Admin', 'admin@aftenskolen.no'),
  ('00000000-0000-0000-0000-000000000002', 'Test Deltaker', 'deltaker@test.no');

INSERT INTO bruker_auth_provider (bruker_id, provider, provider_sub) VALUES
  ('00000000-0000-0000-0000-000000000001', 'epost', 'admin@aftenskolen.no'),
  ('00000000-0000-0000-0000-000000000002', 'epost', 'deltaker@test.no');

INSERT INTO bruker_rolle (bruker_id, rolle_id, status)
  SELECT '00000000-0000-0000-0000-000000000001', id, 'aktiv'
  FROM rolle_definisjon WHERE navn = 'superadmin';

INSERT INTO bruker_rolle (bruker_id, rolle_id, status)
  SELECT '00000000-0000-0000-0000-000000000002', id, 'aktiv'
  FROM rolle_definisjon WHERE navn = 'deltaker';

-- ── Testkurs ─────────────────────────────────────────────────────────────────

INSERT INTO kurs (id, tittel, beskrivelse, slug, kurstype, cefr_nivaa, forside_prioritet, aktiv) VALUES
  ('10000000-0000-0000-0000-000000000001',
   '{"no": "Norsk A1 – Nybegynner"}',
   '{"no": "Grunnleggende norskopplæring for nybegynnere. Lær å presentere deg, handle på butikken og snakke om hverdagen."}',
   'norsk-a1', 'norsk', 'A1', 1, true),
  ('10000000-0000-0000-0000-000000000002',
   '{"no": "Fagbrev i barne- og ungdomsarbeid"}',
   '{"no": "Fagopplæring for praksiskandidater innen barne- og ungdomsarbeid."}',
   'fagbrev-bua', 'fagbrev', 'ingen', 2, true);

-- ── Moduler for Norsk A1 ──────────────────────────────────────────────────────

INSERT INTO innhold_modul (id, tittel, beskrivelse) VALUES
  ('20000000-0000-0000-0000-000000000001',
   '{"no": "Modul 1 – Hilse og presentere seg"}',
   '{"no": "Lær å hilse, si navnet ditt og fortelle hvor du kommer fra."}'),
  ('20000000-0000-0000-0000-000000000002',
   '{"no": "Modul 2 – Tall og tid"}',
   '{"no": "Lær tallene 1-100, klokkeslett og ukedager."}');

INSERT INTO kurs_modul_kobling (kurs_id, modul_id, rekkefolge) VALUES
  ('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 1),
  ('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', 2);

-- ── Leksjoner for Modul 1 ─────────────────────────────────────────────────────

INSERT INTO innhold_leksjon (id, tittel, beskrivelse, status, estimert_tid_min, innhold_blokker) VALUES
  ('30000000-0000-0000-0000-000000000001',
   '{"no": "Hei, jeg heter..."}',
   '{"no": "Lær å presentere deg selv på norsk."}',
   'publisert', 10,
   '[
     {
       "id": "blokk-1",
       "type": "tekst",
       "paakrevd": false,
       "data": {
         "innhold": {"no": "<h2>Hei!</h2><p>I denne leksjonen lærer du å presentere deg selv. Du lærer å si:</p><ul><li>Hei, jeg heter...</li><li>Jeg kommer fra...</li><li>Jeg bor i...</li></ul>"}
       }
     },
     {
       "id": "blokk-2",
       "type": "video",
       "paakrevd": true,
       "data": {
         "url": "https://www.youtube.com/embed/dQw4w9WgXcQ",
         "tekstingsfil_url": null,
         "fullfor_prosent": 80
       }
     },
     {
       "id": "blokk-3",
       "type": "multiple_choice",
       "paakrevd": true,
       "data": {
         "sporsmaal": {"no": "Hva betyr «Jeg heter»?"},
         "alternativer": [
           {"id": "a", "tekst": {"no": "My name is"}, "riktig": true},
           {"id": "b", "tekst": {"no": "I live in"}, "riktig": false},
           {"id": "c", "tekst": {"no": "I come from"}, "riktig": false}
         ],
         "forklaring_ved_feil": {"no": "«Jeg heter» betyr «My name is» på engelsk."},
         "antall_forsok": 3
       }
     }
   ]'::jsonb),
  ('30000000-0000-0000-0000-000000000002',
   '{"no": "Hvor kommer du fra?"}',
   '{"no": "Lær å fortelle om hjemland og nasjonalitet."}',
   'publisert', 15,
   '[
     {
       "id": "blokk-1",
       "type": "tekst",
       "paakrevd": false,
       "data": {
         "innhold": {"no": "<h2>Land og nasjonalitet</h2><p>Nå skal du lære å fortelle hvor du kommer fra.</p><p><strong>Eksempler:</strong></p><ul><li>Jeg kommer fra Syria. Jeg er syrisk.</li><li>Jeg kommer fra Somalia. Jeg er somalisk.</li><li>Jeg kommer fra Ukraina. Jeg er ukrainsk.</li></ul>"}
       }
     },
     {
       "id": "blokk-2",
       "type": "multiple_choice",
       "paakrevd": true,
       "data": {
         "sporsmaal": {"no": "Fyll inn: Jeg kommer fra Eritrea. Jeg er ___"},
         "alternativer": [
           {"id": "a", "tekst": {"no": "eritreisk"}, "riktig": true},
           {"id": "b", "tekst": {"no": "eritreansk"}, "riktig": false},
           {"id": "c", "tekst": {"no": "eritrer"}, "riktig": false}
         ],
         "forklaring_ved_feil": {"no": "Riktig form er «eritreisk»."},
         "antall_forsok": 3
       }
     }
   ]'::jsonb);

INSERT INTO modul_leksjon_kobling (modul_id, leksjon_id, rekkefolge) VALUES
  ('20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 1),
  ('20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', 2);

-- ── Testklasse ────────────────────────────────────────────────────────────────

INSERT INTO klasse (id, kurs_id, tittel, sted, start_dato, slutt_dato, status, gratis) VALUES
  ('40000000-0000-0000-0000-000000000001',
   '10000000-0000-0000-0000-000000000001',
   'Norsk A1 – Kristiansand H26',
   'Kristiansand', '2026-08-01', '2026-12-31', 'aktiv', true);

-- ── Påmelding ─────────────────────────────────────────────────────────────────

INSERT INTO paamelding (bruker_id, klasse_id, tilgang_til, status, betaling_status) VALUES
  ('00000000-0000-0000-0000-000000000002',
   '40000000-0000-0000-0000-000000000001',
   '2026-12-31', 'aktiv', 'fritatt');
