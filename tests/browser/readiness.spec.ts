import { expect, test, type Page } from "@playwright/test";
import { mkdirSync, readFileSync } from "node:fs";

const seed = JSON.parse(readFileSync("database/seed-data.json", "utf8"));
const projects = seed.projects.filter((project: { is_published: boolean }) => project.is_published);
async function ready(page: Page) {
  await expect(page.locator(".od-public")).toHaveAttribute("data-loading", "false");
  await expect(page.locator("[data-logo-loader]")).toHaveCount(0);
}

test("branding and CMS toolkit follow the requested section order", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await ready(page);
  await expect(page.locator(".nav__brand")).toHaveText("");
  await expect(page.locator(".nav__brand img")).toHaveAttribute("src", /logo-white/);
  await expect(page.locator("footer img")).toHaveCount(0);
  await expect(page.locator(".brand-footer__name")).toHaveText("Gerikah");
  const sections = await page.locator("main > section[id]").evaluateAll(nodes => nodes.map(node => node.id));
  expect(sections).toEqual(["about", "stack", "work", "process", "contact"]);
  expect(await page.locator(".tech-stack__tool").allTextContents()).toEqual(Array.from(new Set(projects.flatMap((project: { tools: string[] }) => project.tools))));
  await expect(page.locator("body")).not.toContainText("aldaygerikah@gmail.com");
  await expect(page.locator("body")).not.toContainText("Alday");
  for (const [width, section] of [[1440, "#stack"], [390, "#stack"], [1440, "footer"], [390, "footer"]] as const) {
    await page.setViewportSize({ width, height: 900 });
    await page.locator(section).scrollIntoViewIfNeeded();
    mkdirSync(".local/screenshots", { recursive: true });
    await page.locator(section).screenshot({ path: `.local/screenshots/${section === "footer" ? "footer" : "toolkit"}-${width}.png`, animations: "disabled" });
  }
});

test("loader keeps old content hidden until a delayed query route commits", async ({ page }) => {
  await page.goto("/work");
  await ready(page);
  let release!: () => void;
  const held = new Promise<void>(resolve => { release = resolve; });
  let requested = false;
  await page.route(url => url.pathname === "/work" && url.searchParams.get("readiness") === "delayed", async route => {
    if (route.request().headers().rsc === "1") { requested = true; await held; }
    await route.continue();
  });
  try {
    await page.evaluate(() => {
      const link = document.createElement("a");
      link.href = "/work?readiness=delayed";
      link.textContent = "Readiness audit";
      link.id = "readiness-audit";
      link.style.cssText = "display:inline-block;margin:120px 24px 24px;padding:12px";
      document.querySelector("main")!.prepend(link);
    });
    await page.locator("#readiness-audit").click();
    await expect.poll(() => requested).toBe(true);
    await expect(page.locator(".od-public")).toHaveAttribute("data-loading", "true");
    await expect(page.locator("[data-logo-loader] img")).toHaveAttribute("src", /logo-white/);
    await expect(page.locator("[data-site-content]")).toHaveCSS("opacity", "0");
    release();
    await expect(page).toHaveURL(/readiness=delayed/);
    await ready(page);
    await page.goBack();
    await ready(page);
    await expect(page).toHaveURL(/\/work$/);
  } finally { release(); }
});

test("initial loader waits for the actual case cover to finish loading", async ({ page }) => {
  let release!: () => void;
  const held = new Promise<void>(resolve => { release = resolve; });
  let requested = false;
  await page.route(url => (url.searchParams.get("url") ?? url.pathname).includes("/images/riftbound/hero.png"), async route => {
    requested = true; await held; await route.continue();
  });
  try {
    await page.goto("/work/riftbound", { waitUntil: "domcontentloaded" });
    await expect.poll(() => requested).toBe(true);
    await expect(page.locator(".od-public")).toHaveAttribute("data-loading", "true");
    await expect(page.locator("[data-logo-loader]")).toBeVisible();
    release();
    await ready(page);
    await expect.poll(() => page.locator(".case-hero-image").evaluate(node => (node as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  } finally { release(); }
});

test("returning to a visible tab gates the screen and releases keyboard access", async ({ page }) => {
  await page.goto("/");
  await ready(page);
  await page.evaluate(() => {
    const root = document.querySelector(".od-public")!;
    const states: string[] = [];
    const observer = new MutationObserver(() => states.push(root.getAttribute("data-loading")!));
    observer.observe(root, { attributes: true, attributeFilter: ["data-loading"] });
    Object.assign(window, { readinessStates: states });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect.poll(() => page.evaluate(() => (window as unknown as { readinessStates: string[] }).readinessStates)).toContain("true");
  await ready(page);
  expect(await page.locator("[data-site-content]").evaluate(node => (node as HTMLElement).inert)).toBe(false);
});

for (const project of projects.slice(2)) {
  test(`asset-backed case study: ${project.slug}`, async ({ page }) => {
    await page.goto(`/work/${project.slug}`);
    await ready(page);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(project.title);
    await expect(page.locator(".case-hero-image")).toHaveAttribute("alt", project.cover_alt);
    await expect.poll(() => page.locator(".case-hero-image").evaluate(node => (node as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
    for (const width of [360, 820, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    }
  });
}

test("404 completes its loader and provides working recovery links", async ({ page }) => {
  const response = await page.goto("/nothing-filed-here");
  expect(response?.status()).toBe(404);
  await ready(page);
  await expect(page.getByRole("heading", { name: "Not in this archive." })).toBeVisible();
  await expect(page.locator("meta[name='robots']").first()).toHaveAttribute("content", /noindex/);
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    mkdirSync(".local/screenshots", { recursive: true });
    await page.screenshot({ path: `.local/screenshots/not-found-${width}.png`, animations: "disabled" });
  }
  await page.getByRole("link", { name: /Return home/ }).click();
  await expect(page).toHaveURL(/\/$/);
  await ready(page);
  await page.goto("/work/not-a-published-project");
  await ready(page);
  await expect(page.getByRole("heading", { name: "Not in this archive." })).toBeVisible();
});
