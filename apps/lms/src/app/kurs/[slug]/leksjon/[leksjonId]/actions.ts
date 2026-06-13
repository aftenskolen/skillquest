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
    .select("blokk_status")
    .eq("id", progresjonId)
    .single();

  const blokkStatus: Record<string, "ikke_startet" | "fullfort"> = {
    ...(eksisterende?.blokk_status ?? {}),
    [blokkId]: "fullfort",
  };

  const alleFullfort = alleKrevdeBlokkIds.every((id) => blokkStatus[id] === "fullfort");

  await db
    .from("leksjon_progresjon")
    .update({
      blokk_status: blokkStatus,
      status: alleFullfort ? "fullfort" : "paabegynt",
      sist_aktiv_dato: new Date().toISOString(),
      ...(alleFullfort ? {} : {}),
    })
    .eq("id", progresjonId);
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
