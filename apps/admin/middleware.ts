import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

const ADMIN_ROLLER = ["superadmin", "admin", "laerer"];

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const erAuthRute = pathname.startsWith("/auth");
  const er403 = pathname === "/403";

  if (!user && !erAuthRute && !er403) {
    return NextResponse.redirect(new URL("/auth/logg-inn", request.url));
  }

  if (user && !erAuthRute && !er403) {
    const { data: roller } = await supabase
      .from("bruker_rolle")
      .select("rolle_definisjon(navn)")
      .eq("bruker_id", user.id)
      .eq("status", "aktiv");

    const rolleNavn = (roller ?? []).flatMap(
      (r: { rolle_definisjon: { navn: string } | { navn: string }[] }) =>
        Array.isArray(r.rolle_definisjon)
          ? r.rolle_definisjon.map((rd) => rd.navn)
          : [r.rolle_definisjon.navn]
    );

    const harTilgang = rolleNavn.some((navn) => ADMIN_ROLLER.includes(navn));
    if (!harTilgang) {
      return NextResponse.redirect(new URL("/403", request.url));
    }
  }

  if (user && pathname === "/auth/logg-inn") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
