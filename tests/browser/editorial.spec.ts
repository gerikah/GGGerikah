import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { createClient } from "@supabase/supabase-js";
import { loadEnvFile } from "node:process";
import { randomUUID } from "node:crypto";
import { mkdir } from "node:fs/promises";

async function captureLoadedPage(page: Page, path: string) {
  for (const image of await page.locator("main img:not(.image-dialog img)").all()) {
    await image.scrollIntoViewIfNeeded();
    await expect.poll(() => image.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBe(true);
  }
  await page.evaluate(async () => { await document.fonts.ready; window.scrollTo({top:0,behavior:"instant"}); (document.activeElement as HTMLElement)?.blur(); await Promise.all(document.getAnimations().map(a => a.finished.catch(() => {}))); });
  await page.screenshot({path,fullPage:true});
}

test("empty public portfolio, responsive layout and protected admin", async ({ page }) => {
  await mkdir(".local/screenshots", { recursive: true });
  for (const width of [1440,768,390]) {
    await page.setViewportSize({ width, height: 1000 }); await page.goto("/");
    await expect(page.locator("#hero-title")).toBeVisible();
    await expect(page.locator(".selected-placeholder")).toHaveCount(3);
    await expect(page.locator(".editorial-portrait")).toHaveCount(2);
    await page.evaluate(() => document.fonts.ready);
    expect(await page.evaluate(() => document.fonts.check('700 32px "Space Mono"') && document.fonts.check('400 16px "Poppins"'))).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await captureLoadedPage(page, `.local/screenshots/home-${width}.png`);
  }
  const accessibility = await new AxeBuilder({page}).analyze();
  expect(accessibility.violations.filter(v => ["critical","serious"].includes(v.impact ?? ""))).toEqual([]);
  await page.goto("/work"); await expect(page.getByText("New work is taking shape.",{exact:false})).toBeVisible();
  await page.goto("/work/off-the-rack"); await expect(page.locator(".case-page")).toHaveCount(0);
  await page.goto("/admin"); await expect(page).toHaveURL(/\/login/);
});

test("real CMS cover, galleries, publishing and homepage lifecycle", async ({ page, browser }) => {
  test.setTimeout(300000);
  page.setDefaultTimeout(15000);
  loadEnvFile("frontend/.env.local");
  const service = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, { auth:{persistSession:false} });
  const anon = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, { auth:{persistSession:false} });
  const tag = randomUUID().slice(0,8), email = `cms-verification-${tag}@example.com`, password = randomUUID()+"Aa1!";
  const slug = `cms-verification-${tag}`;
  const image = "frontend/public/images/logo-white.png";
  const publicContext = await browser.newContext({baseURL:"http://127.0.0.1:3000"}); const publicPage = await publicContext.newPage();
  publicPage.setDefaultTimeout(15000);
  let userId = "", projectId = "";
  const uploadedPaths = new Set<string>();
  const { data: originalHomepage } = await service.from("homepage_content").select("*").eq("id",1).single();
  async function trackFiles() {
    if (projectId) { const {data}=await service.storage.from("portfolio-media").list(projectId); data?.forEach(o=>uploadedPaths.add(`${projectId}/${o.name}`)); }
    const {data:h}=await service.from("homepage_content").select("editorial_one_path,editorial_two_path").eq("id",1).single();
    for (const key of ["editorial_one_path","editorial_two_path"] as const) if(h?.[key] && h[key]!==originalHomepage?.[key]) uploadedPaths.add(h[key]);
  }
  try {
    const created=await service.auth.admin.createUser({email,password,email_confirm:true}); if(created.error) throw created.error;
    userId=created.data.user.id;
    const profile=await service.from("profiles").insert({id:userId,role:"admin"}); if(profile.error) throw profile.error;
    await page.goto("/login"); await page.getByLabel("Email").fill(email); await page.getByLabel("Password").fill(password); await page.getByRole("button",{name:"Enter the archive"}).click(); await expect(page).toHaveURL(/\/admin$/);
    await page.goto("/admin/projects/new");
    const form=page.locator("form.admin-form");
    await form.locator('[name="title"]').fill("CMS verification"); await expect(form.locator('[name="slug"]')).toHaveValue("cms-verification");
    await form.locator('[name="slug"]').fill(slug);
    for(const [name,value] of Object.entries({short_description:"Temporary verification, removed after testing.",role:"Designer and developer",section_one_body:"A short idea used to verify the project editor.",section_two_body:"A short build used to verify the public template.",tools:"Next.js, Supabase"})) await form.locator(`[name="${name}"]`).fill(value);
    await form.locator('[name="cover_file"]').setInputFiles(image); await form.locator('[name="cover_alt"]').fill("Verification cover");
    await expect(form.getByAltText("Selected upload preview")).toBeVisible();
    await form.locator('[name="title"]').fill("x".repeat(46)); await form.getByRole("button",{name:"Save draft"}).click();
    await expect(form.getByText("Check the fields below.",{exact:false})).toBeVisible(); await expect(form.locator('[name="role"]')).toHaveValue("Designer and developer");
    await form.locator('[name="title"]').fill("CMS verification"); await form.getByRole("button",{name:"Save draft"}).click();
    await expect(page).toHaveURL(/\/admin\/projects\/[a-f0-9-]+/); projectId=page.url().match(/projects\/([^?]+)/)![1];
    await trackFiles(); await page.reload(); await expect(page.locator(".admin-cover-preview img")).toBeVisible();
    const {data:saved}=await service.from("projects").select("*").eq("id",projectId).single(); expect(saved.cover_image_url).toMatch(new RegExp(`^${projectId}/`));
    expect((await anon.from("projects").select("id").eq("id",projectId)).data).toEqual([]);
    expect((await anon.storage.from("portfolio-media").createSignedUrl(saved.cover_image_url,60)).error).toBeTruthy();
    const publish=page.locator("#publish form"); await publish.getByRole("checkbox").check(); await publish.getByRole("button",{name:"Publish project"}).click(); await expect(publish.getByText("Complete all 6",{exact:false})).toBeVisible();
    for(let i=0;i<6;i++) {
      const slot=page.locator("#gallery details").filter({has:page.locator("summary",{hasText:`Slot ${i+1} ·`})}).first();
      const upload=slot.locator("form").first(); await upload.locator('[name="file"]').setInputFiles(image); await upload.locator('[name="alt_text"]').fill(`Landscape verification ${i+1}`); await upload.locator('[name="caption"]').fill(`Image ${i+1}`); await upload.getByRole("button",{name:"Upload slot image"}).click(); await expect(upload.getByText("Image saved in the gallery slot.",{exact:false})).toBeVisible();
    }
    await trackFiles(); await expect(page.locator(".gallery-count")).toContainText("6 / 6");
    await publish.getByRole("checkbox").check(); await publish.getByRole("button",{name:"Publish project"}).click(); await expect(page.getByRole("button",{name:"Unpublish",exact:true})).toBeVisible();
    await publicPage.goto(`/work/${slug}`); await expect(publicPage.locator(".visual-board figure")).toHaveCount(6); await expect(publicPage.getByRole("heading",{name:"VISUAL BOARD"})).toBeVisible();
    await publicPage.locator(".visual-image").first().click(); await expect(publicPage.getByRole("dialog")).toBeVisible(); await publicPage.keyboard.press("ArrowRight"); await expect(publicPage.locator(".image-dialog-toolbar span")).toHaveText("2 / 6"); await publicPage.keyboard.press("Escape"); await expect(publicPage.getByRole("dialog")).not.toBeVisible(); await expect(publicPage.locator(".visual-image").first()).toBeFocused();
    await captureLoadedPage(publicPage,".local/screenshots/project-landscape.png");
    await page.goto("/admin/homepage"); await page.locator('[name="featured_project_id"]').selectOption(projectId); await page.locator('[name="secondary_one_id"]').selectOption(projectId); await page.getByRole("button",{name:"Save homepage projects"}).click(); await expect(page.getByText("Choose a different project",{exact:false})).toBeVisible(); await page.locator('[name="secondary_one_id"]').selectOption(""); await page.getByRole("button",{name:"Save homepage projects"}).click(); await expect(page.getByText("Homepage projects saved.")).toBeVisible();
    const editorialForms=page.locator("form").filter({has:page.locator('input[type="file"]')});
    for(let i=0;i<2;i++) { const ef=editorialForms.nth(i); await ef.locator('[name="file"]').setInputFiles(image); await ef.locator('[name="alt_text"]').fill(`Editorial verification ${i+1}`); await ef.getByRole("button",{name:"Upload editorial image"}).click(); await expect(ef.getByText("Editorial image saved.")).toBeVisible(); }
    await trackFiles(); await publicPage.goto("/"); await expect(publicPage.locator(".selected-project")).toHaveCount(1); await expect(publicPage.locator(".editorial-portrait img")).toHaveCount(2); await publicPage.locator(".selected-project").click(); await expect(publicPage).toHaveURL(new RegExp(slug));
    await page.goto(`/admin/projects/${projectId}`); const unpublish=page.locator("#publish form"); await unpublish.getByRole("checkbox").check(); await unpublish.getByRole("button",{name:"Unpublish",exact:true}).click(); await expect(page.getByRole("button",{name:"Publish project",exact:true})).toBeVisible();
    const {data:clearedHomepage}=await service.from("homepage_content").select("featured_project_id").eq("id",1).single(); expect(clearedHomepage?.featured_project_id).toBeNull();
    const removeCover=page.locator("#cover form").filter({has:page.getByRole("button",{name:"Remove cover",exact:true})}); await removeCover.getByRole("checkbox").check(); await removeCover.getByRole("button",{name:"Remove cover",exact:true}).click(); await expect(page.locator(".admin-cover-preview")).toHaveCount(0);
    const addCover=page.locator("#cover form").first(); await addCover.locator('[name="file"]').setInputFiles({name:"too-large.png",mimeType:"image/png",buffer:Buffer.alloc(3*1024*1024+1)}); await expect(addCover.getByRole("alert")).toContainText("no larger than 3 MB"); await addCover.locator('[name="file"]').setInputFiles(image); await addCover.locator('[name="cover_alt"]').fill("Restored draft cover"); await addCover.getByRole("button",{name:"Upload cover",exact:true}).click(); await expect(page.locator(".admin-cover-preview img")).toBeVisible(); await trackFiles();
    const firstSlot=page.locator(".admin-gallery-slots > details").first(); const firstUpload=firstSlot.locator("form").first(); await firstUpload.locator('[name="file"]').setInputFiles(image); await firstUpload.locator('[name="alt_text"]').fill("Replacement gallery image"); await firstUpload.getByRole("button",{name:"Replace slot image"}).click(); await expect(firstUpload.getByText("Image saved in the gallery slot.",{exact:false})).toBeVisible(); await expect(page.getByRole("heading",{name:"Unassigned media (1)"})).toBeVisible();
    const move=firstSlot.locator("form").filter({has:page.locator('[name="slot"]')}); await move.locator("select").selectOption("1"); await move.getByRole("button",{name:"Update position"}).click(); await expect(move.getByText("Gallery updated.",{exact:false})).toBeVisible();
    const {data:swapped}=await service.from("project_media").select("alt_text,slot").eq("project_id",projectId).eq("slot",1).single(); expect(swapped?.alt_text).toBe("Replacement gallery image");
    const secondSlot=page.locator(".admin-gallery-slots > details").nth(1); const removeSlot=secondSlot.locator("form").filter({has:page.locator('[name="slot"]')}); await removeSlot.locator("select").selectOption("unassigned"); await removeSlot.getByRole("button",{name:"Update position"}).click(); await expect(page.locator(".gallery-count")).toContainText("5 / 6");
    const retained=page.locator(".admin-unassigned details").filter({has:page.locator("summary",{hasText:"Replacement gallery image"})}); await retained.locator("summary").click(); await retained.locator("select").selectOption("1"); await retained.getByRole("button",{name:"Update position"}).click(); await expect(page.locator(".gallery-count")).toContainText("6 / 6"); await trackFiles();
    const details=page.locator("#details form"); await details.locator('[value="mixed"]').check(); await details.getByRole("button",{name:"Save project details"}).click(); await expect(details.getByText("Project saved.",{exact:false})).toBeVisible(); await expect(page.locator(".gallery-count")).toContainText("2 / 5"); await expect(page.getByRole("heading",{name:"Unassigned media (5)"})).toBeVisible();
    for(let i=0;i<3;i++) { const slot=page.locator("#gallery details").filter({has:page.locator("summary",{hasText:`Slot ${i+1} ·`})}).first(); const upload=slot.locator("form").first(); await upload.locator('[name="file"]').setInputFiles(image); await upload.locator('[name="alt_text"]').fill(`Portrait verification ${i+1}`); await upload.getByRole("button",{name:"Upload slot image"}).click(); await expect(upload.getByText("Image saved in the gallery slot.",{exact:false})).toBeVisible(); }
    await trackFiles(); await page.locator("#publish form").getByRole("checkbox").check(); await page.getByRole("button",{name:"Publish project",exact:true}).click(); await expect(page.getByRole("button",{name:"Unpublish",exact:true})).toBeVisible();
    await publicPage.goto(`/work/${slug}`); await expect(publicPage.locator(".visual-board .is-portrait")).toHaveCount(3); await expect(publicPage.locator(".visual-board .is-landscape")).toHaveCount(2);
    expect((await anon.from("project_media").select("id").eq("project_id",projectId)).data).toHaveLength(5);
    for(const width of [1440,768,390]) { await publicPage.setViewportSize({width,height:1000}); expect(await publicPage.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true); await captureLoadedPage(publicPage,`.local/screenshots/project-mixed-${width}.png`); }
    const caseAccessibility=await new AxeBuilder({page:publicPage}).analyze(); expect(caseAccessibility.violations.filter(v=>["critical","serious"].includes(v.impact??""))).toEqual([]);
    const coverForm=page.locator("#cover form").first(); await coverForm.locator('[name="file"]').setInputFiles(image); await coverForm.locator('[name="cover_alt"]').fill("Replacement verification cover"); await coverForm.getByRole("button",{name:"Replace cover"}).click(); await expect(coverForm.getByRole("button",{name:"Replace cover"})).toBeEnabled(); await expect(page.locator(".admin-cover-preview img")).toHaveAttribute("alt","Replacement verification cover"); await trackFiles(); await page.reload(); await expect(page.locator(".admin-cover-preview img")).toHaveAttribute("alt","Replacement verification cover");
    await page.getByLabel("Permanently delete CMS verification and its project records.").check(); await page.getByRole("button",{name:"Delete project",exact:true}).click(); await expect(page).toHaveURL(/\/admin\?notice=deleted/); await publicPage.goto("/work"); await expect(publicPage.locator(".selected-project")).toHaveCount(0);
  } finally {
    await trackFiles();
    if(projectId) await service.from("projects").delete().eq("id",projectId);
    else await service.from("projects").delete().eq("slug",slug);
    if(originalHomepage) await service.from("homepage_content").update(originalHomepage).eq("id",1);
    if(uploadedPaths.size) await service.storage.from("portfolio-media").remove([...uploadedPaths]);
    if(userId) await service.auth.admin.deleteUser(userId);
    await publicContext.close();
  }
});
