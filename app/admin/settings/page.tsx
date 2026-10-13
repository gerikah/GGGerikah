import { requireAdmin } from "@/lib/supabase/auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { ActionForm, Field } from "@/components/admin/action-form";
import { saveSettings } from "../actions";

export default async function SettingsPage() {
  if (!isSupabaseConfigured()) return null;
  const { supabase } = await requireAdmin();
  const { data: settings, error } = await supabase.from("site_settings").select("*").eq("id", 1).maybeSingle();
  return <><div className="admin-page-heading"><div><p className="admin-eyebrow">IDENTITY / CONTACT / DETAILS</p><h1>Notes about you.</h1><p className="admin-muted">These details appear throughout the homepage and footer. Empty contact fields remain hidden.</p></div></div>
    {error ? <div className="admin-message is-error">Settings could not be loaded. Check your connection and database migration, then refresh.</div> : <section className="admin-panel"><ActionForm action={saveSettings}>
      <div className="admin-grid"><Field label="Name" name="name" value={settings?.name} required /><Field label="Role" name="role" value={settings?.role} required /></div>
      <Field label="Primary statement / tagline" name="tagline" value={settings?.tagline} required />
      <Field label="Hero supporting copy" name="hero_supporting_copy" value={settings?.hero_supporting_copy} multiline rows={3} />
      <Field label="Short bio" name="bio" value={settings?.bio} multiline rows={5} />
      <Field label="Availability" name="availability_text" value={settings?.availability_text} hint="Use your current, verified availability. Leave blank to hide it." />
      <div className="admin-grid"><Field label="Email" name="email" value={settings?.email} type="email" /><Field label="LinkedIn URL" name="linkedin_url" value={settings?.linkedin_url} type="url" /><Field label="GitHub URL" name="github_url" value={settings?.github_url} type="url" /><Field label="Résumé URL" name="resume_url" value={settings?.resume_url} type="url" hint="Link to an accessible hosted résumé using http(s)." /></div>
      <Field label="Footer copy" name="footer_copy" value={settings?.footer_copy} />
    </ActionForm></section>}
  </>;
}
