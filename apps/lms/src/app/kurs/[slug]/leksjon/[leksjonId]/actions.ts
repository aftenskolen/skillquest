"use server";

import { hentInnloggetBruker } from "@novolms/auth";
import { createServerClient } from "@novolms/db/server";

export async function oppdaterBlokkStatus(
  progresjonId: string,
  blokkId: string,
  alleKrevdeBlokkIds: string[]
): Promise<void> {
  const db = createServerClient();

  const { data: eksisterende } = await db
    .from("leksjon_progresjon")
    .select("blokk_status, status, leksjon_id, paamelding_id")
    .eq("id", progresjonId)
    .single();

  if (!eksisterende) return;

  const varTidligereFullfort = eksisterende.status === "fullfort";

  const blokkStatus: Record<string, "ikke_startet" | "fullfort"> = {
    ...(eksisterende.blokk_status ?? {}),
    [blokkId]: "fullfort",
  };

  const alleFullfort = alleKrevdeBlokkIds.every((id) => blokkStatus[id] === "fullfort");

  await db
    .from("leksjon_progresjon")
    .update({
      blokk_status: blokkStatus,
      status: alleFullfort ? "fullfort" : "paabegynt",
      sist_aktiv_dato: new Date().toISOString(),
    })
    .eq("id", progresjonId);

  // Tildel XP kun første gang leksjonen fullføres
  if (alleFullfort && !varTidligereFullfort) {
    const [{ data: leksjon }, { data: paamelding }] = await Promise.all([
      db.from("innhold_leksjon").select("xp_verdi").eq("id", eksisterende.leksjon_id).single(),
      db.from("paamelding").select("bruker_id").eq("id", eksisterende.paamelding_id).single(),
    ]);

    if (leksjon && paamelding) {
      const iDag = new Date().toISOString().slice(0, 10);
      const { data: eksisterendeStreak } = await db
        .from("bruker_streak")
        .select("id, xp_opptjent")
        .eq("bruker_id", paamelding.bruker_id)
        .eq("dato", iDag)
        .maybeSingle();

      if (eksisterendeStreak) {
        await db
          .from("bruker_streak")
          .update({ xp_opptjent: eksisterendeStreak.xp_opptjent + leksjon.xp_verdi })
          .eq("id", eksisterendeStreak.id);
      } else {
        await db.from("bruker_streak").insert({
          bruker_id: paamelding.bruker_id,
          dato: iDag,
          xp_opptjent: leksjon.xp_verdi,
          streak_frys_brukt: false,
        });
      }
    }
  }
}

export async function nullstillProgresjonAction(progresjonId: string): Promise<void> {
  const brukerData = await hentInnloggetBruker();
  if (!brukerData) return;

  const db = createServerClient();

  // Verify this progresjon belongs to the current user
  const { data: prog } = await db
    .from("leksjon_progresjon")
    .select("id, paamelding(bruker_id)")
    .eq("id", progresjonId)
    .single();

  const paamelding = (prog as unknown as { paamelding: { bruker_id: string } | null } | null)?.paamelding;
  if (!paamelding || paamelding.bruker_id !== brukerData.bruker.id) return;

  await db.from("leksjon_besvarelse").delete().eq("progresjon_id", progresjonId);
  await db.from("leksjon_progresjon").update({
    status: "ikke_startet",
    blokk_status: {},
    sist_aktiv_dato: null,
    startet_dato: null,
    tid_brukt_sekunder: 0,
    score: null,
  }).eq("id", progresjonId);
}

export async function lagreBesvarelseAction(
  progresjonId: string,
  blokkId: string,
  snapshot: Record<string, unknown>,
  svar: Record<string, unknown>,
  riktig: boolean
): Promise<void> {
  const db = createServerClient();
  await db.from("leksjon_besvarelse").insert({
    progresjon_id: progresjonId,
    oppgave_snapshot: { blokk_id: blokkId, ...snapshot },
    svar,
    score: riktig ? 1 : 0,
    vurderingsmodus: "auto",
    oppgave_status: riktig ? "auto_godkjent" : "avvist",
  });
}

export async function hentEllerOpprettProgresjon(
  leksjonId: string,
  kursSlug: string
): Promise<string | null> {
  const brukerData = await hentInnloggetBruker();
  if (!brukerData) return null;

  const db = createServerClient();

  const { data: paamelding } = await db
    .from("paamelding")
    .select("id, klasse(kurs(slug))")
    .eq("bruker_id", brukerData.bruker.id)
    .in("status", ["aktiv", "paameldt"])
    .limit(10);

  const riktigPaamelding = (paamelding ?? []).find((p) => {
    const klasse = p.klasse as unknown as { kurs: { slug: string } | null } | null;
    return klasse?.kurs?.slug === kursSlug;
  });

  if (!riktigPaamelding) return null;

  const { data: eksisterende } = await db
    .from("leksjon_progresjon")
    .select("id")
    .eq("paamelding_id", riktigPaamelding.id)
    .eq("leksjon_id", leksjonId)
    .maybeSingle();

  if (eksisterende) return eksisterende.id;

  const { data: ny } = await db
    .from("leksjon_progresjon")
    .insert({
      paamelding_id: riktigPaamelding.id,
      leksjon_id: leksjonId,
      status: "paabegynt",
      blokk_status: {},
      tid_brukt_sekunder: 0,
      startet_dato: new Date().toISOString(),
      sist_aktiv_dato: new Date().toISOString(),
    })
    .select("id")
    .single();

  return ny?.id ?? null;
}
