import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import Module, { createRequire } from "node:module";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

// Execute the actual TypeScript validators without requiring a running Next server.
// TypeScript is already a development dependency; this also works on Node 20.
const require = createRequire(import.meta.url);
const ts = require("typescript");
const validationPath = fileURLToPath(new URL("../api/validation/cms.ts", import.meta.url));
const compiled = ts.transpileModule(readFileSync(validationPath, "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const validationModule = new Module(validationPath);
validationModule.filename = validationPath;
validationModule.paths = Module._nodeModulePaths(dirname(validationPath));
validationModule._compile(compiled, validationPath);
const { externalUrl, projectSchema, settingsSchema, sectionSchema, mediaSchema } = validationModule.exports;
const seed = JSON.parse(readFileSync(new URL("../database/seed-data.json", import.meta.url), "utf8"));

test("initial public copy survives UTF-8 ingestion without broken punctuation", () => {
  const content = JSON.stringify(seed);
  assert.doesNotMatch(content, /\uFFFD|â€|[ÃÂ][\u0080-\u00BF]/);
});

test("verified initial projects can be saved without inventing year or status", () => {
  for (const project of seed.projects) {
    const input = { ...project, tools: project.tools.join(", "), year: project.year?.toString() ?? "" };
    const parsed = projectSchema.safeParse(input);
    assert.ok(parsed.success, `${project.title}: ${parsed.error?.message}`);
    assert.equal(parsed.data.year, null);
    assert.equal(parsed.data.status, "");
  }
});

test("external links reject script schemes, embedded credentials, and relative addresses", () => {
  for (const value of [
    "javascript:alert(document.cookie)",
    "JaVaScRiPt:alert(1)",
    "data:text/html,<script>alert(1)</script>",
    "vbscript:msgbox(1)",
    "file:///C:/private.txt",
    "//example.com/project",
    "/admin",
    "https://user:password@example.com/project",
  ]) {
    assert.equal(externalUrl.safeParse(value).success, false, value);
  }
  for (const value of ["", "https://example.com/project?view=case-study", "http://localhost:3000/work/example"]) {
    assert.equal(externalUrl.safeParse(value).success, true, value);
  }
});

test("every public contact URL uses the same scheme and credential validation", () => {
  for (const field of ["linkedin_url", "github_url", "resume_url"]) {
    const parsed = settingsSchema.safeParse({ ...seed.site_settings, [field]: "javascript:alert(1)" });
    assert.equal(parsed.success, false, field);
  }
  assert.equal(settingsSchema.safeParse(seed.site_settings).success, true);
});

test("external-link story blocks require an actual safe URL", () => {
  for (const body of ["", "javascript:alert(1)", "https://user:password@example.com"]) {
    assert.equal(sectionSchema.safeParse({ section_type: "external_link", heading: "", body, sort_order: "0" }).success, false);
  }
  assert.equal(sectionSchema.safeParse({ section_type: "external_link", heading: "More", body: "https://example.com", sort_order: "0" }).success, true);
});

test("meaningful uploaded images cannot be saved with empty alt text", () => {
  for (const alt_text of ["", "   "]) {
    assert.equal(mediaSchema.safeParse({ alt_text, caption: "", layout: "full", sort_order: "0" }).success, false);
  }
  for (const media of seed.project_media) {
    assert.equal(mediaSchema.safeParse(media).success, true, media.storage_path);
  }
});

test("project slugs cannot address another route or carry encoded path traversal", () => {
  const project = seed.projects[0];
  const input = { ...project, tools: project.tools.join(", "), year: "" };
  for (const slug of ["../admin", "project/../../login", "%2e%2e", "foo?draft=true", "two--hyphens"]) {
    assert.equal(projectSchema.safeParse({ ...input, slug }).success, false, slug);
  }
});
