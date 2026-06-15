"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createServerClient } from "@novolms/db/server";
import { hentInnloggetBruker } from "@novolms/auth";

export async function nullstillLeksjonProgresjonAction(formData: FormData) {
  const brukerData = await hentInnloggetBruker();
  if (!brukerData) redirect("/auth/logg-inn");

  const db = createServerClient();
  const progresjonId = formData.get("progresjon_id") as string;
  const klasseId = formData.get("klasse_id") as string;
  const brukerId = formData.get("bruker_id") as string;

  // Verify teacher has access to this class
  const { data: rolle } = await db
    .from("klasse_rolle")
    .select("id")
    .eq("klasse_id", klasseId)
    .eq("bruker_id", brukerData.bruker.id)
    .single();

  if (!rolle) redirect("/");

  // Delete besvarelser first (FK constraint)
  await db.from("leksjon_besvarelse").delete().eq("progresjon_id", progresjonId);

  // Reset progresjon
  await db
    .from("leksjon_progresjon")
    .update({
      status: "ikke_startet",
      blokk_status: {},
      sist_aktiv_dato: null,
      startet_dato: null,
      tid_brukt_sekunder: 0,
      score: null,
    })
    .eq("id", progresjonId);

  revalidatePath(`/klasser/${klasseId}/deltaker/${brukerId}`);
  redirect(`/klasser/${klasseId}/deltaker/${brukerId}`);
}
