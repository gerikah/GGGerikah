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
const { externalUrl, projectSchema, draftProjectSchema, settingsSchema, mediaSchema } = validationModule.exports;
const seed = JSON.parse(readFileSync(new URL("../database/seed-data.json", import.meta.url), "utf8"));
const validProject = { title: "Validation fixture", slug: "validation-fixture", short_description: "A test-only input.", role: "Designer", tools: "Next.js, Figma", year: "2026", project_type: "Personal Project", status: "Concept", section_one_heading: "The Idea", section_one_body: "A concise idea.", section_two_heading: "The Build", section_two_body: "A concise build.", gallery_layout: "landscape", live_url: "", repository_url: "", figma_url: "", sort_order: 0 };

test("initial public copy survives UTF-8 ingestion without broken punctuation", () => {
  const content = JSON.stringify(seed);
  assert.doesNotMatch(content, /\uFFFD|â€|[ÃÂ][\u0080-\u00BF]/);
});

test("the public seed cannot recreate old portfolio projects", () => {
  assert.deepEqual(seed.projects, []);
  assert.deepEqual(seed.project_sections, []);
  assert.deepEqual(seed.project_media, []);
});
test("editorial fields enforce limits and required metadata without truncation", () => {
  assert.equal(projectSchema.safeParse(validProject).success, true);
  for (const [field, max] of Object.entries({ title:45, slug:60, short_description:100, role:70, section_one_heading:40, section_two_heading:40, section_one_body:400, section_two_body:400 })) {
    assert.equal(projectSchema.safeParse({...validProject,[field]:"a".repeat(max)}).success,true,field);
    assert.equal(projectSchema.safeParse({...validProject,[field]:"a".repeat(max+1)}).success,false,field);
    assert.equal(projectSchema.safeParse({...validProject,[field]:""}).success,false,field);
  }
  for (const patch of [{year:""},{year:"26"},{status:"Live"},{project_type:"Other"},{gallery_layout:"freeform"},{tools:"a".repeat(26)},{tools:Array(9).fill("React").join(",")}]) assert.equal(projectSchema.safeParse({...validProject,...patch}).success,false);
  assert.equal(mediaSchema.safeParse({alt_text:"a".repeat(161),caption:"",layout:"half",sort_order:0}).success,false);
  assert.equal(mediaSchema.safeParse({alt_text:"Image",caption:"a".repeat(91),layout:"half",sort_order:0}).success,false);
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

test("incomplete drafts retain limits while publication still requires completed copy", () => {
  const draft = {...validProject, short_description:"",role:"",year:"",section_one_heading:"",section_one_body:"",section_two_heading:"",section_two_body:""};
  assert.equal(draftProjectSchema.safeParse(draft).success,true);
  assert.equal(draftProjectSchema.parse(draft).year,null);
  assert.equal(projectSchema.safeParse(draft).success,false);
  for(const patch of [{role:"x".repeat(71)},{section_one_body:"x".repeat(401)},{year:"26"},{live_url:"javascript:alert(1)"},{tools:"x".repeat(26)}]) assert.equal(draftProjectSchema.safeParse({...draft,...patch}).success,false);
});

test("every public contact URL uses the same scheme and credential validation", () => {
  for (const field of ["linkedin_url", "github_url", "resume_url"]) {
    const parsed = settingsSchema.safeParse({ ...seed.site_settings, [field]: "javascript:alert(1)" });
    assert.equal(parsed.success, false, field);
  }
  assert.equal(settingsSchema.safeParse(seed.site_settings).success, true);
});

test("all project link fields require safe URLs when provided", () => {
  for (const field of ["live_url", "repository_url", "figma_url"]) {
    for (const url of ["javascript:alert(1)", "https://user:password@example.com"]) {
      assert.equal(projectSchema.safeParse({ ...validProject, [field]: url }).success, false, field);
    }
    assert.equal(projectSchema.safeParse({ ...validProject, [field]: "https://example.com" }).success, true, field);
  }
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
  const input = validProject;
  for (const slug of ["../admin", "project/../../login", "%2e%2e", "foo?draft=true", "two--hyphens"]) {
    assert.equal(projectSchema.safeParse({ ...input, slug }).success, false, slug);
  }
});
