"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { loginSchema, formValues } from "@/lib/validations/cms";
import type { ActionState } from "@/components/admin/action-form";

export async function login(_state: ActionState, form: FormData): Promise<ActionState> {
  if (!isSupabaseConfigured()) return { message: "Connect Supabase before signing in. Follow the setup instructions in the README." };
  const parsed = loginSchema.safeParse(formValues(form, ["email", "password"]));
  if (!parsed.success) return { message: "Check your sign-in details.", errors: parsed.error.flatten().fieldErrors };
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error || !data.user) return { message: "Unable to sign in. Check your email and password, then try again." };
  const { data: profile, error: profileError } = await supabase.from("profiles").select("role").eq("id", data.user.id).single();
  if (profileError || profile?.role !== "admin") {
    await supabase.auth.signOut();
    return { message: "This account does not have portfolio administrator access." };
  }
  redirect("/admin");
}
