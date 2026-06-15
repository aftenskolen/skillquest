"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createServerClient } from "@novolms/db/server";
import { hentInnloggetBruker } from "@novolms/auth";

export async function oppdaterSamlingStatusAction(formData: FormData) {
  const brukerData = await hentInnloggetBruker();
  if (!brukerData) redirect("/auth/logg-inn");

  const db = createServerClient();
  const samlingId = formData.get("samling_id") as string;
  const klasseId = formData.get("klasse_id") as string;
  const nyStatus = formData.get("ny_status") as string;

  // Verify teacher has klasse_rolle for this class before updating
  const { data: rolle } = await db
    .from("klasse_rolle")
    .select("id")
    .eq("klasse_id", klasseId)
    .eq("bruker_id", brukerData.bruker.id)
    .single();

  if (!rolle) redirect("/");

  await db
    .from("samling")
    .update({ status: nyStatus as "planlagt" | "gjennomfort" | "avlyst" })
    .eq("id", samlingId)
    .eq("klasse_id", klasseId);

  revalidatePath(`/klasser/${klasseId}`);
  redirect(`/klasser/${klasseId}`);
}
