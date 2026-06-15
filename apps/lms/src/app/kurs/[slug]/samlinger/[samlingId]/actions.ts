"use server";

import { hentInnloggetBruker } from "@novolms/auth";
import { createServerClient } from "@novolms/db/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function leverInnOppgaveAction(formData: FormData) {
  const brukerData = await hentInnloggetBruker().catch(() => null);
  if (!brukerData) redirect("/auth/logg-inn");

  const supabase = createServerClient();
  const oppgaveId = formData.get("oppgave_id") as string;
  const kursSlug = formData.get("kurs_slug") as string;
  const samlingId = formData.get("samling_id") as string;
  const innholdTekst = (formData.get("innhold_tekst") as string | null)?.trim() || null;
  const fil = formData.get("fil") as File | null;

  if (!oppgaveId) return;

  const { data: oppgave } = await supabase
    .from("oppgave")
    .select("id, klasse_id")
    .eq("id", oppgaveId)
    .maybeSingle();

  if (!oppgave) return;

  const { data: paamelding } = await supabase
    .from("paamelding")
    .select("id")
    .eq("klasse_id", oppgave.klasse_id)
    .eq("bruker_id", brukerData.bruker.id)
    .in("status", ["aktiv", "paameldt"])
    .maybeSingle();

  if (!paamelding) return;

  let filUrl: string | null = null;

  if (fil && fil.size > 0) {
    const bytes = await fil.arrayBuffer();
    const filnavn = `${oppgaveId}/${brukerData.bruker.id}_${Date.now()}_${fil.name.replace(/\s+/g, "_")}`;
    const { data: upload, error: uploadError } = await supabase.storage
      .from("innlevering-filer")
      .upload(filnavn, Buffer.from(bytes), { contentType: fil.type });

    if (!uploadError && upload) {
      const { data: signedUrl } = await supabase.storage
        .from("innlevering-filer")
        .createSignedUrl(upload.path, 60 * 60 * 24 * 7);
      filUrl = signedUrl?.signedUrl ?? null;
    }
  }

  if (!innholdTekst && !filUrl) return;

  const { data: eksisterende } = await supabase
    .from("oppgave_innlevering")
    .select("id")
    .eq("oppgave_id", oppgaveId)
    .eq("bruker_id", brukerData.bruker.id)
    .maybeSingle();

  if (eksisterende) {
    await supabase
      .from("oppgave_innlevering")
      .update({
        innhold_tekst: innholdTekst,
        ...(filUrl ? { fil_url: filUrl } : {}),
        innlevert_dato: new Date().toISOString(),
        status: "levert",
      })
      .eq("id", eksisterende.id);
  } else {
    await supabase.from("oppgave_innlevering").insert({
      oppgave_id: oppgaveId,
      bruker_id: brukerData.bruker.id,
      innhold_tekst: innholdTekst,
      fil_url: filUrl,
      status: "levert",
    });
  }

  revalidatePath(`/kurs/${kursSlug}/samlinger/${samlingId}`);
}
