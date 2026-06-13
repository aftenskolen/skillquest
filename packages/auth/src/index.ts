import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";

// ── Interne klient-fabrikker ──────────────────────────────────────────────────

function serverClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL og SUPABASE_SERVICE_ROLE_KEY må settes. " +
        "registrerBruker() og hentInnloggetBruker() er server-side funksjoner."
    );
  }
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

function browserClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL og NEXT_PUBLIC_SUPABASE_ANON_KEY må settes i .env.local"
    );
  }
  return createClient(url, key);
}

// ── Registrering ──────────────────────────────────────────────────────────────

/**
 * Oppretter Supabase Auth-bruker, rad i bruker-tabellen, auth-provider og deltaker-rolle.
 * MÅ kalles fra server-kontekst (server action, API-rute).
 */
export async function registrerBruker(epost: string, passord: string, navn: string) {
  const supabase = serverClient();

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: epost,
    password: passord,
    email_confirm: true,
  });

  if (authError || !authData.user) {
    throw new Error(authError?.message ?? "Klarte ikke å opprette bruker");
  }

  const bruker_id = authData.user.id;

  const { data: bruker, error: brukerError } = await supabase
    .from("bruker")
    .insert({ id: bruker_id, navn, epost })
    .select()
    .single();

  if (brukerError) {
    await supabase.auth.admin.deleteUser(bruker_id).catch(() => null);
    throw new Error(brukerError.message);
  }

  await supabase.from("bruker_auth_provider").insert({
    bruker_id,
    provider: "epost" as const,
    provider_sub: epost,
  });

  const { data: deltaker } = await supabase
    .from("rolle_definisjon")
    .select("id")
    .eq("navn", "deltaker")
    .single();

  if (deltaker) {
    await supabase.from("bruker_rolle").insert({
      bruker_id,
      rolle_id: deltaker.id,
      status: "aktiv" as const,
    });
  }

  return bruker;
}

// ── Innlogging ────────────────────────────────────────────────────────────────

export async function loggInn(epost: string, passord: string) {
  const supabase = browserClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: epost,
    password: passord,
  });
  if (error) throw new Error(error.message);
  return data.session;
}

// ── Utlogging ─────────────────────────────────────────────────────────────────

export async function loggUt() {
  const supabase = browserClient();
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
}

// ── Hent innlogget bruker med roller ─────────────────────────────────────────
// Brukes i Next.js server components og server actions via @supabase/ssr + cookies().

export async function hentInnloggetBruker() {
  const { createServerClient } = await import("@supabase/ssr");
  const { cookies } = await import("next/headers");

  const cookieStore = await cookies();

  const authClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {
          // Server components kan ikke sette cookies
        },
      },
    }
  );

  const {
    data: { user },
    error,
  } = await authClient.auth.getUser();

  if (error || !user) return null;

  const db = serverClient();

  const { data: bruker } = await db
    .from("bruker")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!bruker) return null;

  const { data: brukerRoller } = await db
    .from("bruker_rolle")
    .select("rolle_definisjon!inner(navn)")
    .eq("bruker_id", user.id)
    .eq("status", "aktiv");

  const roller = (brukerRoller ?? []).map((r) => {
    const rd = (r as unknown as { rolle_definisjon: { navn: string } }).rolle_definisjon;
    return rd.navn;
  });

  return { bruker, roller };
}

// ── Hjelpefunksjoner ─────────────────────────────────────────────────────────

export function harRolle(roller: string[], rolle: string): boolean {
  return roller.includes(rolle);
}

// ── Middleware-hjelpere ───────────────────────────────────────────────────────

/**
 * Sjekker om brukeren er innlogget. Returner redirect-respons hvis ikke.
 * Brukes i Next.js middleware.ts.
 */
export async function krevInnlogging(request: NextRequest) {
  const { createServerClient } = await import("@supabase/ssr");
  const { NextResponse } = await import("next/server");

  const response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookies) => {
          cookies.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const loginUrl = new URL("/auth/logg-inn", request.url);
    loginUrl.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return null;
}

/**
 * Sjekker om brukeren har en bestemt rolle. Returner redirect til /403 hvis ikke.
 * Brukes i Next.js middleware.ts.
 */
export async function krevRolle(request: NextRequest, rolle: string) {
  const loginRedirect = await krevInnlogging(request);
  if (loginRedirect) return loginRedirect;

  const { NextResponse } = await import("next/server");

  const innlogget = await hentInnloggetBruker();
  if (!innlogget || !harRolle(innlogget.roller, rolle)) {
    return NextResponse.redirect(new URL("/403", request.url));
  }

  return null;
}
