"use server";

import { hentInnloggetBruker } from "@novolms/auth";
import { createServerClient } from "@novolms/db/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function sendSvarAction(formData: FormData) {
  const brukerData = await hentInnloggetBruker().catch(() => null);
  if (!brukerData) redirect("/auth/logg-inn");

  const supabase = createServerClient();
  const tradId = formData.get("trad_id") as string;
  const innhold = formData.get("innhold") as string;

  if (!tradId || !innhold.trim()) return;

  const { data: trad } = await supabase
    .from("melding_trad")
    .select("id")
    .eq("id", tradId)
    .eq("deltaker_id", brukerData.bruker.id)
    .maybeSingle();

  if (!trad) return;

  await supabase.from("melding").insert({
    trad_id: tradId,
    fra_bruker_id: brukerData.bruker.id,
    innhold: innhold.trim(),
  });

  revalidatePath(`/meldinger/${tradId}`);
}

export async function markerLestAction(tradId: string, brukerId: string) {
  const supabase = createServerClient();
  const now = new Date().toISOString();

  await supabase
    .from("melding")
    .update({ lest_dato: now })
    .eq("trad_id", tradId)
    .is("lest_dato", null)
    .neq("fra_bruker_id", brukerId);
}
