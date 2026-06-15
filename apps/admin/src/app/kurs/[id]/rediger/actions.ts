"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createServerClient } from "@novolms/db/server";
import type { Kurs } from "@novolms/db/types";

export async function oppdaterKursAction(formData: FormData) {
  const db = createServerClient();
  const id = formData.get("id") as string;
  const tittel_no = (formData.get("tittel_no") as string).trim();
  const beskrivelse_no = (formData.get("beskrivelse_no") as string | null)?.trim() || null;
  const kurstype = formData.get("kurstype") as Kurs["kurstype"];
  const cefr_nivaa = (formData.get("cefr_nivaa") as string) || null;
  const aktiv = formData.get("aktiv") === "true";

  const { error } = await db.from("kurs").update({
    tittel: { no: tittel_no },
    beskrivelse: beskrivelse_no ? { no: beskrivelse_no } : null,
    kurstype,
    ...(cefr_nivaa ? { cefr_nivaa: cefr_nivaa as Kurs["cefr_nivaa"] } : { cefr_nivaa: null }),
    aktiv,
  }).eq("id", id);

  if (error) redirect(`/kurs/${id}/rediger?error=${encodeURIComponent(error.message)}`);
  redirect("/kurs");
}

export async function slettKursAction(formData: FormData) {
  const db = createServerClient();
  const id = formData.get("id") as string;
  const { error } = await db.from("kurs").delete().eq("id", id);
  if (error) redirect(`/kurs/${id}/rediger?error=${encodeURIComponent(error.message)}`);
  redirect("/kurs");
}

export async function leggTilModulAction(formData: FormData) {
  const db = createServerClient();
  const kurs_id = formData.get("kurs_id") as string;
  const modul_id = formData.get("modul_id") as string;

  const { data: eksisterende } = await db
    .from("kurs_modul_kobling")
    .select("id")
    .eq("kurs_id", kurs_id)
    .eq("modul_id", modul_id)
    .single();

  if (eksisterende) {
    redirect(`/kurs/${kurs_id}/rediger?error=${encodeURIComponent("Modulen er allerede knyttet til dette kurset")}`);
  }

  const { data: siste } = await db
    .from("kurs_modul_kobling")
    .select("rekkefolge")
    .eq("kurs_id", kurs_id)
    .order("rekkefolge", { ascending: false })
    .limit(1);

  const nesteRekkefolge = ((siste?.[0] as { rekkefolge: number } | undefined)?.rekkefolge ?? 0) + 1;

  const { error } = await db.from("kurs_modul_kobling").insert({ kurs_id, modul_id, rekkefolge: nesteRekkefolge });
  if (error) redirect(`/kurs/${kurs_id}/rediger?error=${encodeURIComponent(error.message)}`);
  revalidatePath(`/kurs/${kurs_id}/rediger`);
  redirect(`/kurs/${kurs_id}/rediger`);
}

export async function fjernModulFraKursAction(formData: FormData) {
  const db = createServerClient();
  const kobling_id = formData.get("kobling_id") as string;
  const kurs_id = formData.get("kurs_id") as string;
  await db.from("kurs_modul_kobling").delete().eq("id", kobling_id);
  revalidatePath(`/kurs/${kurs_id}/rediger`);
  redirect(`/kurs/${kurs_id}/rediger`);
}

export async function flyttModulAction(formData: FormData) {
  const db = createServerClient();
  const kobling_id = formData.get("kobling_id") as string;
  const kurs_id = formData.get("kurs_id") as string;
  const retning = formData.get("retning") as "opp" | "ned";
  const gjeldende = Number(formData.get("rekkefolge"));
  const nabo_rekkefolge = retning === "opp" ? gjeldende - 1 : gjeldende + 1;

  const { data: nabo } = await db
    .from("kurs_modul_kobling")
    .select("id, rekkefolge")
    .eq("kurs_id", kurs_id)
    .eq("rekkefolge", nabo_rekkefolge)
    .single();

  if (nabo) {
    await Promise.all([
      db.from("kurs_modul_kobling").update({ rekkefolge: nabo_rekkefolge }).eq("id", kobling_id),
      db.from("kurs_modul_kobling").update({ rekkefolge: gjeldende }).eq("id", (nabo as { id: string }).id),
    ]);
  }

  revalidatePath(`/kurs/${kurs_id}/rediger`);
  redirect(`/kurs/${kurs_id}/rediger`);
}
