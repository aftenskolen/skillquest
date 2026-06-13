"use server";

import { redirect } from "next/navigation";
import { registrerBruker } from "@skillquest/auth";
import { createClient } from "@/lib/supabase/server";

export async function registrerAction(
  navn: string,
  epost: string,
  passord: string
): Promise<void> {
  await registrerBruker(epost, passord, navn);

  const supabase = createClient();
  await supabase.auth.signInWithPassword({ email: epost, password: passord });
  redirect("/");
}
