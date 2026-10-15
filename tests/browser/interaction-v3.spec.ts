import { expect, test, type Locator, type Page } from "@playwright/test";
import { mkdirSync } from "node:fs";

const stageTitles = ["Discover", "Define", "Structure", "Design", "Build the foundation", "Build the interface", "Test and refine", "Release and iterate"];
const stageCopy = [
  "Requirements, users, context, constraints, and the problem to solve.",
  "Goals, scope, priorities, features, and user flows.",
  "Information architecture, technical architecture, data model, and API/system decisions.",
  "Wireframes, UI direction, responsive layouts, prototypes, and interaction details.",
  "Database, backend logic, authentication, APIs, and content/data handling.",
  "Frontend development, responsive behaviour, component work, and backend integration.",
  "Functional testing, responsive testing, accessibility checks, bug fixing, and performance review.",
  "Preview/staging deployment, production deployment, monitoring, feedback, and continued improvements.",
];

async function translation(element: Locator) {
  return element.evaluate(node => {
    const matrix = new DOMMatrixReadOnly(getComputedStyle(node).transform);
    return { x: matrix.m41, y: matrix.m42, xScale: matrix.m11, yScale: matrix.m22 };
  });
}

async function expectRest(element: Locator) {
  await expect.poll(async () => {
    const { x, y } = await translation(element);
    return Math.hypot(x, y);
  }).toBeLessThan(0.05);
}

async function expectFocusIndicator(element: Locator) {
  await expect(element).toBeFocused();
  const visible = await element.evaluate(node => {
    const style = getComputedStyle(node);
    return style.outlineStyle !== "none" && parseFloat(style.outlineWidth) > 0;
  });
  expect(visible).toBe(true);
}

async function capture(page: Page, selector: string, label: string, width: number) {
  await page.evaluate(() => document.fonts.ready);
  const box = await page.locator(selector).evaluate(node => {
    const box = node.getBoundingClientRect();
    return { x: box.left + scrollX, y: box.top + scrollY, width: box.width, height: box.height };
  });
  await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
  mkdirSync(".local/screenshots", { recursive: true });
  await page.screenshot({ path: `.local/screenshots/v3-${label}-${width}.png`, clip: box, fullPage: true, animations: "disabled" });
}

test("hero responds only in its visual layers, stays restrained, and returns to rest", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const visual = page.locator(".hero-mark");
  await expect(visual).toHaveAttribute("data-pointer-motion", "enabled");
  await page.evaluate(() => document.fonts.ready);
  const mark = visual.locator(".hero-mark__logo");
  const cursor = visual.locator(".hero-mark__cursor");
  const window = visual.locator(".hero-mark__frame--narrow");
  const headline = page.locator(".editorial-hero h1");
  const headlineBefore = await headline.boundingBox();
  const box = await visual.boundingBox();
  expect(box).not.toBeNull();
  await page.mouse.move(box!.x + box!.width * .9, box!.y + box!.height * .2);
  await expect.poll(async () => {
    const { x, y } = await translation(cursor);
    return Math.hypot(x, y);
  }).toBeGreaterThan(1);
  const [main, pointer, smallWindow] = await Promise.all([translation(mark), translation(cursor), translation(window)]);
  expect(Math.hypot(main.x, main.y)).toBeLessThan(Math.hypot(pointer.x, pointer.y));
  for (const layer of [main, pointer, smallWindow]) {
    expect(Math.hypot(layer.x, layer.y)).toBeLessThanOrEqual(12);
    expect(layer.xScale).toBe(1);
    expect(layer.yScale).toBe(1);
  }
  expect(pointer.x * smallWindow.x + pointer.y * smallWindow.y).toBeLessThan(0);
  expect(await headline.boundingBox()).toEqual(headlineBefore);
  await page.mouse.move(0, 0);
  for (const layer of [mark, cursor, window]) await expectRest(layer);
});

test("selected index defers previews until exploration and supports keyboard inspection", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const initialRequests = new Set<string>();
  page.on("request", request => {
    if (request.resourceType() === "image") initialRequests.add(request.url());
  });
  await page.goto("/");
  const index = page.locator(".hero-index");
  const rows = index.locator("ol > li > a");
  await expect(rows).toHaveCount(3);
  await expect(index.locator(".hero-index__preview img")).toHaveCount(0);
  const preload = await page.locator("link[rel='preload'][as='image']").evaluateAll(nodes => nodes.map(node => ({ href: node.getAttribute("href"), srcset: node.getAttribute("imagesrcset") })));
  const beforeFocus = new Set(initialRequests);
  const rowBoxes = await rows.evaluateAll(nodes => nodes.map(node => node.getBoundingClientRect().toJSON()));
  expect(rowBoxes[1].top).toBeGreaterThanOrEqual(rowBoxes[0].bottom - 1);
  expect(rowBoxes[2].top).toBeGreaterThanOrEqual(rowBoxes[1].bottom - 1);
  for (let i = 0; i < 3; i++) {
    const row = rows.nth(i);
    await row.focus();
    await expectFocusIndicator(row);
    const preview = index.locator(".hero-index__preview img");
    await expect(index.locator(".hero-index__preview")).toHaveAttribute("data-project", ["off-the-rack", "marci-metzger-homes", "ground-control-station"][i]);
    await expect(index.locator(".hero-index__preview-caption")).toHaveText(await row.locator("strong").innerText());
    await expect(preview).toBeVisible();
    await expect.poll(() => preview.evaluate(node => (node as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
    const image = await preview.evaluate(node => {
      const image = node as HTMLImageElement;
      return { url: image.currentSrc, srcset: image.srcset, alt: image.alt, filter: getComputedStyle(image).filter };
    });
    expect(image.filter).toMatch(/^(none|grayscale\(0\))$/);
    if (i === 0) {
      // Chromium may reuse the larger storefront image already needed by the main
      // project. Preview-size variants must not add any initial image requests.
      const previewVariants = image.srcset.split(",").map(candidate => candidate.trim().split(" ")).filter(([, descriptor]) => {
        const size = parseInt(descriptor);
        return size >= 320 && size <= 640;
      }).map(([url]) => new URL(url, page.url()).href);
      expect(previewVariants.length).toBeGreaterThan(0);
      for (const url of previewVariants) {
        expect(beforeFocus.has(url)).toBe(false);
        expect(preload.some(item => item.href === url || item.srcset?.includes(url))).toBe(false);
      }
    }
  }
  await rows.nth(1).hover();
  await expect(index.locator(".hero-index__preview-caption")).toHaveText("Marci Metzger Homes");
  await rows.first().focus();
  const destination = await rows.first().getAttribute("href");
  expect(destination).toMatch(/^#.+/);
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(new RegExp(`${destination}$`));
  await expect(page.locator(destination!)).toBeInViewport();
});

test("toolbox feedback reveals project evidence through hover and keyboard focus", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const entry = page.locator(".toolbox__entry").first();
  const icon = entry.locator(".toolbox__logo");
  const evidence = entry.locator(".toolbox__project");
  await entry.scrollIntoViewIfNeeded();
  await page.mouse.move(0, 0);
  await expect(evidence).toHaveCSS("opacity", "0");
  const restingOpacity = Number(await icon.evaluate(node => getComputedStyle(node).opacity));
  await entry.hover();
  await expect(evidence).toHaveCSS("opacity", "1");
  await expect.poll(async () => (await translation(entry)).y).toBeLessThanOrEqual(-2.9);
  expect(Number(await icon.evaluate(node => getComputedStyle(node).opacity))).toBeGreaterThan(restingOpacity);
  await page.mouse.move(0, 0);
  await entry.focus();
  await expectFocusIndicator(entry);
  await expect(evidence).toHaveCSS("opacity", "1");
  const destination = await entry.getAttribute("href");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(new RegExp(`${destination}$`));
});

for (const [width, height] of [[1440, 900], [768, 1024], [390, 844]]) {
  test(`workflow keeps one readable process with a real build split and join at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const workflow = page.locator("#workflow");
    const heading = workflow.getByRole("heading", { level: 2 });
    await expect(heading).toHaveText(/From brief\s*to browser/);
    await expect(heading.locator("br")).toHaveCount(1);
    const stages = workflow.locator(".workflow__step");
    await expect(stages.getByRole("heading", { level: 3 })).toHaveText(stageTitles);
    await expect(stages.locator(".workflow__step-copy > p")).toHaveText(stageCopy);
    const boxes = await stages.evaluateAll(nodes => nodes.map(node => {
      const box = node.getBoundingClientRect();
      return { x: box.x, y: box.y, width: box.width, height: box.height, right: box.right, bottom: box.bottom };
    }));
    const headingBox = await workflow.locator(".workflow__heading").boundingBox();
    expect(headingBox!.y + headingBox!.height).toBeLessThanOrEqual(boxes[0].y);
    for (const box of boxes) {
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.right).toBeLessThanOrEqual(width + 1);
    }
    for (let i = 1; i < 4; i++) {
      expect(boxes[i].y).toBeGreaterThanOrEqual(boxes[i - 1].bottom - 1);
      expect(boxes[i].y - boxes[i - 1].bottom).toBeLessThan(100);
    }
    if (width === 1440) {
      expect(Math.abs(boxes[4].y - boxes[5].y)).toBeLessThanOrEqual(1);
      expect(boxes[4].right).toBeLessThanOrEqual(boxes[5].x);
      expect(boxes[6].y).toBeGreaterThanOrEqual(Math.max(boxes[4].bottom, boxes[5].bottom) - 1);
      const axes = await stages.locator(".workflow__dot").evaluateAll(nodes => nodes.map(node => {
        const box = node.getBoundingClientRect();
        return box.x + box.width / 2;
      }));
      const buildCenter = (axes[4] + axes[5]) / 2;
      for (const i of [0, 1, 2, 3, 6, 7]) expect(Math.abs(axes[i] - buildCenter)).toBeLessThan(2);
      expect(axes[4]).toBeLessThan(buildCenter);
      expect(axes[5]).toBeGreaterThan(buildCenter);
    } else if (width === 390) {
      for (let i = 1; i < boxes.length; i++) expect(boxes[i].y).toBeGreaterThanOrEqual(boxes[i - 1].bottom - 1);
    }
    expect(boxes[7].y).toBeGreaterThanOrEqual(boxes[6].bottom - 1);
    for (let i = 0; i < 8; i++) {
      const stage = stages.nth(i);
      await stage.scrollIntoViewIfNeeded();
      await expect(stage.getByRole("heading")).toBeVisible();
      await expect(stage.locator(".workflow__step-copy > p")).toBeVisible();
      await expect(stage.locator("img")).toHaveCount([3, 4, 5].includes(i) ? 1 : 0);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width + 1);
    await capture(page, ".editorial-hero", "hero", width);
    await capture(page, "#selected-work", "index", width);
    await capture(page, "#workflow", "workflow", width);
  });
}

test("workflow stages reveal on entry and offer keyboard inspection without hiding unread stages", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const stages = page.locator("#workflow .workflow__step");
  for (const stage of await stages.all()) {
    // Reading must not depend on a reveal having run or the visitor using a pointer.
    await expect(stage.locator(".workflow__step-copy > p")).toBeVisible();
    const panel = stage.locator(".workflow__node");
    await panel.focus();
    await expectFocusIndicator(panel);
    await expect(stage).toHaveAttribute("data-seen", "true");
    await expect(panel).toHaveCSS("opacity", "1");
    const caption = stage.locator("figcaption");
    if (await caption.count()) {
      await expect(caption).toBeVisible();
      await expect(caption.locator(".workflow__artifact-detail")).toHaveCSS("opacity", "1");
    }
    const properties = await panel.evaluate(node => {
      const style = getComputedStyle(node);
      const durations = style.transitionDuration.split(",").map(value => parseFloat(value));
      return style.transitionProperty.split(",").map(value => value.trim()).filter((_, index) => durations[index % durations.length] > 0);
    });
    expect(properties.some(value => ["height", "width", "top", "left", "all"].includes(value))).toBe(false);
    const durations = await stage.evaluate(node => getComputedStyle(node, "::after").transitionDuration.split(",").map(value => parseFloat(value)));
    expect(durations.some(duration => duration >= .25 && duration <= .45)).toBe(true);
  }
});

test("reduced motion preserves inspection feedback while removing pointer travel", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const visual = page.locator(".hero-mark");
  const box = await visual.boundingBox();
  await page.mouse.move(box!.x + box!.width * .9, box!.y + box!.height * .2);
  for (const selector of [".hero-mark__logo", ".hero-mark__cursor", ".hero-mark__frame--narrow"]) await expectRest(visual.locator(selector));
  const row = page.locator(".hero-index ol > li > a").first();
  await row.focus();
  await expect(page.locator(".hero-index__preview img")).toBeVisible();
  const tool = page.locator(".toolbox__entry").first();
  await tool.focus();
  await expect(tool.locator(".toolbox__project")).toHaveCSS("opacity", "1");
  await expectRest(tool);
  const stage = page.locator(".workflow__node").first();
  await stage.focus();
  await expect(stage).toHaveCSS("opacity", "1");
  await expectRest(stage);
  expect(await page.evaluate(() => document.getAnimations().filter(animation => animation.playState === "running").length)).toBe(0);
});

test.describe("touch interaction", () => {
  test.use({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });
  test("keeps image inspection simple and disables pointer effects", async ({ page }) => {
    await page.goto("/");
    expect(await page.evaluate(() => matchMedia("(hover: none)").matches)).toBe(true);
    const visual = page.locator(".hero-mark");
    const box = await visual.boundingBox();
    await page.mouse.move(box!.x + box!.width * .9, box!.y + box!.height * .2);
    for (const selector of [".hero-mark__logo", ".hero-mark__cursor", ".hero-mark__frame--narrow"]) await expectRest(visual.locator(selector));
    const rows = page.locator(".hero-index ol > li > a");
    for (const row of await rows.all()) {
      const rowBox = await row.boundingBox();
      expect(rowBox!.height).toBeGreaterThanOrEqual(44);
    }
    await rows.first().focus();
    await expect(page.locator(".hero-index__preview img")).toHaveCount(0);
    const hint = page.locator(".toolbox__project").first();
    await hint.scrollIntoViewIfNeeded();
    await expect(hint).toHaveCSS("opacity", "1");
    await rows.first().tap();
    await expect(page).toHaveURL(/#work$/);
    await expect(page.locator("#work")).toBeInViewport();
    await expect(page.locator("#workflow-build-note")).toContainText(/Build.*parallel work/);
  });
});

test.describe("interaction fallback without JavaScript", () => {
  test.use({ javaScriptEnabled: false });
  test("keeps all process copy and direct archive paths available", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    const stages = page.locator("#workflow .workflow__step");
    await expect(stages.locator(".workflow__step-copy > p")).toHaveText(stageCopy);
    for (const stage of await stages.all()) {
      await stage.scrollIntoViewIfNeeded();
      await expect(stage.getByRole("heading")).toBeVisible();
      await expect(stage.locator(".workflow__step-copy > p")).toBeVisible();
      await expect(stage.locator(".workflow__node")).toHaveCSS("opacity", "1");
    }
    const index = page.getByRole("navigation", { name: "Selected project index" });
    await index.getByRole("link").first().click();
    await expect(page).toHaveURL(/#work$/);
    await expect(page.locator("#work")).toBeInViewport();
    await expect(page.locator(".toolbox__project").first()).toHaveCSS("opacity", "1");
    await page.locator("#workflow .workflow__artifact-link").first().click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Off The Rack");
  });
});
