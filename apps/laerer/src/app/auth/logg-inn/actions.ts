"use server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function loggInnAction(epost: string, passord: string): Promise<{ error?: string }> {
  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({ email: epost, password: passord });
  if (error) return { error: "Feil e-post eller passord." };
  redirect("/");
}
