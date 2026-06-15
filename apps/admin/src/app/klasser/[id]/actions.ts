"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createServerClient } from "@novolms/db/server";
import type { Paamelding, KlasseRolle, Samling } from "@novolms/db/types";

export async function meldPaaAction(formData: FormData) {
  const db = createServerClient();
  const klasse_id = formData.get("klasse_id") as string;
  const epost = (formData.get("epost") as string).trim().toLowerCase();

  const { data: bruker } = await db
    .from("bruker")
    .select("id")
    .eq("epost", epost)
    .single();

  if (!bruker) {
    redirect(`/klasser/${klasse_id}?error=${encodeURIComponent("Fant ingen bruker med den e-postadressen")}`);
  }

  const { data: eksisterende } = await db
    .from("paamelding")
    .select("id")
    .eq("klasse_id", klasse_id)
    .eq("bruker_id", bruker.id)
    .single();

  if (eksisterende) {
    redirect(`/klasser/${klasse_id}?error=${encodeURIComponent("Brukeren er allerede påmeldt denne klassen")}`);
  }

  const idag = new Date().toISOString().slice(0, 10);
  const { data: klasse } = await db.from("klasse").select("slutt_dato").eq("id", klasse_id).single();

  const { error } = await db.from("paamelding").insert({
    bruker_id: bruker.id,
    klasse_id,
    status: "aktiv",
    betaling_status: "fritatt",
    tilgang_til: (klasse as { slutt_dato: string } | null)?.slutt_dato ?? idag,
  });

  if (error) redirect(`/klasser/${klasse_id}?error=${encodeURIComponent(error.message)}`);
  revalidatePath(`/klasser/${klasse_id}`);
  redirect(`/klasser/${klasse_id}`);
}

export async function oppdaterPaaMeldingStatusAction(formData: FormData) {
  const db = createServerClient();
  const paamelding_id = formData.get("paamelding_id") as string;
  const klasse_id = formData.get("klasse_id") as string;
  const status = formData.get("status") as Paamelding["status"];

  const { error } = await db
    .from("paamelding")
    .update({ status })
    .eq("id", paamelding_id);

  if (error) redirect(`/klasser/${klasse_id}?error=${encodeURIComponent(error.message)}`);
  revalidatePath(`/klasser/${klasse_id}`);
  redirect(`/klasser/${klasse_id}`);
}

export async function leggTilKlasseRolleAction(formData: FormData) {
  const db = createServerClient();
  const klasse_id = formData.get("klasse_id") as string;
  const epost = (formData.get("epost") as string).trim().toLowerCase();
  const rolle = formData.get("rolle") as KlasseRolle["rolle"];

  const { data: bruker } = await db
    .from("bruker")
    .select("id")
    .eq("epost", epost)
    .single();

  if (!bruker) {
    redirect(`/klasser/${klasse_id}?error=${encodeURIComponent("Fant ingen bruker med den e-postadressen")}`);
  }

  const { error } = await db.from("klasse_rolle").upsert(
    { klasse_id, bruker_id: bruker.id, rolle },
    { onConflict: "klasse_id,bruker_id,rolle" }
  );

  if (error) redirect(`/klasser/${klasse_id}?error=${encodeURIComponent(error.message)}`);
  revalidatePath(`/klasser/${klasse_id}`);
  redirect(`/klasser/${klasse_id}`);
}

export async function fjernKlasseRolleAction(formData: FormData) {
  const db = createServerClient();
  const id = formData.get("id") as string;
  const klasse_id = formData.get("klasse_id") as string;

  await db.from("klasse_rolle").delete().eq("id", id);

  revalidatePath(`/klasser/${klasse_id}`);
  redirect(`/klasser/${klasse_id}`);
}

export async function opprettSamlingAction(formData: FormData) {
  const db = createServerClient();
  const klasse_id = formData.get("klasse_id") as string;
  const dato = formData.get("dato") as string;
  const tid = formData.get("tid") as string;
  const dato_tid = new Date(`${dato}T${tid}:00`).toISOString();
  const type = formData.get("type") as Samling["type"];
  const varighet_timer = parseFloat(formData.get("varighet_timer") as string);
  const sted_eller_lenke = (formData.get("sted_eller_lenke") as string | null) || null;
  const notat = (formData.get("notat") as string | null) || null;

  const { error } = await db.from("samling").insert({
    klasse_id,
    type,
    dato_tid,
    varighet_timer,
    sted_eller_lenke,
    notat,
    status: "planlagt",
  });

  if (error) redirect(`/klasser/${klasse_id}?error=${encodeURIComponent(error.message)}`);
  revalidatePath(`/klasser/${klasse_id}`);
  redirect(`/klasser/${klasse_id}`);
}

export async function oppdaterSamlingStatusAction(formData: FormData) {
  const db = createServerClient();
  const id = formData.get("id") as string;
  const klasse_id = formData.get("klasse_id") as string;
  const status = formData.get("status") as Samling["status"];

  const { error } = await db
    .from("samling")
    .update({ status })
    .eq("id", id);

  if (error) redirect(`/klasser/${klasse_id}?error=${encodeURIComponent(error.message)}`);
  revalidatePath(`/klasser/${klasse_id}`);
  redirect(`/klasser/${klasse_id}`);
}

export async function slettSamlingAction(formData: FormData) {
  const db = createServerClient();
  const id = formData.get("id") as string;
  const klasse_id = formData.get("klasse_id") as string;

  await db.from("samling").delete().eq("id", id);

  revalidatePath(`/klasser/${klasse_id}`);
  redirect(`/klasser/${klasse_id}`);
}

export async function oppdaterKlasseAction(formData: FormData) {
  const db = createServerClient();
  const id = formData.get("id") as string;

  const { error } = await db.from("klasse").update({
    tittel: formData.get("tittel") as string,
    sted: (formData.get("sted") as string | null) || null,
    start_dato: formData.get("start_dato") as string,
    slutt_dato: formData.get("slutt_dato") as string,
    status: formData.get("status") as Paamelding["status"],
  }).eq("id", id);

  if (error) redirect(`/klasser/${id}?error=${encodeURIComponent(error.message)}`);
  revalidatePath(`/klasser/${id}`);
  redirect(`/klasser/${id}`);
}
