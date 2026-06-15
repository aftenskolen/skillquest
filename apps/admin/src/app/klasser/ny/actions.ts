"use server";

import { redirect } from "next/navigation";
import { createServerClient } from "@novolms/db/server";
import type { Klasse } from "@novolms/db/types";

export async function opprettKlasseAction(formData: FormData) {
  const db = createServerClient();

  const kurs_id = formData.get("kurs_id") as string;
  const tittel = (formData.get("tittel") as string).trim();
  const sted = (formData.get("sted") as string | null)?.trim() || null;
  const start_dato = formData.get("start_dato") as string;
  const slutt_dato = formData.get("slutt_dato") as string;
  const maks_deltakere = formData.get("maks_deltakere")
    ? Number(formData.get("maks_deltakere"))
    : null;
  const status = formData.get("status") as Klasse["status"];
  const gratis = formData.get("gratis") === "true";
  const pris = gratis ? 0 : Number(formData.get("pris") ?? 0);

  const { data: nyKlasse, error } = await db.from("klasse").insert({
    kurs_id,
    tittel,
    ...(sted ? { sted } : {}),
    start_dato,
    slutt_dato,
    ...(maks_deltakere ? { maks_deltakere } : {}),
    status,
    gratis,
    pris,
    prismodell: "engangsbetaling",
    rullerende_oppstart: false,
  }).select("id").single();

  if (error || !nyKlasse) redirect(`/klasser/ny?error=${encodeURIComponent(error?.message ?? "Ukjent feil")}`);

  const laererEpost = (formData.get("laerer_epost") as string | null)?.trim().toLowerCase();
  if (laererEpost) {
    const { data: laerer } = await db.from("bruker").select("id").eq("epost", laererEpost).single();
    if (laerer) {
      await db.from("klasse_rolle").insert({ klasse_id: nyKlasse.id, bruker_id: laerer.id, rolle: "laerer" });
    }
  }

  redirect("/klasser");
}
