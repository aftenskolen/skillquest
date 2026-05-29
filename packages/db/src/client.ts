import { createClient as supabaseCreateClient } from "@supabase/supabase-js";
import type { Database } from "./types/index";

function getEnvVar(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing environment variable: ${name}. ` +
      `Make sure it is set in your .env.local file.`
    );
  }
  return value;
}

export function createBrowserClient() {
  return supabaseCreateClient<Database>(
    getEnvVar("NEXT_PUBLIC_SUPABASE_URL"),
    getEnvVar("NEXT_PUBLIC_SUPABASE_ANON_KEY")
  );
}

export function createServerClient() {
  return supabaseCreateClient<Database>(
    getEnvVar("NEXT_PUBLIC_SUPABASE_URL"),
    getEnvVar("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
