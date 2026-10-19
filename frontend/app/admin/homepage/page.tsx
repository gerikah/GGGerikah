import { requireAdmin } from "@backend/supabase/auth";
import { getHomepage } from "@backend/cms/data";
import { getMediaLibrary } from "@backend/cms/library";
import { resolveMediaUrl } from "@backend/cms/media";
import { ImageTile } from "@frontend/components/admin/image-tile";
import { HomepageAssignments } from "@frontend/components/admin/homepage-assignments";
import { ActionForm, Field } from "@frontend/components/admin/action-form";
import { saveEditorialImage, saveEditorialAlt } from "@api/actions/editorial";
export default async function HomepageEditor() {
 const {supabase}=await requireAdmin();
 const [homepage,result,assets]=await Promise.all([getHomepage(),supabase.from("projects").select("id,title,cover_image_url,cover_alt").eq("is_published",true).order("title"),getMediaLibrary(supabase)]);
 if(result.error) throw new Error("Unable to load published projects.");
 const projects=await Promise.all(result.data.map(async p=>({...p,cover:await resolveMediaUrl(p.cover_image_url,supabase)})));
 const slots=[{field:"featured_project_id",title:"1 · Large featured project",id:homepage.featured_project_id},{field:"secondary_one_id",title:"2 · Secondary project",id:homepage.secondary_one_id},{field:"secondary_two_id",title:"3 · Secondary project",id:homepage.secondary_two_id}];
 return <><div className="admin-page-heading"><div><h1>Homepage</h1><p className="admin-muted">Choose the work and portraits that introduce you.</p></div></div><section className="admin-panel"><h2>Selected Work</h2><p>Choose up to three different published projects. Empty positions keep their public placeholders.</p><HomepageAssignments slots={slots} projects={projects} /></section><section className="admin-panel"><h2>Homepage images</h2><p>Two editorial portraits, independent of your project covers. Recommended 450 × 850 px (9:17); PNG, JPG or WebP, up to 3 MB.</p><div className="admin-grid">{(["one","two"] as const).map((position,i)=><ImageTile key={position} title={`Editorial image ${i+1}`} url={homepage[`editorial_${position}_url`]} alt={homepage[`editorial_${position}_alt`]} portrait upload={saveEditorialImage.bind(null,position)} assets={assets} target={`homepage-${position}`} remove={homepage[`editorial_${position}_path`]?saveEditorialImage.bind(null,position):undefined} removeFields={<input type="hidden" name="remove" value="yes" />} controls={<ActionForm action={saveEditorialAlt.bind(null,position)} submitLabel="Save image alt text"><Field name="alt_text" label="Image alt text" value={homepage[`editorial_${position}_alt`]} limit={160} required /></ActionForm>} />)}</div></section></>;
}
