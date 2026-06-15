"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createServerClient } from "@novolms/db/server";

export async function oppdaterModulAction(formData: FormData) {
  const db = createServerClient();
  const id = formData.get("id") as string;
  const tittel_no = (formData.get("tittel_no") as string).trim();
  const beskrivelse_no = (formData.get("beskrivelse_no") as string | null)?.trim() || null;
  const tags = (formData.get("tags") as string | null)?.split(",").map((t) => t.trim()).filter(Boolean) ?? [];

  const { error } = await db.from("innhold_modul").update({
    tittel: { no: tittel_no },
    beskrivelse: beskrivelse_no ? { no: beskrivelse_no } : null,
    tags: tags.length ? tags : null,
  }).eq("id", id);

  if (error) redirect(`/moduler/${id}/rediger?error=${encodeURIComponent(error.message)}`);
  revalidatePath(`/moduler/${id}/rediger`);
  redirect(`/moduler/${id}/rediger`);
}

export async function leggTilLeksjonAction(formData: FormData) {
  const db = createServerClient();
  const modul_id = formData.get("modul_id") as string;
  const leksjon_id = formData.get("leksjon_id") as string;

  const { data: eksisterende } = await db
    .from("modul_leksjon_kobling")
    .select("id")
    .eq("modul_id", modul_id)
    .eq("leksjon_id", leksjon_id)
    .single();

  if (eksisterende) {
    redirect(`/moduler/${modul_id}/rediger?error=${encodeURIComponent("Leksjonen er allerede i denne modulen")}`);
  }

  const { data: eksisterende_koblinger } = await db
    .from("modul_leksjon_kobling")
    .select("rekkefolge")
    .eq("modul_id", modul_id)
    .order("rekkefolge", { ascending: false })
    .limit(1);

  const nesteRekkefolge = ((eksisterende_koblinger?.[0] as { rekkefolge: number } | undefined)?.rekkefolge ?? 0) + 1;

  const { error } = await db.from("modul_leksjon_kobling").insert({
    modul_id,
    leksjon_id,
    rekkefolge: nesteRekkefolge,
  });

  if (error) redirect(`/moduler/${modul_id}/rediger?error=${encodeURIComponent(error.message)}`);
  revalidatePath(`/moduler/${modul_id}/rediger`);
  redirect(`/moduler/${modul_id}/rediger`);
}

export async function fjernLeksjonFraModulAction(formData: FormData) {
  const db = createServerClient();
  const kobling_id = formData.get("kobling_id") as string;
  const modul_id = formData.get("modul_id") as string;

  await db.from("modul_leksjon_kobling").delete().eq("id", kobling_id);
  revalidatePath(`/moduler/${modul_id}/rediger`);
  redirect(`/moduler/${modul_id}/rediger`);
}

export async function flyttLeksjonAction(formData: FormData) {
  const db = createServerClient();
  const kobling_id = formData.get("kobling_id") as string;
  const modul_id = formData.get("modul_id") as string;
  const retning = formData.get("retning") as "opp" | "ned";
  const gjeldende_rekkefolge = Number(formData.get("rekkefolge"));

  const naboRekkefolge = retning === "opp" ? gjeldende_rekkefolge - 1 : gjeldende_rekkefolge + 1;

  const { data: nabo } = await db
    .from("modul_leksjon_kobling")
    .select("id, rekkefolge")
    .eq("modul_id", modul_id)
    .eq("rekkefolge", naboRekkefolge)
    .single();

  if (!nabo) {
    revalidatePath(`/moduler/${modul_id}/rediger`);
    redirect(`/moduler/${modul_id}/rediger`);
  }

  await Promise.all([
    db.from("modul_leksjon_kobling").update({ rekkefolge: naboRekkefolge }).eq("id", kobling_id),
    db.from("modul_leksjon_kobling").update({ rekkefolge: gjeldende_rekkefolge }).eq("id", (nabo as { id: string }).id),
  ]);

  revalidatePath(`/moduler/${modul_id}/rediger`);
  redirect(`/moduler/${modul_id}/rediger`);
}
