"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createServerClient } from "@novolms/db/server";
import type { Samling } from "@novolms/db/types";

export async function oppdaterSamlingAction(formData: FormData) {
  const db = createServerClient();
  const samling_id = formData.get("samling_id") as string;
  const klasse_id = formData.get("klasse_id") as string;
  const dato = formData.get("dato") as string;
  const tid = formData.get("tid") as string;
  const dato_tid = new Date(`${dato}T${tid}:00`).toISOString();
  const type = formData.get("type") as Samling["type"];
  const varighet_timer = parseFloat(formData.get("varighet_timer") as string);
  const sted_eller_lenke = (formData.get("sted_eller_lenke") as string | null) || null;
  const notat = (formData.get("notat") as string | null) || null;
  const status = formData.get("status") as Samling["status"];

  const { error } = await db
    .from("samling")
    .update({ type, dato_tid, varighet_timer, sted_eller_lenke, notat, status })
    .eq("id", samling_id);

  if (error) {
    redirect(
      `/klasser/${klasse_id}/samlinger/${samling_id}?error=${encodeURIComponent(error.message)}`
    );
  }

  revalidatePath(`/klasser/${klasse_id}/samlinger/${samling_id}`);
  revalidatePath(`/klasser/${klasse_id}`);
  redirect(`/klasser/${klasse_id}/samlinger/${samling_id}`);
}

export async function lagreFremmoteAction(formData: FormData) {
  const db = createServerClient();
  const samling_id = formData.get("samling_id") as string;
  const klasse_id = formData.get("klasse_id") as string;
  const bruker_ids_raw = formData.get("bruker_ids") as string;
  const bruker_ids = bruker_ids_raw ? bruker_ids_raw.split(",") : [];

  const upserts = bruker_ids.map((bruker_id) => ({
    samling_id,
    bruker_id,
    status: (formData.get(`status_${bruker_id}`) as string) as SamlingOppmoteStatus,
    notat: (formData.get(`notat_${bruker_id}`) as string | null) || null,
  }));

  if (upserts.length > 0) {
    const { error } = await db
      .from("samling_oppmote")
      .upsert(upserts, { onConflict: "samling_id,bruker_id" });

    if (error) {
      redirect(
        `/klasser/${klasse_id}/samlinger/${samling_id}?error=${encodeURIComponent(error.message)}`
      );
    }
  }

  revalidatePath(`/klasser/${klasse_id}/samlinger/${samling_id}`);
  redirect(`/klasser/${klasse_id}/samlinger/${samling_id}`);
}

type SamlingOppmoteStatus = "tilstede" | "ukjent_fravaer" | "jobb" | "godkjent_fravaer";
