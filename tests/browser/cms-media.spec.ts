import { test, expect, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { loadEnvFile } from "node:process";
import { randomUUID } from "node:crypto";
import { mkdir } from "node:fs/promises";
import sharp from "sharp";

async function checkVisibleFrames(page: Page) {
  const results = await page.locator(".admin-main .media-frame:visible").evaluateAll(elements => elements.map(element => {
    const rect = element.getBoundingClientRect();
    return Math.abs(rect.width - rect.height * (element.getAttribute("data-media-variant") === "portrait" ? 9 / 17 : 2));
  }));
  expect(results.length).toBeGreaterThan(0);
  expect(results.every(error => error < 0.15)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
}

test("CMS shares media frames and warns without cropping or rejecting proportional exports", async ({ page }) => {
  test.setTimeout(240000);
  loadEnvFile("frontend/.env.local");
  const service = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, { auth: { persistSession: false } });
  const email = `media-layout-${randomUUID()}@example.com`, password = `${randomUUID()}Aa1!`;
  const before = await service.from("projects").select("id,slug,sort_order,updated_at,gallery_layout").order("id");
  expect(before.error).toBeNull();
  let userId = "";
  const errors: string[] = [];
  const unexpectedWrites: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  try {
    const account = await service.auth.admin.createUser({ email, password, email_confirm: true });
    if (account.error) throw account.error;
    userId = account.data.user.id;
    const profile = await service.from("profiles").insert({ id: userId, role: "admin" });
    if (profile.error) throw profile.error;
    await page.goto("/login");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Enter the archive" }).click();
    await expect(page).toHaveURL(/\/admin$/, { timeout: 60000 });
    await page.route("**/admin/**", route => {
      if (route.request().method() === "POST") {
        unexpectedWrites.push(new URL(route.request().url()).pathname);
        return route.abort();
      }
      return route.continue();
    });
    await mkdir(".local/refinement", { recursive: true });
    const project = before.data!.find(item => item.gallery_layout === "mixed")!;
    for (const route of ["/admin/homepage", `/admin/projects/${project.id}?step=images`, `/admin/projects/${project.id}?step=review`, "/admin/media"]) {
      await page.goto(route);
      for (const width of [360, 390, 768, 1024, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        await checkVisibleFrames(page);
        for (const img of await page.locator(".admin-main .media-frame:visible img").all()) {
          await img.scrollIntoViewIfNeeded();
          await expect.poll(() => img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBe(true);
        }
        await expect(page.locator(".admin-main .media-frame:visible .media-fallback")).toHaveCount(0);
        await page.evaluate(() => { window.scrollTo({ top: 0, behavior: "instant" }); (document.activeElement as HTMLElement)?.blur(); });
        if ([390, 1440].includes(width)) await page.screenshot({ path: `.local/refinement/cms-${route.includes("?") ? route.split("=").at(-1) : route.split("/").at(-1)}-${width}.png`, fullPage: true });
      }
    }
    await page.setViewportSize({ width: 390, height: 900 });
    await page.goto(`/admin/projects/${project.id}?step=images`);
    const tile = page.locator(".admin-image-tile").filter({ has: page.getByRole("heading", { name: "Portrait slot 1", exact: true }) });
    await tile.getByRole("button", { name: "Edit Portrait slot 1", exact: true }).click();
    const editor = page.getByRole("dialog", { name: "Portrait slot 1", exact: true });
    const input = editor.locator('input[type="file"]');
    for (const [width, height, mismatch] of [[450, 850, false], [900, 1700, false], [500, 800, true]] as const) {
      const buffer = await sharp({ create: { width, height, channels: 3, background: "#202020" } }).png().toBuffer();
      await input.setInputFiles({ name: "local-preview-only.png", mimeType: "image/png", buffer });
      await expect(editor.getByAltText("Selected upload preview")).toBeVisible();
      await expect.poll(() => editor.getByAltText("Selected upload preview").evaluate((image: HTMLImageElement) => image.naturalHeight)).toBe(height);
      if (mismatch) await expect(editor.locator(".media-ratio-notice")).toContainText("500 × 800");
      else await expect(editor.locator(".media-ratio-notice")).toHaveCount(0);
      expect(await input.evaluate((el: HTMLInputElement) => el.validity.valid)).toBe(true);
      await checkVisibleFrames(page);
    }
    // Leave the form without submitting: this test never changes an asset or project.
    page.once("dialog", dialog => dialog.accept());
    await editor.getByRole("button", { name: "Close image editor" }).click();
    const after = await service.from("projects").select("id,slug,sort_order,updated_at,gallery_layout").order("id");
    expect(after.data?.find(item => item.id === project.id)).toEqual(project);
    expect(unexpectedWrites).toEqual([]);
    expect(errors).toEqual([]);
  } finally {
    await page.context().clearCookies();
    if (userId) {
      const deleted = await service.auth.admin.deleteUser(userId);
      if (deleted.error) throw deleted.error;
    }
  }
});
