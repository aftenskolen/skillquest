"use server";

import { hentInnloggetBruker } from "@novolms/auth";
import { createServerClient } from "@novolms/db/server";
import { redirect } from "next/navigation";

export async function opprettOppgaveAction(formData: FormData) {
  const brukerData = await hentInnloggetBruker().catch(() => null);
  if (!brukerData) redirect("/auth/logg-inn");

  const supabase = createServerClient();
  const klasseId = formData.get("klasse_id") as string;
  const samlingId = formData.get("samling_id") as string;
  const tittel = (formData.get("tittel") as string).trim();
  const beskrivelse = (formData.get("beskrivelse") as string | null)?.trim() || null;
  const fil = formData.get("fil") as File | null;

  if (!klasseId || !samlingId || !tittel) redirect("/oppgaver/ny?error=mangler_felt");

  const { data: klRolle } = await supabase
    .from("klasse_rolle")
    .select("id")
    .eq("klasse_id", klasseId)
    .eq("bruker_id", brukerData.bruker.id)
    .maybeSingle();

  if (!klRolle) redirect("/oppgaver/ny?error=ingen_tilgang");

  let filUrl: string | null = null;

  if (fil && fil.size > 0) {
    const bytes = await fil.arrayBuffer();
    const filnavn = `${klasseId}/${Date.now()}_${fil.name.replace(/\s+/g, "_")}`;
    const { data: upload, error: uploadError } = await supabase.storage
      .from("oppgave-filer")
      .upload(filnavn, Buffer.from(bytes), { contentType: fil.type });

    if (!uploadError && upload) {
      const { data: { publicUrl } } = supabase.storage
        .from("oppgave-filer")
        .getPublicUrl(upload.path);
      filUrl = publicUrl;
    }
  }

  const { data: oppgave, error } = await supabase
    .from("oppgave")
    .insert({
      samling_id: samlingId,
      klasse_id: klasseId,
      tittel,
      beskrivelse,
      fil_url: filUrl,
      opprettet_av: brukerData.bruker.id,
    })
    .select("id")
    .single();

  if (error || !oppgave) redirect("/oppgaver/ny?error=db_feil");

  redirect(`/oppgaver/${oppgave.id}`);
}
