import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseConfig, isSupabaseConfigured } from "@/lib/supabase/config";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  if (!isSupabaseConfigured()) return response;
  const { url, key } = getSupabaseConfig();
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers?: Record<string, string>) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
        // Supabase SSR supplies these headers when it refreshes a session.
        if (headers) {
          Object.entries(headers).forEach(([name, value]) => response.headers.set(name, value));
        }
        // Keep refreshed cookie responses private on older SSR releases too.
        response.headers.set("Cache-Control", "private, no-store");
      },
    },
  });

  await supabase.auth.getClaims();
  if (request.nextUrl.pathname.startsWith("/admin") || request.nextUrl.pathname === "/login") {
    response.headers.set("Cache-Control", "private, no-store");
  }
  // Every protected page and action independently checks requireAdmin().
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
