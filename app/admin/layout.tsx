import Link from "next/link";
import { requireAdmin } from "@/lib/supabase/auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { signOut } from "./actions";
import "./admin.css";

export const metadata = { title: "Portfolio CMS · Gerikah Alday", robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!isSupabaseConfigured()) return <main className="admin-shell"><div className="admin-panel admin-setup"><p className="admin-eyebrow">CMS / SETUP REQUIRED</p><h1>Connect your archive.</h1><p>Supabase has not been configured in this environment. The public portfolio uses its seed content while your CMS is being connected.</p><ol><li>Add the Supabase URL and publishable key from <code>.env.example</code> to <code>.env.local</code>.</li><li>Run the migration and seed SQL in Supabase.</li><li>Create your Auth user and assign its profile the admin role.</li><li>Restart the development server, then sign in.</li></ol><p>Complete commands and account setup are in the repository README.</p><Link href="/" className="admin-button">View the portfolio ↗</Link></div></main>;
  const { user } = await requireAdmin();
  return <div className="admin-shell"><a className="admin-skip" href="#admin-content">Skip to content</a>
    <header className="admin-header"><Link href="/admin" className="admin-brand">GA <span>CONTENT ARCHIVE</span></Link><nav aria-label="CMS navigation"><Link href="/admin">Projects</Link><Link href="/admin/settings">Site details</Link><Link href="/admin/capabilities">Capabilities & process</Link><Link href="/" target="_blank" rel="noopener noreferrer">View site ↗</Link></nav><form action={signOut}><button className="admin-signout" type="submit">Sign out</button></form></header>
    <div className="admin-account"><span>ADMINISTRATOR</span><span>{user.email}</span></div><main id="admin-content" className="admin-main">{children}</main>
  </div>;
}
