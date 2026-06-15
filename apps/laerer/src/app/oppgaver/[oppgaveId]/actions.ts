"use server";

import { hentInnloggetBruker } from "@novolms/auth";
import { createServerClient } from "@novolms/db/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function giTilbakemeldingAction(formData: FormData) {
  const brukerData = await hentInnloggetBruker().catch(() => null);
  if (!brukerData) redirect("/auth/logg-inn");

  const supabase = createServerClient();
  const innleveringId = formData.get("innlevering_id") as string;
  const tilbakemelding = (formData.get("tilbakemelding") as string).trim();

  if (!innleveringId || !tilbakemelding) return;

  const { data: innlevering } = await supabase
    .from("oppgave_innlevering")
    .select("id, oppgave_id")
    .eq("id", innleveringId)
    .maybeSingle();

  if (!innlevering) return;

  const { data: oppgave } = await supabase
    .from("oppgave")
    .select("id, klasse_id")
    .eq("id", innlevering.oppgave_id)
    .maybeSingle();

  if (!oppgave) return;

  const { data: klRolle } = await supabase
    .from("klasse_rolle")
    .select("id")
    .eq("klasse_id", oppgave.klasse_id)
    .eq("bruker_id", brukerData.bruker.id)
    .maybeSingle();

  if (!klRolle) return;

  await supabase
    .from("oppgave_innlevering")
    .update({
      tilbakemelding_tekst: tilbakemelding,
      tilbakemelding_dato: new Date().toISOString(),
      status: "rettet",
    })
    .eq("id", innleveringId);

  revalidatePath(`/oppgaver/${oppgave.id}`);
}
