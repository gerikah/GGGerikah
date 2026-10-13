import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "./server";
import { isSupabaseConfigured } from "./config";

export async function requireAdmin() {
  if (!isSupabaseConfigured()) redirect("/login?error=not-configured");
  const supabase = await createClient();
  // getUser validates cookies against Auth; never authorize from getSession.
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect("/login");

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    throw new Error(`Cannot verify admin access: ${profileError.message}`);
  }
  if (profile?.role !== "admin") redirect("/login?error=admin-required");
  return { supabase, user };
}
