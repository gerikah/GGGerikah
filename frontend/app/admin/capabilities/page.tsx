import { requireAdmin } from "@backend/supabase/auth";
import { isSupabaseConfigured } from "@backend/supabase/config";
import type { Capability } from "@api/contracts/cms";
import { ActionForm, Field } from "@frontend/components/admin/action-form";
import { deleteCapability, saveCapability } from "@api/actions/admin";

function CapabilityFields({ item, order = 0, defaultKind = "capability" }: { item?: Capability; order?: number; defaultKind?: "capability" | "process" | "tool" }) {
  return <><div className="admin-grid"><Field label="Title" name="title" value={item?.title} required /><label className="admin-field"><span>Section</span><select name="kind" defaultValue={item?.kind ?? defaultKind}><option value="capability">About / capability</option><option value="process">How I work / process step</option><option value="tool">Tools and Technology</option></select></label></div><Field label="Description" name="description" value={item?.description} multiline rows={3} /><div className="admin-grid"><label className="admin-field"><span>Technology logo</span><select name="logo_key" defaultValue={item?.logo_key ?? ""}><option value="">No logo</option><option value="figma">Figma</option><option value="javascript">JavaScript</option><option value="html5">HTML5</option><option value="css3">CSS3</option><option value="react">React</option><option value="nextjs">Next.js</option><option value="typescript">TypeScript</option><option value="nodejs">Node.js</option><option value="supabase">Supabase</option><option value="postgresql">PostgreSQL</option><option value="git">Git</option><option value="vercel">Vercel</option></select><small>Used for tools; logo choices use the available Devicon assets.</small></label><label className="admin-field"><span>Proficiency level</span><select name="proficiency_level" defaultValue={item?.proficiency_level?.toString() ?? ""}><option value="">Not set</option>{[1, 2, 3, 4, 5].map(level => <option key={level} value={level}>{level} / 5</option>)}</select></label></div><Field label="Display order" name="sort_order" value={item?.sort_order ?? order} type="number" min={0} hint="Lower numbers appear first within the selected section." /><label className="admin-checkbox"><input type="checkbox" name="is_published" value="yes" defaultChecked={item?.is_published ?? false} />{(item?.kind ?? defaultKind) === "process" ? "Published workflow record" : "Visible on the public homepage"}</label></>;
}

export default async function CapabilitiesPage({ searchParams }: { searchParams: Promise<{kind?: string}> }) {
  if (!isSupabaseConfigured()) return null;
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase.from("capabilities").select("*").order("kind").order("sort_order");
  const { kind } = await searchParams;
  const section = kind === "process" ? "process" : kind === "tool" ? "tool" : "capability";
  const items = ((data ?? []) as Capability[]).filter(item => item.kind === section);
  const title = section === "process" ? "Workflow" : section === "tool" ? "Tools and Technology" : "Capabilities";
  return <><div className="admin-page-heading"><div><p className="admin-eyebrow">SITE CONTENT</p><h1>{title}</h1><p className="admin-muted">{section === "tool" ? "Manage the technologies, logos, and proficiency levels displayed on your homepage." : "A concise set of strengths and steps. Keep each one specific and grounded in your experience."}</p></div></div>
    {kind === "process" && <p className="admin-message">Published workflow steps appear in the interactive “From question to delivery” section on your homepage.</p>}
    {error ? <div className="admin-message is-error">Items could not be loaded. Check your connection and database migration, then refresh.</div> : <section className="admin-panel">{!items.length && <p className="admin-empty-note">No items yet. Add one below.</p>}
      {items.map((item) => <details key={item.id} className="admin-editor-item"><summary><span>{item.kind.toUpperCase()} / {String(item.sort_order).padStart(2, "0")}</span><strong>{item.title}</strong><span className={`admin-badge ${item.is_published ? "is-published" : ""}`}>{item.is_published ? "Visible" : "Hidden"}</span></summary><div className="admin-editor-item-body"><ActionForm action={saveCapability.bind(null, item.id)} submitLabel="Save item"><CapabilityFields item={item} /></ActionForm><ActionForm action={deleteCapability.bind(null, item.id)} className="admin-delete-form" submitLabel="Delete item" confirmLabel="Permanently delete this item." danger /></div></details>)}
      <details className="admin-editor-item admin-add-item"><summary>+ Add {section === "tool" ? "a technology" : section === "process" ? "a process step" : "a capability"}</summary><div className="admin-editor-item-body"><ActionForm action={saveCapability.bind(null, null)} submitLabel="Add item"><CapabilityFields order={items.length} defaultKind={section} /></ActionForm></div></details>
    </section>}
  </>;
}
