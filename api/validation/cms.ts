import { z } from "zod";

const text = (max = 500) => z.string().trim().max(max, `Keep this field under ${max} characters.`);
const required = (name: string, max = 500) => text(max).min(1, `${name} is required.`);
const integer = z.coerce.number().int().min(0).max(99999);
export const externalUrl = text(2048).refine((value) => {
  if (!value) return true;
  try { const url = new URL(value); return ["http:", "https:"].includes(url.protocol) && !url.username && !url.password; }
  catch { return false; }
}, "Use a complete http:// or https:// URL.");

export const loginSchema = z.object({
  email: z.email("Enter a valid email address.").max(320),
  password: z.string().min(1, "Enter your password.").max(1024),
});

export const settingsSchema = z.object({
  name: required("Name", 160), role: required("Role", 250), tagline: required("Tagline", 300),
  hero_supporting_copy: text(1000), bio: text(4000), availability_text: text(200),
  email: text(320).refine((value) => !value || z.email().safeParse(value).success, "Enter a valid email address."),
  linkedin_url: externalUrl, github_url: externalUrl, resume_url: externalUrl, footer_copy: text(500),
});

export const projectSchema = z.object({
  title: required("Project title", 45),
  slug: required("Slug", 60).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and single hyphens for the slug."),
  short_description: required("Subtitle", 100), role: required("Role", 70),
  tools: text(214).transform((value) => value.split(/[\n,]/).map((tool) => tool.trim()).filter(Boolean)).refine((items) => items.length <= 8 && items.every((item) => item.length <= 25), "Use up to 8 stack entries, each at most 25 characters."),
  year: z.string().regex(/^\d{4}$/, "Enter a four-digit year.").transform(Number).refine(value => value >= 1900 && value <= 2200, "Use a year between 1900 and 2200."),
  project_type: z.enum(["Personal Project", "Independent Concept", "Academic Project", "Client Work"]),
  status: z.enum(["Concept", "In Progress", "Completed"]),
  section_one_heading: required("First heading", 40), section_one_body: required("First description", 400),
  section_two_heading: required("Second heading", 40), section_two_body: required("Second description", 400),
  gallery_layout: z.enum(["landscape", "mixed"]),
  live_url: externalUrl, repository_url: externalUrl, figma_url: externalUrl, sort_order: integer,
});

export const mediaSchema = z.object({
  alt_text: required("Image description (alt text)", 160), caption: text(90),
  layout: z.enum(["full", "half", "portrait"]), sort_order: integer,
});

// Drafts keep all length, format and range checks, but may omit publish-only copy.
export const draftProjectSchema = projectSchema.extend({
  short_description: text(100), role: text(70),
  year: z.union([z.literal("").transform(() => null), projectSchema.shape.year]),
  section_one_heading: text(40), section_one_body: text(400),
  section_two_heading: text(40), section_two_body: text(400),
});

export const capabilitySchema = z.object({
  title: required("Title", 200), description: text(1000), kind: z.enum(["capability", "process"]),
  sort_order: integer, is_published: z.boolean(),
});

export function formValues(form: FormData, keys: readonly string[]) {
  return Object.fromEntries(keys.map((key) => [key, typeof form.get(key) === "string" ? form.get(key) as string : ""]));
}

export const settingsFields = ["name", "role", "tagline", "hero_supporting_copy", "bio", "availability_text", "email", "linkedin_url", "github_url", "resume_url", "footer_copy"] as const;
export const projectFields = ["title", "slug", "short_description", "role", "tools", "year", "project_type", "status", "live_url", "repository_url", "figma_url", "sort_order", "section_one_heading", "section_one_body", "section_two_heading", "section_two_body", "gallery_layout"] as const;
