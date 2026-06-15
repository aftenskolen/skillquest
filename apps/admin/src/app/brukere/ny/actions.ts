"use server";

import { redirect } from "next/navigation";
import { registrerBruker } from "@novolms/auth";
import { createServerClient } from "@novolms/db/server";

export async function opprettBrukerAction(formData: FormData) {
  const navn = (formData.get("navn") as string).trim();
  const epost = (formData.get("epost") as string).trim().toLowerCase();
  const passord = formData.get("passord") as string;
  const rolle = formData.get("rolle") as string;

  let bruker: { id: string } | null = null;

  try {
    bruker = await registrerBruker(epost, passord, navn);
  } catch (e) {
    redirect(`/brukere/ny?error=${encodeURIComponent((e as Error).message)}`);
  }

  if (!bruker) redirect(`/brukere/ny?error=${encodeURIComponent("Klarte ikke å opprette bruker")}`);

  if (rolle && rolle !== "deltaker") {
    const db = createServerClient();
    const { data: rolleDef } = await db
      .from("rolle_definisjon")
      .select("id")
      .eq("navn", rolle)
      .single();

    if (rolleDef) {
      await db.from("bruker_rolle").insert({
        bruker_id: bruker.id,
        rolle_id: rolleDef.id,
        status: "aktiv",
      });
    }
  }

  redirect(`/brukere/${bruker.id}`);
}
