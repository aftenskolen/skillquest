"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createServerClient } from "@novolms/db/server";
import { hentInnloggetBruker } from "@novolms/auth";

export async function oppdaterSamlingAction(formData: FormData) {
  const brukerData = await hentInnloggetBruker();
  if (!brukerData) redirect("/auth/logg-inn");

  const db = createServerClient();
  const samlingId = formData.get("samling_id") as string;
  const klasseId = formData.get("klasse_id") as string;

  // Verify teacher has klasse_rolle for this class
  const { data: rolle } = await db
    .from("klasse_rolle")
    .select("id")
    .eq("klasse_id", klasseId)
    .eq("bruker_id", brukerData.bruker.id)
    .single();

  if (!rolle) redirect("/");

  const type = formData.get("type") as "fysisk" | "virtuell" | "discord" | "asynkron";
  const dato = formData.get("dato") as string;
  const tid = formData.get("tid") as string;
  const varighet_timer = parseFloat(formData.get("varighet_timer") as string);
  const sted_eller_lenke = (formData.get("sted_eller_lenke") as string) || null;
  const notat = (formData.get("notat") as string) || null;
  const status = formData.get("status") as "planlagt" | "gjennomfort" | "avlyst";

  // Combine dato + tid into ISO dato_tid
  const dato_tid = `${dato}T${tid}:00`;

  await db
    .from("samling")
    .update({ type, dato_tid, varighet_timer, sted_eller_lenke, notat, status })
    .eq("id", samlingId)
    .eq("klasse_id", klasseId);

  revalidatePath(`/klasser/${klasseId}`);
  revalidatePath(`/klasser/${klasseId}/samlinger/${samlingId}`);
  redirect(`/klasser/${klasseId}/samlinger/${samlingId}`);
}

export async function lagreFremmoteAction(formData: FormData) {
  const brukerData = await hentInnloggetBruker();
  if (!brukerData) redirect("/auth/logg-inn");

  const db = createServerClient();
  const samlingId = formData.get("samling_id") as string;
  const klasseId = formData.get("klasse_id") as string;

  // Verify teacher has klasse_rolle for this class
  const { data: rolle } = await db
    .from("klasse_rolle")
    .select("id")
    .eq("klasse_id", klasseId)
    .eq("bruker_id", brukerData.bruker.id)
    .single();

  if (!rolle) redirect("/");

  // Collect all bruker_ids from the hidden bruker_ider field (comma-separated)
  const brukerIderRaw = formData.get("bruker_ider") as string;
  const brukerIder: string[] = brukerIderRaw ? brukerIderRaw.split(",").filter(Boolean) : [];

  // Upsert samling_oppmote for each student
  for (const brukerId of brukerIder) {
    const status = formData.get(`status_${brukerId}`) as
      | "tilstede"
      | "ukjent_fravaer"
      | "jobb"
      | "godkjent_fravaer";
    const notat = (formData.get(`notat_${brukerId}`) as string) || null;

    await db
      .from("samling_oppmote")
      .upsert(
        { samling_id: samlingId, bruker_id: brukerId, status, notat },
        { onConflict: "samling_id,bruker_id" }
      );
  }

  revalidatePath(`/klasser/${klasseId}/samlinger/${samlingId}`);
  redirect(`/klasser/${klasseId}/samlinger/${samlingId}`);
}
