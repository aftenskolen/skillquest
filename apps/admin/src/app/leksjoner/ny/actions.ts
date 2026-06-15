"use server";
import { redirect } from "next/navigation";
import { createServerClient } from "@novolms/db/server";
import type { InnholdLeksjon } from "@novolms/db/types";

export async function opprettLeksjonAction(formData: FormData) {
  const db = createServerClient();
  const tittel_no = (formData.get("tittel_no") as string).trim();
  const beskrivelse_no = (formData.get("beskrivelse_no") as string | null)?.trim() || null;
  const estimert_tid_min = formData.get("estimert_tid_min") ? Number(formData.get("estimert_tid_min")) : null;
  const leksjon_type = (formData.get("leksjon_type") as InnholdLeksjon["leksjon_type"]) ?? "standard";
  const modul_id = (formData.get("modul_id") as string | null) || null;

  const { data, error } = await db.from("innhold_leksjon").insert({
    tittel: { no: tittel_no },
    ...(beskrivelse_no ? { beskrivelse: { no: beskrivelse_no } } : {}),
    ...(estimert_tid_min ? { estimert_tid_min } : {}),
    leksjon_type,
    status: "utkast",
    innhold_blokker: [],
    versjon: 1,
  }).select("id").single();

  if (error) redirect(`/leksjoner/ny?error=${encodeURIComponent(error.message)}`);
  const leksjonId = (data as { id: string }).id;

  // Koble til modul hvis valgt
  if (modul_id) {
    const { data: eksisterende } = await db
      .from("modul_leksjon_kobling")
      .select("rekkefolge")
      .eq("modul_id", modul_id)
      .order("rekkefolge", { ascending: false })
      .limit(1);

    const nesteRekkefolge = ((eksisterende?.[0] as { rekkefolge: number } | undefined)?.rekkefolge ?? 0) + 1;

    await db.from("modul_leksjon_kobling").insert({
      modul_id,
      leksjon_id: leksjonId,
      rekkefolge: nesteRekkefolge,
    });
  }

  redirect(`/leksjoner/${leksjonId}/rediger`);
}
