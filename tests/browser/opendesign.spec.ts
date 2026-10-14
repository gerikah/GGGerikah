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
  test(`portfolio layout ${width}x${height}`, async ({ page }) => {
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
    await expect(page.locator(".hero img")).toHaveCount(0);
    await expect(page.locator(".about__portrait-image")).toHaveCount(1);
    await expect(page.locator(".about__portrait-image")).toHaveAttribute("src", /portrait/);
    await expect(page.locator(".mosaic-lens canvas")).toHaveAttribute("aria-hidden", "true");
    await expect(page.locator(".project")).toHaveCount(projectCount);
    await expect(page.locator(".project__cover")).toHaveCount(projectCount);
    await expect(page.locator(".concept-label")).toContainText("Independent redesign concept");
    await page.evaluate(() => document.fonts.ready);
    const geometry = await page.evaluate(() => {
      const wordmarks = [".hero__name", ".brand-footer__name"].map(selector => {
        const element = document.querySelector(selector)!;
        const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
        const textRects: DOMRect[] = [];
        while (walker.nextNode()) {
          if (!walker.currentNode.textContent?.trim()) continue;
          const range = document.createRange();
          range.selectNodeContents(walker.currentNode);
          textRects.push(range.getBoundingClientRect());
        }
        return {
          selector,
          left: Math.min(...textRects.map(rect => rect.left)),
          right: Math.max(...textRects.map(rect => rect.right)),
          width: textRects.reduce((total, rect) => total + rect.width, 0),
        };
      });
      return {
      viewport: window.innerWidth,
      pageWidth: document.documentElement.scrollWidth,
      posterPair: Array.from(document.querySelectorAll(".work-posters>.project")).slice(2, 4).map(node => {
        const { left, right, top, bottom } = node.getBoundingClientRect();
        return { left, right, top, bottom };
      }),
      mainType: getComputedStyle(document.querySelector("h1")!).fontFamily,
      displayFontLoaded: Array.from(document.fonts).some(face => face.family.includes("Michroma") && face.status === "loaded"),
      wordmarks,
      toolAndLogoBounds: Array.from(document.querySelectorAll(".nav__brand, .tech-stack__tool, .tech-stack__logo")).map(node => {
        const { left, right, width } = node.getBoundingClientRect();
        return { label: node.className, left, right, width };
      }),
      navLinks: Array.from(document.querySelectorAll(".nav__link")).every(node => {
        const rect = node.getBoundingClientRect();
        return rect.width > 0 && rect.left >= 0 && rect.right <= innerWidth;
      }),
      };
    });
    expect(geometry.pageWidth).toBeLessThanOrEqual(width + 1);
    const [firstPoster, secondPoster] = geometry.posterPair;
    if (width <= 720) {
      expect(Math.abs(firstPoster.left - secondPoster.left)).toBeLessThanOrEqual(1);
      expect(secondPoster.top).toBeGreaterThan(firstPoster.bottom);
    } else {
      expect(Math.abs(firstPoster.top - secondPoster.top)).toBeLessThanOrEqual(1);
      expect(secondPoster.left).toBeGreaterThan(firstPoster.right);
    }
    expect(geometry.mainType).toContain("Michroma");
    expect(geometry.displayFontLoaded).toBe(true);
    for (const wordmark of geometry.wordmarks) {
      expect(wordmark.width, `${wordmark.selector} text is rendered`).toBeGreaterThan(0);
      expect(wordmark.left, `${wordmark.selector} left edge`).toBeGreaterThanOrEqual(-1);
      expect(wordmark.right, `${wordmark.selector} right edge`).toBeLessThanOrEqual(width + 1);
    }
    for (const item of geometry.toolAndLogoBounds) {
      expect(item.width, `${item.label} is rendered`).toBeGreaterThan(0);
      expect(item.left, `${item.label} left edge`).toBeGreaterThanOrEqual(-1);
      expect(item.right, `${item.label} right edge`).toBeLessThanOrEqual(width + 1);
    }
    expect(geometry.navLinks).toBe(true);
    expect(errors).toEqual([]);
    for (const image of await page.locator(".project__cover").all()) {
      await image.scrollIntoViewIfNeeded();
      await expect.poll(() => image.evaluate(node => (node as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
    }
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    mkdirSync(".local/screenshots", { recursive: true });
    await page.screenshot({ path: `.local/screenshots/portfolio-${width}.png`, fullPage: true, animations: "disabled" });
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

for (const width of [360, 1440]) {
test(`design and build proof, preview focus, and full case route at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => sessionStorage.setItem("ga-intro-seen", "1"));
  await page.goto("/");
  await expect(page.locator(".od-public")).toHaveAttribute("data-loading", "false");
  await page.locator(".hero").getByRole("link", { name: "View the work", exact: true }).click();
  await expect(page).toHaveURL(/#work$/);
  await expect(page.locator(".od-public")).toHaveAttribute("data-loading", "false");
  await expect(page.locator("#work")).toBeFocused();
  const proof = page.getByRole("region", { name: /Same idea\.\s*Made real\./ });
  const design = proof.getByRole("button", { name: "The design", exact: true });
  const build = proof.getByRole("button", { name: "The build", exact: true });
  await expect(build).toHaveAttribute("aria-pressed", "true");
  await expect(design).toHaveAttribute("aria-pressed", "false");
  for (const [button, other, imageName, source, caption] of [
    [design, build, "Original Off The Rack homepage wireframe", "wireframe.png", "The original homepage wireframe"],
    [build, design, "Finished Off The Rack storefront homepage", "home.jpg", "The finished storefront interface"],
  ] as const) {
    await button.click();
    await expect(button).toHaveAttribute("aria-pressed", "true");
    await expect(other).toHaveAttribute("aria-pressed", "false");
    const image = proof.getByRole("img", { name: imageName, exact: true });
    await expect(image).toBeVisible();
    await expect(image).toHaveAttribute("src", new RegExp(source.replace(".", "\\.")));
    await expect.poll(() => image.evaluate(node => (node as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
    await expect(image.locator("..")).toHaveCSS("opacity", "1");
    await expect(proof.locator("[aria-live='polite']")).toHaveText(caption);
  }
  await expect(proof.getByRole("link", { name: "See the project" })).toHaveAttribute("href", "/work/off-the-rack");
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
}

test.describe("portfolio without JavaScript", () => {
  test.use({ javaScriptEnabled: false });
  for (const width of [360, 1440]) {
    test(`both actual design and build images remain available at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/");
      const proof = page.getByRole("region", { name: /Same idea\.\s*Made real\./ });
      await expect(proof).toBeVisible();
      await expect(proof.getByRole("button")).toHaveCount(0);
      const wireframe = proof.getByRole("img", { name: "Original Off The Rack homepage wireframe", exact: true });
      const storefront = proof.getByRole("img", { name: "Finished Off The Rack storefront homepage", exact: true });
      for (const [image, source] of [[wireframe, "wireframe.png"], [storefront, "home.jpg"]] as const) {
        await image.scrollIntoViewIfNeeded();
        await expect(image).toBeVisible();
        await expect(image).toHaveAttribute("src", new RegExp(source.replace(".", "\\.")));
        await expect.poll(() => image.evaluate(node => (node as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
        await expect(image.locator("..")).toHaveCSS("opacity", "1");
      }
      await expect(proof.getByRole("link", { name: "See the project" })).toHaveAttribute("href", "/work/off-the-rack");
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    });
  }
});

test("mobile work navigation, contacts, and no simulated resume", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => sessionStorage.setItem("ga-intro-seen", "1"));
  await page.goto("/");
  await expect(page.locator(".od-public")).toHaveAttribute("data-loading", "false");
  await page.locator(".nav__links").getByRole("link", { name: "Work", exact: true }).click();
  await expect(page).toHaveURL(/#work$/);
  await expect(page.locator(".od-public")).toHaveAttribute("data-loading", "false");
  await expect(page.locator("#work")).toBeFocused();
  await expect(page.locator("#contact h2 a")).toHaveAttribute("href", "mailto:aldaygerikah@gmail.com");
  await page.locator("#contact").scrollIntoViewIfNeeded();
  const contactIcon = await page.locator(".contact__action-icon").boundingBox();
  expect(contactIcon).not.toBeNull();
  expect(contactIcon!.x + contactIcon!.width).toBeLessThanOrEqual(342);
  await expect(page.locator(".contact__links a[href='https://github.com/gerikah']")).toBeVisible();
  await expect(page.locator("body")).not.toContainText("aldaygerikah@gmail.com");
  await expect(page.getByRole("link", { name: /RÃ©sumÃ©/ })).toHaveCount(0);
});

test("reduced-motion content is exposed and masks are static", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => sessionStorage.setItem("ga-intro-seen", "1"));
  await page.goto("/");
  await expect(page.locator(".od-public")).toHaveAttribute("data-loading", "false");
  await expect(page.locator(".hero__name .mask>span")).toHaveCSS("transform", "none");
  await expect(page.locator("[data-site-content]")).toHaveCSS("opacity", "1");
  for (const visual of await page.locator("[data-reveal], [data-paper-reveal]").all()) {
    await expect(visual).toHaveCSS("opacity", "1");
    await expect(visual).toHaveCSS("clip-path", "none");
  }
});

test("public home has accessible names, semantics, and contrast", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => sessionStorage.setItem("ga-intro-seen", "1"));
  await page.goto("/");
  await expect(page.locator(".od-public")).toHaveAttribute("data-loading", "false");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Gerikah");
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
  expect(results.violations.map(({ id, nodes }) => ({ id, targets: nodes.map(node => node.target) }))).toEqual([]);
});
