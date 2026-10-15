import { expect, test, type Locator, type Page } from "@playwright/test";
import { mkdirSync, readFileSync } from "node:fs";

const seed = JSON.parse(readFileSync("database/seed-data.json", "utf8"));
const projects = seed.projects.filter((project: { is_published: boolean }) => project.is_published);
const tools = [
  { label: "Next.js", evidence: "Next.js", asset: "nextjs" },
  { label: "TypeScript", evidence: "TypeScript", asset: "typescript" },
  { label: "Supabase", evidence: "Supabase", asset: "supabase" },
  { label: "Vercel", evidence: "Vercel", asset: "vercel" },
  { label: "HTML5", evidence: "HTML", asset: "html5" },
  { label: "CSS3", evidence: "CSS", asset: "css3" },
  { label: "JavaScript", evidence: "JavaScript", asset: "javascript" },
  { label: "Node.js", evidence: "Node/npm", asset: "nodejs" },
  { label: "npm", evidence: "Node/npm", asset: "npm" },
  { label: "Playwright", evidence: "Playwright", asset: "playwright" },
];
const workflowLabels = [
  "Discover", "Define", "Structure", "Design", "Build the foundation", "Build the interface", "Test and refine", "Release and iterate",
];

async function expectOriginalColour(images: Locator) {
  expect(await images.count()).toBeGreaterThan(0);
  for (const image of await images.all()) {
    const filters = await image.evaluate(node => {
      const filters: string[] = [];
      let element: Element | null = node;
      while (element) {
        filters.push(getComputedStyle(element).filter);
        element = element.parentElement;
      }
      return filters;
    });
    expect(filters.every(filter => filter === "none" || filter === "grayscale(0)")).toBe(true);
  }
}

async function screenshotSection(page: Page, selector: string, name: string, width: number) {
  const section = page.locator(selector);
  await page.evaluate(() => document.fonts.ready);
  const bounds = await section.evaluate(node => {
    const rect = node.getBoundingClientRect();
    return { x: rect.left + window.scrollX, y: rect.top + window.scrollY, width: rect.width, height: rect.height };
  });
  // Capture the section in document coordinates, keeping the sticky utility layer at the page top.
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await expect(page.locator("header.nav")).toHaveAttribute("data-scrolled", "false");
  await page.screenshot({ path: `.local/screenshots/v2-${name}-${width}.png`, clip: bounds, fullPage: true, animations: "disabled" });
}

for (const [width, height] of [[1440, 900], [390, 844]]) {
  test(`first fold introduces Gerikah before the selected project index at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const hero = page.locator(".editorial-hero");
    await expect(hero.getByRole("heading", { level: 1 })).toHaveText(/I design it\.\s*Then I build it\./);
    await expect(hero).not.toContainText(/Off The Rack|01\s*\//i);
    await expect(hero.getByRole("navigation", { name: "Selected project index" })).toHaveCount(0);
    await expect(hero.getByRole("heading", { name: "Selected work", exact: true })).toHaveCount(0);
    await expect(hero.locator("a[href^='/work/']")).toHaveCount(0);
    await expect(hero.locator("img[src*='off-the-rack'], img[src*='marci'], img[src*='ground-control']")).toHaveCount(0);
    const personalMark = hero.locator("img");
    await expect(personalMark).toHaveCount(1);
    await expect(personalMark).toHaveAttribute("src", /logo-white/);
    await expect.poll(() => personalMark.evaluate(node => (node as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
    const bridge = page.locator("#selected-work");
    const bridgeBounds = await bridge.boundingBox();
    expect(bridgeBounds).not.toBeNull();
    expect(bridgeBounds!.y).toBeGreaterThanOrEqual(height - 1);
    await expect(bridge.getByRole("navigation", { name: "Selected project index" })).toBeAttached();
    await expect(bridge).toContainText("Off The Rack");
    expect(await bridge.evaluate(node => node.nextElementSibling?.id)).toBe("work");
    mkdirSync(".local/screenshots", { recursive: true });
    await page.screenshot({ path: `.local/screenshots/v2-hero-${width}.png`, animations: "disabled" });
    const browse = hero.getByRole("link", { name: "Browse selected work", exact: true });
    await expect(browse).toHaveAttribute("href", "#selected-work");
    await browse.click();
    await expect(page).toHaveURL(/#selected-work$/);
    await expect(bridge).toBeInViewport();
    await screenshotSection(page, "#selected-work", "bridge", width);
  });

  test(`compact navigation stays visible and opens the complete archive at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const header = page.locator("header.nav");
    const nav = page.getByRole("navigation", { name: "Primary navigation" });
    const home = page.locator(".nav__brand");
    await expect(home).toHaveAttribute("href", "/");
    await expect(home.locator("img")).toHaveAttribute("src", /logo-white/);
    await expect(home).toHaveText("");
    await expect(header).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
    await expect(header).toHaveCSS("backdrop-filter", "none");
    await page.evaluate(() => window.scrollTo({ top: 1500, behavior: "instant" }));
    await expect(header).toHaveAttribute("data-scrolled", "true");
    const glass = await header.evaluate(node => {
      const style = getComputedStyle(node);
      return { background: style.backgroundColor, blur: style.backdropFilter, border: parseFloat(style.borderBottomWidth), radius: parseFloat(style.borderRadius), y: node.getBoundingClientRect().top };
    });
    const alpha = Number(glass.background.match(/rgba\([^,]+,[^,]+,[^,]+,\s*([\d.]+)\)/)?.[1]);
    expect(alpha).toBeGreaterThan(0.2);
    expect(alpha).toBeLessThan(1);
    expect(glass.blur).toMatch(/blur\([1-9][\d.]*px\)/);
    expect(glass.border).toBeGreaterThan(0);
    expect(glass.radius).toBe(0);
    expect(glass.y).toBeGreaterThanOrEqual(-1);
    expect(glass.y).toBeLessThanOrEqual(1);
    const work = nav.getByRole("link", { name: "Work", exact: true });
    await expect(work).toHaveAttribute("href", "/work");
    await work.focus();
    const focus = await work.evaluate(node => {
      const style = getComputedStyle(node);
      return { width: parseFloat(style.outlineWidth), style: style.outlineStyle };
    });
    expect(focus.width).toBeGreaterThan(0);
    expect(focus.style).not.toBe("none");
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/work$/);
    await expect(page.locator(".archive-index__row")).toHaveCount(projects.length);
    await home.click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test(`Toolbox pairs ten real SVG logos with evidence-backed project links at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const toolbox = page.locator("#stack");
    await expect(toolbox.locator("li")).toHaveCount(tools.length);
    await expect(toolbox).not.toContainText("Figma");
    for (const tool of tools) {
      const entry = toolbox.locator("li").filter({ has: page.getByText(tool.label, { exact: true }) });
      await expect(entry).toHaveCount(1);
      const icon = entry.locator("img");
      await expect(icon).toHaveAttribute("src", new RegExp(`/images/tech/${tool.asset}\\.svg$`));
      await entry.scrollIntoViewIfNeeded();
      await expect.poll(() => icon.evaluate(node => (node as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
      const iconSource = await icon.getAttribute("src");
      const response = await page.request.get(iconSource!);
      expect(response.ok()).toBe(true);
      expect(response.headers()["content-type"]).toContain("image/svg+xml");
      const svg = await response.text();
      expect(svg).toMatch(/<svg[^>]+viewBox=/);
      expect(svg).toMatch(/<(path|polygon|circle|rect)\b/);
      const link = entry.getByRole("link");
      const destination = await link.getAttribute("href");
      const project = projects.find((project: { slug: string }) => destination === `/work/${project.slug}`);
      expect(project).toBeDefined();
      expect(project.tools).toContain(tool.evidence);
      await expect(link).toHaveAttribute("title", new RegExp(`Used in .*${project.title}`));
    }
    mkdirSync(".local/screenshots", { recursive: true });
    await screenshotSection(page, "#stack", "toolbox", width);
  });

  test(`workflow explains all eight stages and overlapping build work at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const workflow = page.locator("#workflow");
    await expect(workflow.getByRole("heading", { level: 2 })).toHaveText(/How I take work from idea to release|From brief to browser/);
    const headings = workflow.getByRole("heading", { level: 3 });
    await expect(headings).toHaveText(workflowLabels);
    expect(await workflow.evaluate(node => node.previousElementSibling?.id)).toBe("process");
    expect(await workflow.evaluate(node => node.nextElementSibling?.id)).toBe("about");
    await expect(workflow).toContainText(/overlap/i);
    const stages = workflow.locator(".workflow__step");
    await expect(stages).toHaveCount(8);
    await expect(workflow.locator("ol > li")).toHaveCount(8);
    const foundation = stages.filter({ has: page.getByRole("heading", { name: "Build the foundation", exact: true }) });
    const interfaceStep = stages.filter({ has: page.getByRole("heading", { name: "Build the interface", exact: true }) });
    const sharedNote = workflow.locator("#workflow-build-note");
    await expect(sharedNote).toContainText(/Build.*parallel work/i);
    await expect(foundation).toHaveAttribute("aria-describedby", "workflow-build-note");
    await expect(interfaceStep).toHaveAttribute("aria-describedby", "workflow-build-note");
    for (const step of await stages.all()) {
      await step.scrollIntoViewIfNeeded();
      await expect(step).toBeVisible();
      expect(await step.locator("p").innerText()).not.toBe("");
    }
    await expect(workflow.locator("img")).not.toHaveCount(0);
    await expectOriginalColour(workflow.locator("img"));
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width + 1);
    const running = await page.evaluate(() => document.getAnimations().filter(animation => {
      const target = (animation.effect as KeyframeEffect | null)?.target;
      return animation.playState === "running" && target instanceof Element && Boolean(target.closest("#workflow"));
    }).length);
    expect(running).toBe(0);
    mkdirSync(".local/screenshots", { recursive: true });
    await screenshotSection(page, "#workflow", "workflow", width);
  });
}

test("desktop covers reveal original colour on hover and keyboard focus without zooming", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/work");
  const cover = page.locator(".archive-index__row .project-cover").first();
  const link = page.locator(".archive-index__row").first();
  await page.mouse.move(0, 0);
  await expect(cover).toHaveCSS("filter", "grayscale(1)");
  const duration = await cover.evaluate(node => getComputedStyle(node).transitionDuration.split(",").map(value => parseFloat(value)).find(value => value > 0));
  expect(duration).toBeGreaterThanOrEqual(0.2);
  expect(duration).toBeLessThanOrEqual(0.3);
  await link.hover();
  await expect(cover).toHaveCSS("filter", "grayscale(0)");
  await expect(cover).toHaveCSS("transform", "none");
  await page.mouse.move(0, 0);
  await expect(cover).toHaveCSS("filter", "grayscale(1)");
  await link.focus();
  await expect(cover).toHaveCSS("filter", "grayscale(0)");
  await expect(cover).toHaveCSS("transform", "none");
  await page.goto("/");
  await expectOriginalColour(page.locator(".project-switch img, #other-work img, #process img"));
  await page.goto("/work/off-the-rack");
  await expectOriginalColour(page.locator(".case-hero-image, .gallery-image"));
});

test("narrow layout covers retain original colour without hover", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/work");
  await page.mouse.move(0, 0);
  await expectOriginalColour(page.locator(".archive-index__row .project-cover"));
});

test.describe("touch covers", () => {
  test.use({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });
  test("project covers retain original colour before any interaction", async ({ page }) => {
    await page.goto("/work");
    expect(await page.evaluate(() => matchMedia("(hover: none)").matches)).toBe(true);
    await expectOriginalColour(page.locator(".archive-index__row .project-cover"));
    await page.goto("/");
    await expectOriginalColour(page.locator(".project-switch img, #other-work img, #process img"));
    await page.goto("/work/off-the-rack");
    await expectOriginalColour(page.locator(".case-hero-image, .gallery-image"));
  });
});
