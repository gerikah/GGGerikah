import { test, expect, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const widths = [360, 390, 768, 1024, 1440];

async function checkFrames(page: Page) {
  const frames = await page.locator("main [data-media-variant]").evaluateAll(elements => elements.map(element => {
    const rect = element.getBoundingClientRect();
    const expected = element.getAttribute("data-media-variant") === "portrait" ? 9 / 17 : 2;
    return { error: Math.abs(rect.width - rect.height * expected), width: rect.width, height: rect.height };
  }));
  expect(frames.length).toBeGreaterThan(0);
  for (const frame of frames) {
    expect(frame.width).toBeGreaterThan(0);
    expect(frame.error).toBeLessThan(0.15);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(await page.locator("main .media-frame img").evaluateAll(images => images.every(image => {
    const style = getComputedStyle(image);
    return style.objectFit === "contain" && style.filter === "none" && style.opacity === "1";
  }))).toBe(true);
}

test("all published work uses responsive media frames and working fullscreen controls", async ({ page }) => {
  test.setTimeout(600000);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await mkdir(".local/refinement", { recursive: true });
  await page.goto("/work");
  const projects = await page.locator("a.selected-project").evaluateAll(links => links.map(link => link.getAttribute("href")!));
  expect(projects.length).toBeGreaterThan(0);
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  for (const path of ["/", "/work", ...projects]) {
    await page.goto(path);
    await page.locator("main .media-frame").first().waitFor();
    await page.evaluate(() => document.fonts.ready);
    for (const width of widths) {
      await page.setViewportSize({ width, height: 900 });
      await checkFrames(page);
      for (const frame of await page.locator("main .media-frame").all()) {
        await frame.scrollIntoViewIfNeeded();
        const img = frame.locator("img");
        if (await img.count()) await expect.poll(() => img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBe(true);
      }
      await expect(page.locator("main .media-fallback")).toHaveCount(0);
      await page.evaluate(() => { window.scrollTo({ top: 0, behavior: "instant" }); (document.activeElement as HTMLElement)?.blur(); });
      await page.screenshot({ path: `.local/refinement/${path.split("/").at(-1) || "home"}-${width}.png`, fullPage: true });
    }
    const trigger = page.locator(".visual-image").first();
    if (await trigger.count()) {
      await trigger.click();
      const dialog = page.getByRole("dialog", { name: "Fullscreen image preview" });
      await expect(dialog).toBeVisible();
      await expect(dialog.locator("img")).toHaveCSS("object-fit", "contain");
      await expect.poll(() => dialog.locator("img").evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBe(true);
      await page.keyboard.press("ArrowRight");
      await expect(dialog.locator(".image-dialog-toolbar").first()).toContainText("2 /");
      await page.keyboard.press("ArrowLeft");
      await expect(dialog.locator(".image-dialog-toolbar").first()).toContainText("1 /");
      await page.keyboard.press("Escape");
      await expect(dialog).not.toBeVisible();
      await expect(trigger).toBeFocused();
      expect(await page.evaluate(() => document.documentElement.style.overflow)).toBe("");
      const next = page.locator(".case-next");
      await expect(next).toBeVisible();
      const destination = await next.getAttribute("href");
      await next.click();
      await expect(page).toHaveURL(destination!, { timeout: 60000 });
      await expect(page.locator(".case-cover")).toBeVisible();
    }
  }
  expect(errors).toEqual([]);
});

test("image optimization failure recovers, and failed originals show an honest fallback", async ({ page }) => {
  test.setTimeout(120000);
  await page.goto("/work/blacksite");
  const image = page.locator(".case-cover img");
  const src = await image.getAttribute("src");
  const original = new URL(src!, "http://localhost:3000").searchParams.get("url") ?? src!;
  const path = new URL(original).pathname;
  await page.route("**/_next/image?**", route => {
    const url = new URL(route.request().url()).searchParams.get("url");
    return url && new URL(url).pathname === path ? route.abort() : route.continue();
  });
  await page.reload();
  await expect.poll(() => image.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0 && el.src.includes("/storage/v1/object/sign/"))).toBe(true);

  let originalAttempts = 0;
  await page.route("**/storage/v1/object/sign/**", route => {
    if (new URL(route.request().url()).pathname === path) { originalAttempts++; return route.abort(); }
    return route.continue();
  });
  await page.reload();
  await expect(page.locator(".case-cover .media-fallback")).toContainText("Image unavailable");
  await expect(page.locator(".case-heading h1")).toHaveText("BLACKSITE");
  await expect(page.locator(".case-next")).toBeVisible();
  expect(originalAttempts).toBeLessThanOrEqual(3);
});

test("project content and media stay visible without JavaScript", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 900 } });
  try {
    const page = await context.newPage();
    await page.goto(`${baseURL}/work/blacksite`);
    await expect(page.locator(".case-heading h1")).toBeVisible();
    await expect(page.locator(".case-cover img")).toBeVisible();
    await checkFrames(page);
  } finally { await context.close(); }
});
