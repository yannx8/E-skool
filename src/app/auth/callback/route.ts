import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

// Landing point of email links (password recovery). Supports both the PKCE
// "code" flow and the "token_hash" flow so custom email templates also work.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const rawNext = searchParams.get("next") ?? "/tableau-de-bord";
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/tableau-de-bord";
  const supabase = await createClient();

  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  let ok = false;
  if (code) {
    ok = !(await supabase.auth.exchangeCodeForSession(code)).error;
  } else if (tokenHash && type) {
    ok = !(await supabase.auth.verifyOtp({ token_hash: tokenHash, type })).error;
  }

  if (!ok) {
    return NextResponse.redirect(`${origin}/connexion?lien=invalide`);
  }
  return NextResponse.redirect(`${origin}${next}`);
}
