import Link from "next/link";
import { requireAdmin } from "@backend/supabase/auth";
export default async function SettingsPage() {
 const {user}=await requireAdmin();
 return <><div className="admin-page-heading"><div><h1>Settings</h1><p className="admin-muted">Your CMS account and content configuration.</p></div></div><section className="admin-panel"><h2>Account</h2><p>Signed in as {user.email}</p><span className="admin-badge">Administrator</span></section><section className="admin-panel"><h2>Media settings</h2><dl className="admin-media-metadata"><div><dt>Accepted formats</dt><dd>PNG, JPG, WebP</dd></div><div><dt>Maximum file size</dt><dd>3 MB per image</dd></div><div><dt>Project cover</dt><dd>16:9 landscape</dd></div><div><dt>Gallery layouts</dt><dd>6 landscapes, or 3 portraits + 2 landscapes</dd></div><div><dt>Storage access</dt><dd>Private; published assignments are available to visitors</dd></div></dl></section><section className="admin-panel"><h2>Site configuration</h2><p>Your name, contact links, introduction and footer text are under Site Content.</p><Link className="admin-button" href="/admin/content">Edit site details →</Link></section></>;
}
