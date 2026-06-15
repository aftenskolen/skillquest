"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "@novolms/db/server";

export async function oppdaterXpKonfigurasjonAction(formData: FormData) {
  const db = createServerClient();
  const handling = formData.get("handling") as string;
  const xp_verdi = Number(formData.get("xp_verdi"));

  await db.from("xp_konfigurasjon").upsert({
    handling,
    xp_verdi,
  });

  revalidatePath("/xp");
}

export async function oppdaterLevelTerskelAction(formData: FormData) {
  const db = createServerClient();
  const level = Number(formData.get("level"));
  const xp_paakrevd = Number(formData.get("xp_paakrevd"));

  await db.from("level_terskel").upsert({ level, xp_paakrevd });

  revalidatePath("/xp");
}
