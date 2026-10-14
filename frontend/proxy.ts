import type { NextRequest } from "next/server";
import { refreshSession } from "@backend/supabase/proxy";

export async function proxy(request: NextRequest) { return refreshSession(request); }

// Next.js statically reads this matcher beside the app directory.
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
