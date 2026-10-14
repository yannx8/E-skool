import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { publicEnv } from "@/lib/env";

// Paths reachable without a session.
const PUBLIC_PREFIXES = ["/connexion", "/mot-de-passe-oublie", "/auth/", "/p/", "/api/cron/", "/acces-refuse"];

// FR-A3: a login is valid for 30 days, then the user signs in again.
const MAX_SESSION_SECONDS = 30 * 24 * 60 * 60;

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const { pathname, search } = request.nextUrl;

  if (!publicEnv.supabaseUrl || !publicEnv.supabaseAnonKey) {
    return response;
  }

  const supabase = createServerClient(publicEnv.supabaseUrl, publicEnv.supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options);
        for (const [key, value] of Object.entries(headers ?? {})) response.headers.set(key, value);
      },
    },
  });

  // Refreshes the session cookie when needed. Do not run code between
  // createServerClient and getClaims.
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;

  const isPublic = pathname === "/" ? false : PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));
  const isApi = pathname.startsWith("/api/");

  if (claims) {
    const amr = Array.isArray(claims.amr) ? (claims.amr as { timestamp?: number }[]) : [];
    const signedInAt = Math.min(...amr.map((a) => a.timestamp ?? Infinity));
    if (Number.isFinite(signedInAt) && Date.now() / 1000 - signedInAt > MAX_SESSION_SECONDS) {
      await supabase.auth.signOut();
      const url = request.nextUrl.clone();
      url.pathname = "/connexion";
      url.search = "?expire=1";
      const redirect = NextResponse.redirect(url);
      for (const cookie of response.cookies.getAll()) redirect.cookies.set(cookie);
      return redirect;
    }
    if (pathname === "/connexion") {
      const url = request.nextUrl.clone();
      url.pathname = "/tableau-de-bord";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  if (!claims && !isPublic && !isApi) {
    const url = request.nextUrl.clone();
    url.pathname = "/connexion";
    url.search = pathname === "/" ? "" : `?next=${encodeURIComponent(pathname + search)}`;
    const redirect = NextResponse.redirect(url);
    for (const cookie of response.cookies.getAll()) redirect.cookies.set(cookie);
    return redirect;
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|webp|ico|csv)$).*)"],
};
