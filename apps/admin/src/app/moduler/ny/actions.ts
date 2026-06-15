"use server";
import { redirect } from "next/navigation";
import { createServerClient } from "@novolms/db/server";

export async function opprettModulAction(formData: FormData) {
  const db = createServerClient();
  const tittel_no = (formData.get("tittel_no") as string).trim();
  const beskrivelse_no = (formData.get("beskrivelse_no") as string | null)?.trim() || null;
  const tags = (formData.get("tags") as string | null)?.split(",").map((t) => t.trim()).filter(Boolean) ?? [];

  const { data, error } = await db.from("innhold_modul").insert({
    tittel: { no: tittel_no },
    ...(beskrivelse_no ? { beskrivelse: { no: beskrivelse_no } } : {}),
    ...(tags.length ? { tags } : {}),
  }).select("id").single();

  if (error) redirect(`/moduler/ny?error=${encodeURIComponent(error.message)}`);
  redirect(`/moduler/${(data as { id: string }).id}/rediger`);
}
