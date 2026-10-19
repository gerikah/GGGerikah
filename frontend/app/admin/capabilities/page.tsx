import { requireAdmin } from "@backend/supabase/auth";
import { isSupabaseConfigured } from "@backend/supabase/config";
import type { Capability } from "@api/contracts/cms";
import { ActionForm, Field } from "@frontend/components/admin/action-form";
import { deleteCapability, saveCapability } from "@api/actions/admin";

function CapabilityFields({ item, order = 0, defaultKind = "capability" }: { item?: Capability; order?: number; defaultKind?: "capability" | "process" }) {
  return <><div className="admin-grid"><Field label="Title" name="title" value={item?.title} required /><label className="admin-field"><span>Section</span><select name="kind" defaultValue={item?.kind ?? defaultKind}><option value="capability">About / capability</option><option value="process">How I work / process step</option></select></label></div><Field label="Description" name="description" value={item?.description} multiline rows={3} /><Field label="Display order" name="sort_order" value={item?.sort_order ?? order} type="number" min={0} hint="Lower numbers appear first within the selected section." /><label className="admin-checkbox"><input type="checkbox" name="is_published" value="yes" defaultChecked={item?.is_published ?? false} />{(item?.kind ?? defaultKind) === "process" ? "Published workflow record" : "Visible on the public homepage"}</label></>;
}

export default async function CapabilitiesPage({ searchParams }: { searchParams: Promise<{kind?: string}> }) {
  if (!isSupabaseConfigured()) return null;
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase.from("capabilities").select("*").order("kind").order("sort_order");
  const { kind } = await searchParams;
  const items = ((data ?? []) as Capability[]).filter(item => item.kind === (kind === "process" ? "process" : "capability"));
  return <><div className="admin-page-heading"><div><p className="admin-eyebrow">CAPABILITIES / PROCESS</p><h1>{kind === "process" ? "Workflow" : "Capabilities"}</h1><p className="admin-muted">A concise set of strengths and steps. Keep each one specific and grounded in your experience.</p></div></div>
    {kind === "process" && <p className="admin-message">These saved workflow records remain editable. The homepage keeps the fixed eight-step method from your current design.</p>}
    {error ? <div className="admin-message is-error">Items could not be loaded. Check your connection and database migration, then refresh.</div> : <section className="admin-panel">{!items.length && <p className="admin-empty-note">No items yet. Add a capability or process step below.</p>}
      {items.map((item) => <details key={item.id} className="admin-editor-item"><summary><span>{item.kind.toUpperCase()} / {String(item.sort_order).padStart(2, "0")}</span><strong>{item.title}</strong><span className={`admin-badge ${item.is_published ? "is-published" : ""}`}>{item.is_published ? "Visible" : "Hidden"}</span></summary><div className="admin-editor-item-body"><ActionForm action={saveCapability.bind(null, item.id)} submitLabel="Save item"><CapabilityFields item={item} /></ActionForm><ActionForm action={deleteCapability.bind(null, item.id)} className="admin-delete-form" submitLabel="Delete item" confirmLabel="Permanently delete this item." danger /></div></details>)}
      <details className="admin-editor-item admin-add-item"><summary>+ Add a capability or process step</summary><div className="admin-editor-item-body"><ActionForm action={saveCapability.bind(null, null)} submitLabel="Add item"><CapabilityFields order={items.length} defaultKind={kind === "process" ? "process" : "capability"} /></ActionForm></div></details>
    </section>}
  </>;
}
