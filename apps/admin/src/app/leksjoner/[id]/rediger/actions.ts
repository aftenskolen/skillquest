"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createServerClient } from "@novolms/db/server";
import type { InnholdLeksjon, InnholdsBlokk } from "@novolms/db/types";
import JSZip from "jszip";

export async function lagreLeksjonMetadataAction(formData: FormData) {
  const db = createServerClient();
  const id = formData.get("id") as string;
  const tittel_no = (formData.get("tittel_no") as string).trim();
  const beskrivelse_no = (formData.get("beskrivelse_no") as string | null)?.trim() || null;
  const estimert_tid_min = formData.get("estimert_tid_min") ? Number(formData.get("estimert_tid_min")) : null;
  const leksjon_type = formData.get("leksjon_type") as InnholdLeksjon["leksjon_type"];
  const status = formData.get("status") as InnholdLeksjon["status"];

  const xp_verdi = formData.get("xp_verdi") ? Number(formData.get("xp_verdi")) : 10;

  const { error } = await db.from("innhold_leksjon").update({
    tittel: { no: tittel_no },
    beskrivelse: beskrivelse_no ? { no: beskrivelse_no } : null,
    estimert_tid_min,
    xp_verdi,
    leksjon_type,
    status,
  }).eq("id", id);

  if (error) redirect(`/leksjoner/${id}/rediger?error=${encodeURIComponent(error.message)}`);
  revalidatePath(`/leksjoner/${id}/rediger`);
  redirect(`/leksjoner/${id}/rediger?lagret=1`);
}

export async function uploadH5PAction(formData: FormData): Promise<
  { fil_url: string; innhold_url: string } | { error: string }
> {
  const db = createServerClient();
  const fil = formData.get("file") as File | null;
  if (!fil) return { error: "Ingen fil valgt" };
  if (!fil.name.endsWith(".h5p")) return { error: "Filen må være en .h5p-fil" };

  const buffer = await fil.arrayBuffer();
  const uuid = crypto.randomUUID();

  // Last opp original .h5p-fil
  const { error: opplastFeil } = await db.storage
    .from("h5p-filer")
    .upload(`${uuid}.h5p`, buffer, { contentType: "application/zip", upsert: false });
  if (opplastFeil) return { error: opplastFeil.message };

  const { data: { publicUrl: filUrl } } = db.storage.from("h5p-filer").getPublicUrl(`${uuid}.h5p`);

  // Pakk ut og last opp innholdet
  try {
    const zip = await JSZip.loadAsync(buffer);
    const opplastinger: Promise<void>[] = [];

    zip.forEach((relativePath, zipEntry) => {
      if (zipEntry.dir) return;
      opplastinger.push(
        zipEntry.async("arraybuffer").then(async (innhold) => {
          const ext = relativePath.split(".").pop()?.toLowerCase() ?? "";
          const mimeTyper: Record<string, string> = {
            html: "text/html", js: "application/javascript",
            css: "text/css", json: "application/json",
            png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg",
            gif: "image/gif", svg: "image/svg+xml", mp4: "video/mp4",
            webm: "video/webm", ogg: "video/ogg", woff: "font/woff",
            woff2: "font/woff2", ttf: "font/ttf",
          };
          await db.storage
            .from("h5p-innhold")
            .upload(`${uuid}/${relativePath}`, innhold, {
              contentType: mimeTyper[ext] ?? "application/octet-stream",
              upsert: true,
            });
        })
      );
    });

    await Promise.all(opplastinger);
  } catch (e) {
    return { error: `Kunne ikke pakke ut H5P: ${String(e)}` };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const innholdUrl = `${supabaseUrl}/storage/v1/object/public/h5p-innhold/${uuid}/`;

  return { fil_url: filUrl, innhold_url: innholdUrl };
}

export async function leggTilModulKoblingAction(formData: FormData) {
  const db = createServerClient();
  const leksjon_id = formData.get("leksjon_id") as string;
  const modul_id = (formData.get("modul_id") as string | null) || null;

  if (!modul_id) {
    redirect(`/leksjoner/${leksjon_id}/rediger?error=${encodeURIComponent("Velg en modul")}`);
  }

  const { data: eksisterende } = await db
    .from("modul_leksjon_kobling")
    .select("id")
    .eq("modul_id", modul_id)
    .eq("leksjon_id", leksjon_id)
    .maybeSingle();

  if (eksisterende) {
    redirect(`/leksjoner/${leksjon_id}/rediger?error=${encodeURIComponent("Leksjonen er allerede koblet til denne modulen")}`);
  }

  const { data: sistePlass } = await db
    .from("modul_leksjon_kobling")
    .select("rekkefolge")
    .eq("modul_id", modul_id)
    .order("rekkefolge", { ascending: false })
    .limit(1);

  const nesteRekkefolge = ((sistePlass?.[0] as { rekkefolge: number } | undefined)?.rekkefolge ?? 0) + 1;

  const { error } = await db.from("modul_leksjon_kobling").insert({
    modul_id,
    leksjon_id,
    rekkefolge: nesteRekkefolge,
  });

  if (error) redirect(`/leksjoner/${leksjon_id}/rediger?error=${encodeURIComponent(error.message)}`);
  revalidatePath(`/leksjoner/${leksjon_id}/rediger`);
  redirect(`/leksjoner/${leksjon_id}/rediger`);
}

export async function fjernModulKoblingAction(formData: FormData) {
  const db = createServerClient();
  const kobling_id = formData.get("kobling_id") as string;
  const leksjon_id = formData.get("leksjon_id") as string;

  await db.from("modul_leksjon_kobling").delete().eq("id", kobling_id);
  revalidatePath(`/leksjoner/${leksjon_id}/rediger`);
  redirect(`/leksjoner/${leksjon_id}/rediger`);
}

export async function lagreBlokkerAction(formData: FormData) {
  const db = createServerClient();
  const id = formData.get("leksjon_id") as string;
  const blokkerJson = formData.get("blokker") as string;

  let blokker: InnholdsBlokk[];
  try {
    blokker = JSON.parse(blokkerJson) as InnholdsBlokk[];
  } catch {
    redirect(`/leksjoner/${id}/rediger?error=${encodeURIComponent("Ugyldig blokkdata")}`);
  }

  const { error } = await db.from("innhold_leksjon").update({
    innhold_blokker: blokker,
  }).eq("id", id);

  if (error) redirect(`/leksjoner/${id}/rediger?error=${encodeURIComponent(error.message)}`);
  revalidatePath(`/leksjoner/${id}/rediger`);
  redirect(`/leksjoner/${id}/rediger?lagret=1`);
}
