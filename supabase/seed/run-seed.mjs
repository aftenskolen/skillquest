// Kjøres med: node supabase/seed/run-seed.mjs
// Krever at NEXT_PUBLIC_SUPABASE_URL og SUPABASE_SERVICE_ROLE_KEY er satt

import { createClient } from "/Users/benjamingronvold/skillquest/node_modules/.pnpm/@supabase+supabase-js@2.108.1/node_modules/@supabase/supabase-js/dist/index.mjs";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Sett NEXT_PUBLIC_SUPABASE_URL og SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const db = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function seed() {
  console.log("Starter seed...");

  const ADMIN_ID = "55e17fe9-ed6d-4d3e-b2ed-53a2ceed5fe8";
  const DELTAKER_ID = "65fff318-63af-4b97-9a73-a9f36b87534a";

  // Brukere
  const { error: e1 } = await db.from("bruker").upsert([
    { id: ADMIN_ID, navn: "Test Admin", epost: "admin@aftenskolen.no" },
    { id: DELTAKER_ID, navn: "Test Deltaker", epost: "deltaker@test.no" },
  ], { onConflict: "id" });
  if (e1) { console.error("bruker:", e1.message); } else { console.log("bruker OK"); }

  // Auth providers
  const { error: e2 } = await db.from("bruker_auth_provider").upsert([
    { bruker_id: ADMIN_ID, provider: "epost", provider_sub: "admin@aftenskolen.no" },
    { bruker_id: DELTAKER_ID, provider: "epost", provider_sub: "deltaker@test.no" },
  ], { onConflict: "provider,provider_sub" });
  if (e2) { console.error("bruker_auth_provider:", e2.message); } else { console.log("bruker_auth_provider OK"); }

  // Roller
  const { data: roller } = await db.from("rolle_definisjon").select("id, navn");
  const superadmin = roller?.find((r) => r.navn === "superadmin");
  const deltaker = roller?.find((r) => r.navn === "deltaker");

  if (superadmin) {
    const { error: e3 } = await db.from("bruker_rolle").upsert(
      { bruker_id: ADMIN_ID, rolle_id: superadmin.id, status: "aktiv" },
      { onConflict: "bruker_id,rolle_id" }
    );
    if (e3) { console.error("bruker_rolle admin:", e3.message); } else { console.log("bruker_rolle superadmin OK"); }
  }

  if (deltaker) {
    const { error: e4 } = await db.from("bruker_rolle").upsert(
      { bruker_id: DELTAKER_ID, rolle_id: deltaker.id, status: "aktiv" },
      { onConflict: "bruker_id,rolle_id" }
    );
    if (e4) { console.error("bruker_rolle deltaker:", e4.message); } else { console.log("bruker_rolle deltaker OK"); }
  }

  // Kurs
  const { error: e5 } = await db.from("kurs").upsert([
    {
      id: "10000000-0000-0000-0000-000000000001",
      tittel: { no: "Norsk A1 – Nybegynner" },
      beskrivelse: { no: "Grunnleggende norskopplæring for nybegynnere." },
      slug: "norsk-a1", kurstype: "norsk", cefr_nivaa: "A1",
      forside_prioritet: 1, aktiv: true,
    },
    {
      id: "10000000-0000-0000-0000-000000000002",
      tittel: { no: "Fagbrev i barne- og ungdomsarbeid" },
      beskrivelse: { no: "Fagopplæring for praksiskandidater innen barne- og ungdomsarbeid." },
      slug: "fagbrev-bua", kurstype: "fagbrev", cefr_nivaa: "ingen",
      forside_prioritet: 2, aktiv: true,
    },
  ], { onConflict: "id" });
  if (e5) { console.error("kurs:", e5.message); } else { console.log("kurs OK"); }

  // Moduler
  const { error: e6 } = await db.from("innhold_modul").upsert([
    {
      id: "20000000-0000-0000-0000-000000000001",
      tittel: { no: "Modul 1 – Hilse og presentere seg" },
      beskrivelse: { no: "Lær å hilse, si navnet ditt og fortelle hvor du kommer fra." },
    },
    {
      id: "20000000-0000-0000-0000-000000000002",
      tittel: { no: "Modul 2 – Tall og tid" },
      beskrivelse: { no: "Lær tallene 1-100, klokkeslett og ukedager." },
    },
  ], { onConflict: "id" });
  if (e6) { console.error("innhold_modul:", e6.message); } else { console.log("innhold_modul OK"); }

  // Kurs-modul koblinger
  const { error: e7 } = await db.from("kurs_modul_kobling").upsert([
    { kurs_id: "10000000-0000-0000-0000-000000000001", modul_id: "20000000-0000-0000-0000-000000000001", rekkefolge: 1 },
    { kurs_id: "10000000-0000-0000-0000-000000000001", modul_id: "20000000-0000-0000-0000-000000000002", rekkefolge: 2 },
  ], { onConflict: "kurs_id,modul_id" });
  if (e7) { console.error("kurs_modul_kobling:", e7.message); } else { console.log("kurs_modul_kobling OK"); }

  // Leksjoner
  const { error: e8 } = await db.from("innhold_leksjon").upsert([
    {
      id: "30000000-0000-0000-0000-000000000001",
      tittel: { no: "Hei, jeg heter..." },
      beskrivelse: { no: "Lær å presentere deg selv på norsk." },
      status: "publisert",
      estimert_tid_min: 10,
      innhold_blokker: [
        {
          id: "blokk-1", type: "tekst", paakrevd: false,
          data: { innhold: { no: "<h2>Hei!</h2><p>I denne leksjonen lærer du å presentere deg selv.</p>" } },
        },
        {
          id: "blokk-2", type: "video", paakrevd: true,
          data: { url: "https://www.youtube.com/embed/dQw4w9WgXcQ", tekstingsfil_url: null, fullfor_prosent: 80 },
        },
        {
          id: "blokk-3", type: "multiple_choice", paakrevd: true,
          data: {
            sporsmaal: { no: "Hva betyr \"Jeg heter\"?" },
            alternativer: [
              { id: "a", tekst: { no: "My name is" }, riktig: true },
              { id: "b", tekst: { no: "I live in" }, riktig: false },
              { id: "c", tekst: { no: "I come from" }, riktig: false },
            ],
            forklaring_ved_feil: { no: "\"Jeg heter\" betyr \"My name is\" på engelsk." },
            antall_forsok: 3,
          },
        },
      ],
    },
    {
      id: "30000000-0000-0000-0000-000000000002",
      tittel: { no: "Hvor kommer du fra?" },
      beskrivelse: { no: "Lær å fortelle om hjemland og nasjonalitet." },
      status: "publisert",
      estimert_tid_min: 15,
      innhold_blokker: [
        {
          id: "blokk-1", type: "tekst", paakrevd: false,
          data: { innhold: { no: "<h2>Land og nasjonalitet</h2><p>Nå skal du lære å fortelle hvor du kommer fra.</p>" } },
        },
        {
          id: "blokk-2", type: "multiple_choice", paakrevd: true,
          data: {
            sporsmaal: { no: "Fyll inn: Jeg kommer fra Eritrea. Jeg er ___" },
            alternativer: [
              { id: "a", tekst: { no: "eritreisk" }, riktig: true },
              { id: "b", tekst: { no: "eritreansk" }, riktig: false },
              { id: "c", tekst: { no: "eritrer" }, riktig: false },
            ],
            forklaring_ved_feil: { no: "Riktig form er \"eritreisk\"." },
            antall_forsok: 3,
          },
        },
      ],
    },
  ], { onConflict: "id" });
  if (e8) { console.error("innhold_leksjon:", e8.message); } else { console.log("innhold_leksjon OK"); }

  // Modul-leksjon koblinger
  const { error: e9 } = await db.from("modul_leksjon_kobling").upsert([
    { modul_id: "20000000-0000-0000-0000-000000000001", leksjon_id: "30000000-0000-0000-0000-000000000001", rekkefolge: 1 },
    { modul_id: "20000000-0000-0000-0000-000000000001", leksjon_id: "30000000-0000-0000-0000-000000000002", rekkefolge: 2 },
  ], { onConflict: "modul_id,leksjon_id" });
  if (e9) { console.error("modul_leksjon_kobling:", e9.message); } else { console.log("modul_leksjon_kobling OK"); }

  // Klasse
  const { error: e10 } = await db.from("klasse").upsert({
    id: "40000000-0000-0000-0000-000000000001",
    kurs_id: "10000000-0000-0000-0000-000000000001",
    tittel: "Norsk A1 – Kristiansand H26",
    sted: "Kristiansand",
    start_dato: "2026-08-01",
    slutt_dato: "2026-12-31",
    status: "aktiv",
    gratis: true,
  }, { onConflict: "id" });
  if (e10) { console.error("klasse:", e10.message); } else { console.log("klasse OK"); }

  // Påmelding
  const { error: e11 } = await db.from("paamelding").upsert({
    bruker_id: DELTAKER_ID,
    klasse_id: "40000000-0000-0000-0000-000000000001",
    tilgang_til: "2026-12-31",
    status: "aktiv",
    betaling_status: "fritatt",
  }, { onConflict: "bruker_id,klasse_id" });
  if (e11) { console.error("paamelding:", e11.message); } else { console.log("paamelding OK"); }

  console.log("\nSeed ferdig!");
}

seed().catch(console.error);
