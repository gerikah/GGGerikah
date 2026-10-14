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
  title: required("Project title", 200),
  slug: required("Slug", 160).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and single hyphens for the slug."),
  project_number: z.coerce.number().int().min(1).max(9999), category: required("Category", 250),
  short_description: required("Short description", 600), overview: text(8000), role: text(600),
  tools: text(1000).transform((value) => value.split(/[\n,]/).map((tool) => tool.trim()).filter(Boolean)).refine((items) => items.length <= 30 && items.every((item) => item.length <= 100), "Use up to 30 tools, each under 100 characters."),
  year: z.string().trim().transform((value) => value ? Number(value) : null).refine((value) => value === null || (Number.isInteger(value) && value >= 1900 && value <= 2100), "Use a year between 1900 and 2100, or leave it blank."),
  project_type: required("Project type", 200), status: text(200),
  live_url: externalUrl, repository_url: externalUrl, sort_order: integer,
});

export const sectionSchema = z.object({
  section_type: z.enum(["text", "image", "image_pair", "gallery", "quote", "split", "tools", "full_width", "reflection", "external_link"]),
  heading: text(300).transform((value) => value || null), body: text(12000), sort_order: integer,
}).superRefine((value, context) => {
  if (value.section_type === "external_link" && (!value.body || !externalUrl.safeParse(value.body).success)) {
    context.addIssue({code: "custom", path: ["body"], message: "External link content must be a complete http:// or https:// URL."});
  }
});

export const mediaSchema = z.object({
  alt_text: required("Image description (alt text)", 500), caption: text(1000),
  layout: z.enum(["full", "half", "portrait"]), sort_order: integer,
});

export const capabilitySchema = z.object({
  title: required("Title", 200), description: text(1000), kind: z.enum(["capability", "process"]),
  sort_order: integer, is_published: z.boolean(),
});

export function formValues(form: FormData, keys: readonly string[]) {
  return Object.fromEntries(keys.map((key) => [key, typeof form.get(key) === "string" ? form.get(key) as string : ""]));
}

export const settingsFields = ["name", "role", "tagline", "hero_supporting_copy", "bio", "availability_text", "email", "linkedin_url", "github_url", "resume_url", "footer_copy"] as const;
export const projectFields = ["title", "slug", "project_number", "category", "short_description", "overview", "role", "tools", "year", "project_type", "status", "live_url", "repository_url", "sort_order"] as const;
