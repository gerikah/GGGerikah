export interface SiteSettings {
  id: 1;
  name: string;
  role: string;
  tagline: string;
  hero_supporting_copy: string;
  bio: string;
  availability_text: string;
  email: string;
  linkedin_url: string;
  github_url: string;
  resume_url: string;
  footer_copy: string;
}

export interface Project {
  id: string;
  title: string;
  slug: string;
  project_number: number;
  category: string;
  short_description: string;
  overview: string;
  role: string;
  tools: string[];
  year: number | null;
  project_type: string;
  status: string;
  live_url: string;
  repository_url: string;
  cover_image_url: string;
  cover_alt: string;
  is_published: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export const sectionTypes = [
  "text", "image", "image_pair", "gallery", "quote", "split",
  "tools", "full_width", "reflection", "external_link",
] as const;

export type SectionType = (typeof sectionTypes)[number];

export interface ProjectSection {
  id: string;
  project_id: string;
  section_type: SectionType;
  heading: string | null;
  body: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ProjectMedia {
  id: string;
  project_id: string;
  storage_path: string;
  alt_text: string;
  caption: string;
  media_type: string;
  layout: string;
  sort_order: number;
  created_at: string;
  /** A local asset URL or a short-lived Storage URL, resolved on the server. */
  url?: string;
}

export interface Capability {
  id: string;
  kind: "capability" | "process";
  title: string;
  description: string;
  sort_order: number;
  is_published: boolean;
}

export interface CaseStudy {
  project: Project;
  sections: ProjectSection[];
  media: ProjectMedia[];
}

export interface SeedData {
  site_settings: SiteSettings;
  projects: Project[];
  project_sections: ProjectSection[];
  project_media: ProjectMedia[];
  capabilities: Capability[];
}
