"use server";

import { redirect } from "next/navigation";
import { createServerClient } from "@novolms/db/server";
import type { Kurs } from "@novolms/db/types";

export async function opprettKursAction(formData: FormData) {
  const db = createServerClient();

  const tittel_no = (formData.get("tittel_no") as string).trim();
  const beskrivelse_no = (formData.get("beskrivelse_no") as string | null)?.trim() || null;
  const slug = tittel_no
    .toLowerCase()
    .replace(/æ/g, "ae").replace(/ø/g, "o").replace(/å/g, "a")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const kurstype = formData.get("kurstype") as Kurs["kurstype"];
  const cefr_nivaa = (formData.get("cefr_nivaa") as string) || null;
  const aktiv = formData.get("aktiv") === "true";

  const { error } = await db.from("kurs").insert({
    tittel: { no: tittel_no },
    ...(beskrivelse_no ? { beskrivelse: { no: beskrivelse_no } } : {}),
    slug,
    kurstype,
    ...(cefr_nivaa ? { cefr_nivaa: cefr_nivaa as Kurs["cefr_nivaa"] } : {}),
    aktiv,
    forside_prioritet: 0,
  });

  if (error) redirect(`/kurs/ny?error=${encodeURIComponent(error.message)}`);
  redirect("/kurs");
}
