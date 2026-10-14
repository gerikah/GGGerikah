import { test, expect } from "@playwright/test";
import { mkdirSync, readFileSync } from "node:fs";
import AxeBuilder from "@axe-core/playwright";
const seed = JSON.parse(readFileSync("database/seed-data.json", "utf8"));
const projectCount = seed.projects.filter((project: { is_published: boolean }) => project.is_published).length;

const matrix = [
  [360, 800], [390, 844], [430, 932], [600, 960], [820, 1180],
  [1024, 768], [1366, 768], [1440, 900], [1920, 1080],
];

for (const [width, height] of matrix) {
  test(`OpenDesign layout ${width}x${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.addInitScript(() => sessionStorage.setItem("ga-intro-seen", "1"));
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
    await page.goto("/");
    await expect(page.locator(".od-public")).toHaveAttribute("data-loading", "false");
    await expect(page.locator("[data-logo-loader]")).toHaveCount(0);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Gerikah");
    await expect(page.locator(".project")).toHaveCount(projectCount);
    await expect(page.locator(".project__cover")).toHaveCount(projectCount);
    await expect(page.locator(".concept-label")).toContainText("INDEPENDENT REDESIGN CONCEPT");
    await page.evaluate(() => document.fonts.ready);
    const geometry = await page.evaluate(() => ({
      viewport: window.innerWidth,
      pageWidth: document.documentElement.scrollWidth,
      railDirection: getComputedStyle(document.querySelector(".rail")!).flexDirection,
      processColumns: getComputedStyle(document.querySelector(".process__grid")!).gridTemplateColumns.split(" ").length,
      mainType: getComputedStyle(document.querySelector("h1")!).fontFamily,
      navLinks: Array.from(document.querySelectorAll(".nav__link")).every(node => {
        const rect = node.getBoundingClientRect();
        return rect.width > 0 && rect.left >= 0 && rect.right <= innerWidth;
      }),
    }));
    expect(geometry.pageWidth).toBeLessThanOrEqual(width + 1);
    expect(geometry.railDirection).toBe(width <= 900 ? "column" : "row");
    expect(geometry.processColumns).toBe(width <= 720 ? 1 : 2);
    expect(geometry.mainType).toContain("Space Grotesk");
    expect(geometry.navLinks).toBe(true);
    expect(errors).toEqual([]);
    for (const image of await page.locator(".project__cover").all()) {
      await image.scrollIntoViewIfNeeded();
      await expect.poll(() => image.evaluate(node => (node as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
    }
    await page.evaluate(() => { document.querySelector(".rail")!.scrollLeft = 0; window.scrollTo({ top: 0, behavior: "instant" }); });
    mkdirSync(".local/screenshots", { recursive: true });
    await page.screenshot({ path: `.local/screenshots/opendesign-${width}.png`, fullPage: true, animations: "disabled" });
    await page.screenshot({ path: `.local/screenshots/hero-${width}.png`, animations: "disabled" });
  });
}

test("logo loader settles on initial loads and the first-name hero resolves", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".od-public")).toHaveAttribute("data-loading", "false");
  await expect(page.locator("[data-logo-loader]")).toHaveCount(0);
  await expect(page.locator(".hero__name .mask>span").first()).toHaveCSS("transform", "none");
  await page.reload();
  await expect(page.locator(".od-public")).toHaveClass(/is-enhanced/);
  await expect(page.locator(".od-public")).toHaveAttribute("data-loading", "false");
});

test("desktop rail controls and case-study route work", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => sessionStorage.setItem("ga-intro-seen", "1"));
  await page.goto("/");
  await page.getByRole("button", { name: "Next project" }).click();
  await expect(page.locator(".work__count b")).toHaveText("02");
  await page.getByRole("button", { name: "Previous project" }).click();
  await expect(page.locator(".work__count b")).toHaveText("01");
  await page.locator(".project__cta").first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("button", { name: "Close case study" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator(".project__cta").first()).toBeFocused();
  await page.locator(".project__cta").first().click();
  await page.getByRole("link", { name: "View full case study" }).click();
  await expect(page).toHaveURL(/\/work\/off-the-rack$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Off The Rack");
  await expect(page.locator(".gallery-image")).toHaveCount(7);
});

test("mobile work navigation, contacts, and no simulated resume", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => sessionStorage.setItem("ga-intro-seen", "1"));
  await page.goto("/");
  await page.locator(".nav__links").getByRole("link", { name: "Work", exact: true }).click();
  await expect(page).toHaveURL(/#work$/);
  await expect(page.locator(".od-public")).toHaveAttribute("data-loading", "false");
  await expect(page.locator("#work")).toBeFocused();
  await expect(page.locator(".contact__links a[href^='mailto:']")).toHaveAttribute("href", "mailto:aldaygerikah@gmail.com");
  await expect(page.locator(".contact__links a[href='https://github.com/gerikah']")).toBeVisible();
  await expect(page.locator("body")).not.toContainText("aldaygerikah@gmail.com");
  await expect(page.getByRole("link", { name: /Résumé/ })).toHaveCount(0);
});

test("reduced-motion content is exposed and masks are static", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => sessionStorage.setItem("ga-intro-seen", "1"));
  await page.goto("/");
  await expect(page.locator(".ticker__track")).toHaveCSS("animation-name", "none");
  await expect(page.locator(".cursor")).toHaveCSS("display", "none");
  for (const visual of await page.locator("[data-reveal], [data-paper-reveal]").all()) {
    await expect(visual).toHaveCSS("opacity", "1");
    await expect(visual).toHaveCSS("clip-path", "none");
  }
});

test("public home has accessible names, semantics, and contrast", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => sessionStorage.setItem("ga-intro-seen", "1"));
  await page.goto("/");
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
  expect(results.violations.map(({ id, nodes }) => ({ id, targets: nodes.map(node => node.target) }))).toEqual([]);
});

test("record the actual export at desktop and mobile for visual comparison", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const source = readFileSync("frontend/design/opendesign/index.html", "utf8");
  for (const [width, height] of [[1440, 900], [390, 844]]) {
    await page.setViewportSize({ width, height });
    await page.setContent(source);
    // Use the same local font binaries; the exported Google Fonts requests may be blocked.
    const font = readFileSync("node_modules/@fontsource/space-grotesk/files/space-grotesk-latin-600-normal.woff2").toString("base64");
    await page.addStyleTag({ content: `@font-face{font-family:'Space Grotesk';font-style:normal;font-weight:600;src:url(data:font/woff2;base64,${font}) format('woff2')}` });
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: `.local/screenshots/reference-hero-${width}.png`, animations: "disabled" });
  }
});
