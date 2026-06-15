"use server";

import { hentInnloggetBruker } from "@novolms/auth";
import { createServerClient } from "@novolms/db/server";
import { redirect } from "next/navigation";

export async function sendNyMeldingAction(formData: FormData) {
  const brukerData = await hentInnloggetBruker().catch(() => null);
  if (!brukerData) redirect("/auth/logg-inn");

  const supabase = createServerClient();
  const klasseId = formData.get("klasse_id") as string;
  const innhold = formData.get("innhold") as string;
  const deltakerIder = formData.getAll("deltaker_ider") as string[];

  if (!klasseId || !innhold.trim() || deltakerIder.length === 0) {
    redirect("/dialog/ny?error=mangler_felt");
  }

  const { data: klRolle } = await supabase
    .from("klasse_rolle")
    .select("id")
    .eq("klasse_id", klasseId)
    .eq("bruker_id", brukerData.bruker.id)
    .maybeSingle();

  if (!klRolle) redirect("/dialog/ny?error=ingen_tilgang");

  let forsteTradId: string | null = null;

  for (const deltakerBrukerId of deltakerIder) {
    const { data: eksisterende } = await supabase
      .from("melding_trad")
      .select("id")
      .eq("klasse_id", klasseId)
      .eq("laerer_id", brukerData.bruker.id)
      .eq("deltaker_id", deltakerBrukerId)
      .maybeSingle();

    let tradId: string;

    if (eksisterende) {
      tradId = eksisterende.id;
    } else {
      const { data: nyTrad, error } = await supabase
        .from("melding_trad")
        .insert({
          klasse_id: klasseId,
          laerer_id: brukerData.bruker.id,
          deltaker_id: deltakerBrukerId,
        })
        .select("id")
        .single();

      if (error || !nyTrad) continue;
      tradId = nyTrad.id;
    }

    await supabase.from("melding").insert({
      trad_id: tradId,
      fra_bruker_id: brukerData.bruker.id,
      innhold: innhold.trim(),
    });

    if (!forsteTradId) forsteTradId = tradId;
  }

  redirect(forsteTradId ? `/dialog/${forsteTradId}` : "/dialog");
}
