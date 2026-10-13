import Link from "next/link";
import { ActionForm, Field } from "@/components/admin/action-form";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { login } from "./actions";
import "../admin/admin.css";

export const metadata = { title: "CMS login · Gerikah Alday", robots: { index: false, follow: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const configured = isSupabaseConfigured();
  return <main className="admin-login"><div className="admin-login-paper">
    <Link href="/" className="admin-back">← Return to portfolio</Link>
    <p className="admin-eyebrow">PRIVATE ARCHIVE / CMS</p><h1>Behind the<br />work.</h1>
    <p className="admin-muted">Sign in to edit your portfolio, publish projects, and keep the details current.</p>
    {!configured ? <div className="admin-message">Supabase is not connected yet. Add the environment variables, apply the migration and seed, and create your administrator account as described in the README.</div>
      : <>{error && <p role="status" className="admin-message is-error">Your session expired or this account does not have administrator access. Please sign in again.</p>}
        <ActionForm action={login} submitLabel="Enter the archive"><Field name="email" label="Email" type="email" required /><Field name="password" label="Password" type="password" required /></ActionForm></>}
    <p className="admin-fine">Administrator access only. Accounts are created in Supabase.</p>
  </div></main>;
}
