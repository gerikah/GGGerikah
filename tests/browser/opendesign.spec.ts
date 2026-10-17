import { expect, test, type Locator, type Page } from "@playwright/test";
import { mkdirSync, readFileSync } from "node:fs";
import AxeBuilder from "@axe-core/playwright";

const seed = JSON.parse(readFileSync("database/seed-data.json", "utf8"));
const publishedProjects = seed.projects.filter((project: { is_published: boolean }) => project.is_published);

async function visibleContent(page: Page) {
  await expect(page.locator("[data-site-content]")).toHaveCSS("opacity", "1");
  expect(await page.locator("[data-site-content]").evaluate(node => (node as HTMLElement).inert)).toBe(false);
  await expect(page.locator("[data-logo-loader]")).toHaveCount(0);
}

async function loadedImage(image: Locator) {
  await image.scrollIntoViewIfNeeded();
  await expect(image).toBeVisible();
  await expect.poll(() => image.evaluate(node => {
    const image = node as HTMLImageElement;
    return image.complete && image.naturalWidth > 0;
  })).toBe(true);
}

for (const [width, height] of [[1440, 900], [768, 1024], [390, 844]]) {
  test(`curated homepage remains readable and asset-backed at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.emulateMedia({ reducedMotion: "reduce" });
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.goto("/");
    await visibleContent(page);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(/I design it\.\s*Then I build it\./);
    const sections = await page.locator("main > section[id]").evaluateAll(nodes => nodes.map(node => node.id));
    expect(sections).toEqual(["selected-work", "work", "other-work", "process", "workflow", "about", "stack", "contact"]);
    await expect(page.locator("#work")).toContainText("Off The Rack");
    await expect(page.locator("#other-work")).toContainText("Task Mate");
    await expect(page.locator("#other-work")).not.toContainText("Marci Metzger Homes");
    await expect(page.locator("#other-work")).toContainText("Ground Control Station");
    const taskMate = page.locator("#task-mate.taskmate-study");
    await expect(taskMate.getByRole("heading", { level: 3 })).toHaveText("Task Mate");
    const taskMateLinks = taskMate.locator("a");
    await expect(taskMateLinks).toHaveCount(2);
    for (const link of await taskMateLinks.all()) await expect(link).toHaveAttribute("href", "/work/task-mate");
    const taskMateImages = taskMate.locator("img");
    await expect(taskMateImages).toHaveCount(1);
    const taskMateSources = await taskMateImages.evaluateAll(nodes => nodes.map(node => decodeURIComponent((node as HTMLImageElement).src)));
    expect(taskMateSources[0]).toMatch(/\/showcase(?:\.[a-z0-9_-]+)?\.png(?:[?&]|$)/);
    const homepageImages = await page.locator("main img").evaluateAll(nodes => nodes.map(node => decodeURIComponent((node as HTMLImageElement).src)));
    expect(homepageImages.some(source => /task-mate\/wireframe/i.test(source))).toBe(false);
    await expect(page.locator("#process img")).not.toHaveCount(0);
    await expect(page.locator(".step, .mosaic-lens, .hero__name")).toHaveCount(0);
    await expect(page.locator("#about")).toContainText(/Computer Engineer/i);
    await expect(page.locator("#stack")).toContainText("Toolbox");
    const toolLabels: Record<string, string> = { HTML5: "HTML", CSS3: "CSS", "Node.js": "Node/npm", npm: "Node/npm" };
    const evidencedTools = new Set(publishedProjects.flatMap((project: { tools: string[] }) => project.tools));
    const toolboxLinks = page.locator("#stack li a");
    expect(await toolboxLinks.count()).toBeGreaterThan(0);
    for (const tool of await toolboxLinks.all()) {
      const label = (await tool.locator(".toolbox__label").innerText()).trim();
      expect(evidencedTools.has(toolLabels[label] ?? label)).toBe(true);
      await expect(tool).toHaveAttribute("href", /^\/work\/[a-z0-9-]+$/);
    }
    await page.evaluate(() => document.fonts.ready);

    const firstVisual = page.locator(".editorial-hero img").first();
    await expect.poll(() => firstVisual.evaluate(node => (node as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
    const visualBox = await firstVisual.boundingBox();
    expect(visualBox).not.toBeNull();
    expect(visualBox!.y).toBeLessThan(height);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width + 1);
    for (const image of await page.locator("main img").all()) {
      if (await image.evaluate(node => Boolean(node.closest('[aria-hidden="true"]')))) continue;
      await loadedImage(image);
    }
    for (const link of await page.locator(".nav__links a").all()) {
      const rect = await link.boundingBox();
      expect(rect).not.toBeNull();
      expect(rect!.x).toBeGreaterThanOrEqual(0);
      expect(rect!.x + rect!.width).toBeLessThanOrEqual(width + 1);
    }
    expect(errors).toEqual([]);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    mkdirSync(".local/screenshots", { recursive: true });
    await page.screenshot({ path: `.local/screenshots/hero-${width}.png`, animations: "disabled" });
    await page.screenshot({ path: `.local/screenshots/portfolio-${width}.png`, fullPage: true, animations: "disabled" });
  });

  test(`complete archive links directly to every preserved case at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto("/work");
    await visibleContent(page);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const rows = page.locator(".archive-index__row");
    await expect(rows).toHaveCount(publishedProjects.length);
    for (const project of publishedProjects) {
      const link = page.locator(`.archive-index__row[href='/work/${project.slug}']`);
      await expect(link).toContainText(project.title);
      await expect(link).toHaveAccessibleName(new RegExp(project.title));
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width + 1);
    mkdirSync(".local/screenshots", { recursive: true });
    await page.screenshot({ path: `.local/screenshots/archive-${width}.png`, fullPage: true, animations: "disabled" });
    await page.locator(".archive-index__row[href='/work/off-the-rack']").click();
    await expect(page).toHaveURL(/\/work\/off-the-rack$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Off The Rack");
  });
}

for (const width of [1440, 390]) {
  test(`wireframe and built interface switch by keyboard without trapping page scroll at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const comparison = page.locator(".project-switch");
    const wireframe = comparison.getByRole("button", { name: "Wireframe", exact: true });
    const built = comparison.getByRole("button", { name: "Built interface", exact: true });
    await expect(built).toHaveAttribute("aria-pressed", "true");
    await expect(wireframe).toHaveAttribute("aria-pressed", "false");

    await wireframe.focus();
    await page.keyboard.press("Enter");
    await expect(wireframe).toHaveAttribute("aria-pressed", "true");
    await expect(built).toHaveAttribute("aria-pressed", "false");
    const designImage = comparison.getByRole("img", { name: /Original Off The Rack homepage wireframe/ });
    await loadedImage(designImage);
    await expect(designImage).toHaveAttribute("src", /wireframe(?:\.[a-z0-9]+)?\.png/);
    await page.keyboard.press("Tab");
    await expect(built).toBeFocused();
    const focus = await built.evaluate(node => {
      const style = getComputedStyle(node);
      return { width: parseFloat(style.outlineWidth), style: style.outlineStyle };
    });
    expect(focus.width).toBeGreaterThan(0);
    expect(focus.style).not.toBe("none");
    await page.keyboard.press("Space");
    await expect(built).toHaveAttribute("aria-pressed", "true");
    await expect(wireframe).toHaveAttribute("aria-pressed", "false");
    const builtImage = comparison.getByRole("img", { name: /Built Off The Rack storefront/ });
    await loadedImage(builtImage);
    await expect(builtImage).toHaveAttribute("src", /home(?:\.[a-z0-9]+)?\.jpg/);
    await expect(page.locator("#work a[href='/work/off-the-rack']")).toBeVisible();

    const stage = comparison.locator(".project-switch__stage");
    await stage.scrollIntoViewIfNeeded();
    const nestedScroll = await stage.evaluate(node => [node, ...node.querySelectorAll("*")].some(element => {
      const style = getComputedStyle(element);
      return /^(auto|scroll)$/.test(style.overflowY) && element.scrollHeight > element.clientHeight + 1;
    }));
    expect(nestedScroll).toBe(false);
    const box = await stage.boundingBox();
    expect(box).not.toBeNull();
    await page.mouse.move(box!.x + box!.width / 2, box!.y + Math.min(box!.height / 2, 200));
    const before = await page.evaluate(() => window.scrollY);
    await page.mouse.wheel(0, 380);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(before + 100);
  });
}

test.describe("portfolio without JavaScript", () => {
  test.use({ javaScriptEnabled: false });
  for (const width of [1440, 390]) {
    test(`real work and direct archive navigation remain usable at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/");
      await visibleContent(page);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(/I design it\.\s*Then I build it\./);
      await loadedImage(page.locator(".project-switch").getByRole("img", { name: /Built Off The Rack storefront/ }));
      await loadedImage(page.locator("#process").getByRole("img", { name: /Early Off The Rack inquiry wireframe/ }));
      const header = page.locator("header.nav");
      await expect(header).toHaveCSS("background-color", "rgb(13, 13, 13)");
      const headerBounds = await header.boundingBox();
      expect(headerBounds).not.toBeNull();
      expect(headerBounds!.y).toBeGreaterThanOrEqual(-1);
      expect(headerBounds!.y).toBeLessThanOrEqual(1);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width + 1);
      await page.locator("footer a[href='/work']").first().click();
      await expect(page).toHaveURL(/\/work$/);
      await expect(page.locator(".archive-index__row")).toHaveCount(publishedProjects.length);
      await page.locator(".archive-index__row[href='/work/marci-metzger-homes']").click();
      await expect(page.getByRole("heading", { level: 1 })).toHaveText("Marci Metzger Homes");
      await loadedImage(page.locator(".case-hero-image"));
    });
  }
});

for (const width of [1440, 390]) {
  for (const route of ["/", "/work", "/work/off-the-rack"]) {
    test(`WCAG names, semantics, keyboard access, and contrast: ${route} at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto(route);
      await visibleContent(page);
      const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
      expect(results.violations.map(({ id, nodes }) => ({ id, targets: nodes.map(node => node.target) }))).toEqual([]);
    });
  }
}
