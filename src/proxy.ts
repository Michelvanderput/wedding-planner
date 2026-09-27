import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isEmailAllowed } from "@/lib/access";
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from "@/lib/supabase/config";

const PROTECTED = ["/dashboard", "/onboarding", "/voorbeeld", "/partner"];

export async function proxy(request: NextRequest) {
  // Lokale modus: geen login nodig.
  if (!isSupabaseConfigured) return NextResponse.next();

  let response = NextResponse.next({ request });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (toSet) => {
        toSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        toSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const allowed = !user || isEmailAllowed(user.email);

  // Ingelogd maar niet op de lijst met toegestane e-mailadressen.
  if (!allowed && path !== "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "?error=not_allowed";
    return NextResponse.redirect(url);
  }

  if (!user && PROTECTED.some((p) => path.startsWith(p))) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  if (user && allowed && path === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/onboarding", "/login", "/voorbeeld", "/partner/:path*"],
};
