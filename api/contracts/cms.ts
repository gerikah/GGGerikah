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
  section_one_heading: string;
  section_one_body: string;
  section_two_heading: string;
  section_two_body: string;
  gallery_layout: "landscape" | "mixed";
  figma_url: string;
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

export interface ProjectMedia {
  slot: number | null;
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

export interface HomepageContent {
  id: 1;
  featured_project_id: string | null;
  secondary_one_id: string | null;
  secondary_two_id: string | null;
  editorial_one_path: string;
  editorial_one_alt: string;
  editorial_two_path: string;
  editorial_two_alt: string;
  editorial_one_url?: string;
  editorial_two_url?: string;
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
  media: ProjectMedia[];
}

export interface SeedData {
  site_settings: SiteSettings;
  projects: Project[];
  project_sections: never[];
  project_media: ProjectMedia[];
  capabilities: Capability[];
}
