import { test, expect, type Page, type Locator } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { createClient } from "@supabase/supabase-js";
import { loadEnvFile } from "node:process";
import { randomUUID, randomInt } from "node:crypto";
import { mkdir } from "node:fs/promises";
import sharp from "sharp";

test("public portfolio remains responsive and CMS routes require authentication", async ({ page }) => {
 await mkdir(".local/screenshots",{recursive:true});
 for(const width of [1440,768,390]) {
  await page.setViewportSize({width,height:1000}); await page.goto("/");
  await expect(page.locator("#hero-title")).toBeVisible();
  await expect(page.locator(".editorial-portrait")).toHaveCount(2);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 }
 for(const route of ["/admin","/admin/media","/admin/projects/new","/admin/homepage"]) {await page.goto(route);await expect(page).toHaveURL(/\/login/);}
});

async function confirm(page: Page) { await page.getByRole("dialog",{name:"Confirm change",exact:true}).getByRole("button",{name:"Confirm",exact:true}).click(); }
async function closeEditor(page: Page) { await page.getByRole("button",{name:"Close image editor"}).click(); }
async function waitSaved(form: Locator) { await expect(form.locator(".admin-message.is-success")).toBeVisible(); }
async function screenshot(page: Page,name: string) {
 await page.evaluate(()=>document.fonts.ready);
 for(const image of await page.locator("main img:not(dialog img)").all()) {
  await image.evaluate((el:HTMLImageElement)=>{el.loading="eager";});
  await expect.poll(()=>image.evaluate((el:HTMLImageElement)=>el.complete&&el.naturalWidth>0)).toBe(true);
 }
 await page.screenshot({path:`.local/screenshots/${name}.png`,fullPage:true});
}

test("CMS drafts, image tiles, library reuse, publication, homepage and mobile navigation", async ({page,browser})=>{
 test.setTimeout(480000); page.setDefaultNavigationTimeout(30000); loadEnvFile("frontend/.env.local");
 const service=createClient(process.env.SUPABASE_URL!,process.env.SUPABASE_SECRET_KEY!,{auth:{persistSession:false}});
 const anon=createClient(process.env.SUPABASE_URL!,process.env.SUPABASE_PUBLISHABLE_KEY!,{auth:{persistSession:false}});
 const migration=await service.from("media_assets").select("id",{head:true,count:"exact"});
 expect(migration.error,"Apply the CMS workspace migration before running this integration test").toBeNull();
 const tag=randomUUID().slice(0,8), slug=`cms-workspace-${tag}`, email=`${slug}@example.com`,password=randomUUID()+"Aa1!";
 const png=await sharp({create:{width:640,height:360,channels:4,background:{r:randomInt(256),g:randomInt(256),b:randomInt(256),alpha:1}}}).png().toBuffer();
 const replacementPng=await sharp({create:{width:480,height:640,channels:4,background:{r:randomInt(256),g:randomInt(256),b:randomInt(256),alpha:1}}}).png().toBuffer();
 const file={name:`${slug}.png`,mimeType:"image/png",buffer:png}, replacement={name:`${slug}-replacement.png`,mimeType:"image/png",buffer:replacementPng};
 const publicContext=await browser.newContext({baseURL:"http://127.0.0.1:3000"}),publicPage=await publicContext.newPage();
 const originalHomepage=(await service.from("homepage_content").select("*").eq("id",1).single()).data;
 const originalSettings=(await service.from("site_settings").select("*").eq("id",1).single()).data;
 const originalCapabilities=(await service.from("capabilities").select("*").order("id")).data;
 let userId="",projectId="",homePath="",assignedHome=false;
 const pageErrors:string[]=[];page.on("pageerror",e=>pageErrors.push(e.message));
 // Discard navigation warnings only when a test explicitly navigates away after a rejected input.
 page.on("dialog",dialog=>dialog.accept());
 try {
  const account=await service.auth.admin.createUser({email,password,email_confirm:true});if(account.error) throw account.error;userId=account.data.user.id;
  const profile=await service.from("profiles").insert({id:userId,role:"admin"});if(profile.error)throw profile.error;
  await page.goto("/login");await page.getByLabel("Email").fill(email);await page.getByLabel("Password").fill(password);await page.getByRole("button",{name:"Enter the archive"}).click();await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByRole("heading",{name:"Dashboard",exact:true})).toBeVisible();
  await screenshot(page,"cms-dashboard-desktop");
  await page.getByRole("button",{name:"Collapse sidebar"}).click();await expect(page.locator(".admin-workspace")).toHaveClass(/sidebar-collapsed/);await page.getByRole("button",{name:"Expand sidebar"}).click();
  await page.setViewportSize({width:390,height:844});await page.getByRole("button",{name:"Open navigation"}).click();await page.getByRole("dialog").getByRole("link",{name:"All projects",exact:true}).click();await expect(page).toHaveURL(/\/admin\/projects$/);await expect(page.locator(".admin-mobile-drawer")).not.toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await screenshot(page,"cms-projects-mobile");
  await page.setViewportSize({width:1440,height:1000});
  for(const path of ["/admin/projects/2e5a114e-111a-4dac-8950-ff7631bd5b1b?notice=created","/admin/projects/not-a-valid-id"]) {await page.goto(path);await expect(page).toHaveURL(/notice=project-unavailable/);await expect(page.getByRole("status")).toContainText("That project is no longer available.");}
  await page.goto("/admin/projects/new");
  const details=page.locator("#project-details");
  await details.locator('[name="title"]').fill("CMS workspace verification");await details.locator('[name="slug"]').fill(slug);
  await page.getByRole("navigation",{name:"Project steps"}).getByRole("button",{name:"2 Images"}).click();
  await expect(page).toHaveURL(/step=images/);projectId=page.url().match(/projects\/([^?]+)/)![1];
  await expect(page.getByRole("navigation",{name:"CMS navigation",exact:true}).getByRole("link",{name:"All projects",exact:true})).toHaveAttribute("aria-current","page");
  expect((await service.from("projects").select("id").eq("slug",slug)).data).toHaveLength(1);
  await expect(page.locator(".gallery-count")).toContainText("0 / 6");
  await page.goto(`/admin/projects/${projectId}?step=review`);await expect(page.getByRole("button",{name:"Publish project",exact:true})).toBeDisabled();await expect(page.getByText("Missing image: Landscape slot 2.",{exact:false})).toBeVisible();
  await page.goto(`/admin/projects/${projectId}?step=images`);
  const coverTile=page.locator(".admin-image-tile").filter({has:page.getByRole("heading",{name:"Project cover",exact:true})});
  const picker=page.waitForEvent("filechooser");await coverTile.getByRole("button",{name:"Add image: Project cover",exact:true}).click();await (await picker).setFiles(file);
  let editor=page.getByRole("dialog",{name:"Project cover",exact:true});let upload=editor.locator("form").filter({has:page.locator('input[type="file"]')});
  await expect(upload.getByAltText("Selected upload preview")).toBeVisible();await upload.locator('[name="cover_alt"]').fill("Verification cover");await upload.getByRole("button",{name:"Upload image",exact:true}).click();await waitSaved(upload);await closeEditor(page);
  await page.reload();await expect(coverTile.locator(".admin-tile-image img")).toBeVisible();
  const cover=(await service.from("projects").select("cover_image_url").eq("id",projectId).single()).data!.cover_image_url;
  expect((await anon.storage.from("portfolio-media").createSignedUrl(cover,60)).error).toBeTruthy();
  expect((await anon.from("projects").select("id").eq("id",projectId)).data).toEqual([]);
  // A spoofed MIME type is rejected by the server; existing cover and text survive.
  await coverTile.getByRole("button",{name:"Edit Project cover",exact:true}).click();
  editor=page.getByRole("dialog",{name:"Project cover",exact:true});upload=editor.locator("form").filter({has:page.locator('input[type="file"]')});
  await upload.locator('[name="file"]').setInputFiles({name:"invalid.png",mimeType:"image/png",buffer:Buffer.from("not an image")});await upload.locator('[name="cover_alt"]').fill("Preserved failed input");
  await upload.getByRole("button",{name:"Save replacement"}).click();await expect(upload.locator(".is-error")).toContainText("contents do not match");await expect(upload.locator('[name="cover_alt"]')).toHaveValue("Preserved failed input");expect((await service.from("projects").select("cover_image_url").eq("id",projectId).single()).data!.cover_image_url).toBe(cover);await closeEditor(page);
  for(let i=0;i<6;i++) {
   const tile=page.locator(".admin-image-tile").filter({has:page.getByRole("heading",{name:`Landscape slot ${i+1}`,exact:true})});
   await tile.locator('input[type="file"][aria-label]').setInputFiles(file);
   const dialog=page.getByRole("dialog",{name:`Landscape slot ${i+1}`,exact:true}), form=dialog.locator("form").filter({has:page.locator('input[type="file"]')});
   await form.locator('[name="alt_text"]').fill(`Landscape verification ${i+1}`);await form.locator('[name="caption"]').fill(`Caption ${i+1}`);await form.getByRole("button",{name:"Upload image",exact:true}).click();
   await expect(page.locator(".gallery-count")).toContainText(`${i+1} / 6`);
   if(await dialog.isVisible())await closeEditor(page);
  }
  expect((await service.from("media_assets").select("id").like("filename",`${slug}%`)).data).toHaveLength(1);
  await screenshot(page,"cms-images-desktop");
  await page.setViewportSize({width:390,height:844});await screenshot(page,"cms-images-mobile");expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.setViewportSize({width:1440,height:1000});
  await page.goto(`/admin/projects/${projectId}?step=details`);
  for(const [name,value]of Object.entries({short_description:"Temporary integration test",role:"Designer",section_one_body:"The idea behind this verification.",section_two_body:"The implementation of this verification.",tools:"Next.js, Supabase"})) await page.locator(`[name="${name}"]`).fill(value);
  await page.getByRole("button",{name:"Save draft",exact:true}).click();await waitSaved(page.locator("#project-details"));
  await page.goto(`/admin/projects/${projectId}?step=review`);await expect(page.getByRole("heading",{name:"Ready to publish",exact:true})).toBeVisible();
  await screenshot(page,"cms-review");
  const preview=await page.context().newPage();await preview.goto(`/admin/projects/${projectId}/preview`);await expect(preview.locator(".visual-board figure")).toHaveCount(6);await preview.close();
  await page.getByRole("button",{name:"Publish project",exact:true}).click();await confirm(page);await expect(page.getByRole("button",{name:"Unpublish",exact:true})).toBeVisible();
  await publicPage.goto(`/work/${slug}`);await expect(publicPage.locator(".visual-board figure")).toHaveCount(6);
  for(const image of await publicPage.locator(".visual-board img").all()) { await image.evaluate((el:HTMLImageElement)=>{el.loading="eager";});await expect.poll(()=>image.evaluate((el:HTMLImageElement)=>el.complete&&el.naturalWidth>0)).toBe(true); }
  await publicPage.locator(".visual-image").first().click();await expect(publicPage.getByRole("dialog")).toBeVisible();await publicPage.keyboard.press("Escape");
  await page.getByRole("button",{name:"Unpublish",exact:true}).click();await confirm(page);await expect(page.getByRole("button",{name:"Publish project",exact:true})).toBeVisible();
  await page.goto(`/admin/projects/${projectId}?step=details`);await page.locator('[name="gallery_layout"][value="mixed"]').check();await page.getByRole("button",{name:"Save draft",exact:true}).click();await waitSaved(page.locator("#project-details"));
  await page.goto(`/admin/projects/${projectId}?step=images`);await expect(page.locator(".gallery-count")).toContainText("2 / 5");
  expect((await service.from("project_media").select("id").eq("project_id",projectId)).data).toHaveLength(6);
  for(let i=0;i<3;i++) {
   const tile=page.locator(".admin-image-tile").filter({has:page.getByRole("heading",{name:`Portrait slot ${i+1}`,exact:true})});
   await tile.getByRole("button",{name:"Choose from library"}).click();
   const dialog=page.getByRole("dialog",{name:`Portrait slot ${i+1}`,exact:true});const library=dialog.locator("form").filter({has:page.locator('[name="asset_id"]')});
   await library.locator("label").filter({hasText:file.name}).getByRole("radio").check();await library.locator('[name="alt_text"]').fill(`Portrait verification ${i+1}`);await library.getByRole("button",{name:"Use selected image"}).click();await expect(page.locator(".gallery-count")).toContainText(`${i+3} / 5`);if(await dialog.isVisible())await closeEditor(page);
  }
  await page.goto("/admin/media");
  const independent=page.locator("section.admin-panel form");await independent.locator('[name="file"]').setInputFiles(replacement);await independent.getByRole("button",{name:"Upload to library"}).click();await waitSaved(independent);
  await page.getByLabel("Search images").fill(replacement.name);await expect(page.locator(".admin-library-tile")).toHaveCount(1);await page.locator(".admin-library-tile").click();
  const libraryDialog=page.getByRole("dialog",{name:"Manage library image",exact:true});
  await expect(libraryDialog).toContainText("480 × 640 px");
  const assignment=libraryDialog.locator("form").filter({has:page.locator('[name="target"]')});
  await assignment.locator('[name="target"]').selectOption("cover");await assignment.locator('[name="project_id"]').selectOption(projectId);await assignment.locator('[name="alt_text"]').fill("Library-assigned cover");await assignment.getByRole("button",{name:"Assign image"}).click();await waitSaved(assignment);
  await expect(libraryDialog).toContainText("This image is referenced by content.");
  const replaceForm=libraryDialog.locator("form").filter({has:page.locator('input[type="file"]')});await replaceForm.locator('[name="file"]').setInputFiles(file);await replaceForm.getByRole("button",{name:"Replace file everywhere"}).click();await confirm(page);await waitSaved(replaceForm);
  expect((await service.from("projects").select("cover_image_url").eq("id",projectId).single()).data!.cover_image_url).toBe(cover);
  await libraryDialog.getByRole("button",{name:"Delete image permanently"}).click();await confirm(page);await expect(libraryDialog.getByText("The file and its library record have been removed.")).toBeVisible();
  await libraryDialog.getByRole("button",{name:"Close media preview"}).click();await page.getByLabel("Search images").fill("");
  await screenshot(page,"cms-media-library");
  // Replace one existing editorial portrait and restore it in finally, without deleting its file.
  await page.goto("/admin/homepage");const portrait=page.locator(".admin-image-tile").filter({has:page.getByRole("heading",{name:"Editorial image 2",exact:true})});
  if(await portrait.getByRole("button",{name:"Edit Editorial image 2",exact:true}).count())await portrait.getByRole("button",{name:"Edit Editorial image 2",exact:true}).click();else await portrait.locator('input[type="file"][aria-label]').setInputFiles(file);
  editor=page.getByRole("dialog",{name:"Editorial image 2",exact:true});upload=editor.locator("form").filter({has:page.locator('input[type="file"]')});
  await upload.locator('[name="file"]').setInputFiles(file);await upload.locator('[name="alt_text"]').fill("Temporary homepage verification");await upload.getByRole("button",{name:/Save replacement|Upload image/}).click();await waitSaved(upload);
  homePath=(await service.from("homepage_content").select("editorial_two_path").eq("id",1).single()).data!.editorial_two_path;
  expect(homePath).toBe(cover);await closeEditor(page);
  await publicPage.goto("/");await expect(publicPage.locator('.editorial-portrait img[alt="Temporary homepage verification"]')).toBeVisible();
  await page.goto(`/admin/projects/${projectId}?step=review`);await page.getByRole("button",{name:"Publish project",exact:true}).click();await confirm(page);await expect(page.getByRole("button",{name:"Unpublish",exact:true})).toBeVisible();
  await page.goto("/admin/homepage");await page.locator('[name="featured_project_id"]').selectOption(projectId);await page.getByRole("button",{name:"Save homepage projects"}).click();await expect(page.getByText("Homepage projects saved.",{exact:true})).toBeVisible();assignedHome=true;
  await publicPage.goto("/");await expect(publicPage.locator(`a[href="/work/${slug}"]`)).toBeVisible();
  await publicPage.goto(`/work/${slug}`);await expect(publicPage.locator(".visual-board figure")).toHaveCount(5);
  const a11y=await new AxeBuilder({page}).analyze();expect(a11y.violations.filter(v=>["critical","serious"].includes(v.impact??""))).toEqual([]);
  expect(pageErrors).toEqual([]);
 } finally {
  if(homePath) {const result=await service.from("homepage_content").update({editorial_two_path:originalHomepage.editorial_two_path,editorial_two_alt:originalHomepage.editorial_two_alt}).eq("id",1).eq("editorial_two_path",homePath);if(result.error)throw result.error;}
  if(assignedHome) {const result=await service.from("homepage_content").update({featured_project_id:originalHomepage.featured_project_id}).eq("id",1).eq("featured_project_id",projectId);if(result.error)throw result.error;}
  if(projectId) {const result=await service.from("projects").delete().eq("id",projectId);if(result.error)throw result.error;}
  const assets=await service.from("media_assets").select("id,storage_path").like("filename",`${slug}%`);
  for(const asset of assets.data??[]) {const removed=await service.storage.from("portfolio-media").remove([asset.storage_path]);if(removed.error)throw removed.error;const erased=await service.from("media_assets").delete().eq("id",asset.id);if(erased.error)throw erased.error;}
  if(userId)await service.auth.admin.deleteUser(userId);
  await publicContext.close();
  expect((await service.from("homepage_content").select("*").eq("id",1).single()).data).toEqual(originalHomepage);
  expect((await service.from("site_settings").select("*").eq("id",1).single()).data).toEqual(originalSettings);
  expect((await service.from("capabilities").select("*").order("id")).data).toEqual(originalCapabilities);
 }
});
