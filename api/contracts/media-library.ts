export type MediaUsage = { label: string; href: string; category: "cover" | "gallery" | "homepage"; projectId?: string; published: boolean; retained?: boolean };
export type MediaAsset = { id: string; storage_path: string; filename: string; content_type: string; byte_size: number; width: number | null; height: number | null; alt_text: string; created_at: string; deleting: boolean; url: string; usages: MediaUsage[] };
export type AssignmentProject = { id: string; title: string; gallery_layout: "landscape" | "mixed" };
