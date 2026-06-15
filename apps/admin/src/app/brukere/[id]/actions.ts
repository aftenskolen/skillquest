"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerClient } from "@novolms/db/server";

export async function tildelRolleAction(formData: FormData) {
  const db = createServerClient();
  const bruker_id = formData.get("bruker_id") as string;
  const rolle_id = formData.get("rolle_id") as string;

  const { error } = await db.from("bruker_rolle").insert({
    bruker_id,
    rolle_id,
    status: "aktiv",
  });

  if (error) redirect(`/brukere/${bruker_id}?error=${encodeURIComponent(error.message)}`);
  revalidatePath(`/brukere/${bruker_id}`);
  redirect(`/brukere/${bruker_id}`);
}

export async function fjernRolleAction(formData: FormData) {
  const db = createServerClient();
  const bruker_rolle_id = formData.get("bruker_rolle_id") as string;
  const bruker_id = formData.get("bruker_id") as string;

  const { error } = await db.from("bruker_rolle").delete().eq("id", bruker_rolle_id);

  if (error) redirect(`/brukere/${bruker_id}?error=${encodeURIComponent(error.message)}`);
  revalidatePath(`/brukere/${bruker_id}`);
  redirect(`/brukere/${bruker_id}`);
}

export async function oppdaterBrukerAction(formData: FormData) {
  const db = createServerClient();
  const id = formData.get("id") as string;

  const str = (key: string) => (formData.get(key) as string | null)?.trim() || null;

  const { error } = await db.from("bruker").update({
    navn: (formData.get("navn") as string).trim(),
    telefon: str("telefon"),
    adresse: str("adresse"),
    postnummer: str("postnummer"),
    poststed: str("poststed"),
    fodselsdato: str("fodselsdato"),
    kjonn: (str("kjonn") as "mann" | "kvinne" | "ikke_oppgitt" | null) ?? null,
    morsmaal: str("morsmaal"),
    utdanningsnivaa: (str("utdanningsnivaa") as "grunnskole" | "vgs" | "fagbrev" | "hoeyere" | "ukjent" | null) ?? null,
    fodselsnummer: str("fodselsnummer"),
    foretrukket_sprak: (formData.get("foretrukket_sprak") as string) || "no",
    notat: str("notat"),
    aktiv: formData.get("aktiv") === "true",
  }).eq("id", id);

  if (error) redirect(`/brukere/${id}?error=${encodeURIComponent(error.message)}`);
  revalidatePath(`/brukere/${id}`);
  redirect(`/brukere/${id}?lagret=1`);
}
