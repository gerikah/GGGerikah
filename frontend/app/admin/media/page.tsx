import { requireAdmin } from "@backend/supabase/auth";
import { getMediaLibrary } from "@backend/cms/library";
import { MediaLibrary } from "@frontend/components/admin/media-library";
export default async function MediaPage({ searchParams }: { searchParams: Promise<{ category?: string; project?: string }> }) {
 const { supabase }=await requireAdmin();
 const [assets,result,query]=await Promise.all([getMediaLibrary(supabase),supabase.from("projects").select("id,title,gallery_layout").order("title"),searchParams]);
 if(result.error) throw new Error("Unable to load project destinations.");
 return <><div className="admin-page-heading"><div><p className="admin-eyebrow">YOUR IMAGE COLLECTION</p><h1>Media Library</h1><p className="admin-muted">Upload, reuse and manage your portfolio images.</p></div></div><MediaLibrary key={`${query.category}-${query.project}`} assets={assets} projects={result.data} initialCategory={query.category} initialProject={query.project} /></>;
}
