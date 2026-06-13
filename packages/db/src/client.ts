import { createClient as supabaseCreateClient } from "@supabase/supabase-js";
import type { Database } from "./types/index";

export function createBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL og NEXT_PUBLIC_SUPABASE_ANON_KEY må være satt i .env.local"
    );
  }
  return supabaseCreateClient<Database>(url, key);
}
