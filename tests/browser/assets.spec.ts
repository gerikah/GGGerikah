import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";

const seed = JSON.parse(readFileSync("database/seed-data.json", "utf8"));
const projects = seed.projects.filter((project: { is_published: boolean }) => project.is_published);

for (const project of projects) {
  test(`preserved case study: ${project.slug}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    const response = await page.goto(`/work/${project.slug}`);
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(project.title);
    const cover = page.locator(".case-hero-image");
    await expect(cover).toHaveAttribute("alt", project.cover_alt);
    await expect.poll(() => cover.evaluate(node => (node as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
    await expect(page.locator(".case-summary")).toContainText(project.overview);
    if (project.slug === "task-mate") {
      const gallery = page.locator(".gallery-image");
      await expect(gallery).toHaveCount(9);
      const sources = await gallery.evaluateAll(nodes => nodes.map(node => {
        const image = node as HTMLImageElement;
        const url = new URL(image.src);
        const source = new URL(url.searchParams.get("url") ?? url.href, location.href);
        const path = decodeURIComponent(source.pathname);
        return path.slice(path.indexOf("/images/task-mate/"));
      }));
      expect(sources).toEqual([
        "/images/task-mate/Welcome Screen.png",
        "/images/task-mate/Welcome Screen 1.png",
        "/images/task-mate/Welcome Screen 2.png",
        "/images/task-mate/Login Screen.png",
        "/images/task-mate/Register Screen.png",
        "/images/task-mate/Homescreen.png",
        "/images/task-mate/Calendar.png",
        "/images/task-mate/Stats.png",
        "/images/task-mate/Profile.png",
      ]);
      await expect(cover).toHaveAttribute("src", /showcase\.png/);
      const allSources = await page.locator("main img").evaluateAll(nodes => nodes.map(node => decodeURIComponent((node as HTMLImageElement).src)));
      expect(allSources.some(source => /task-mate\/wireframe/i.test(source))).toBe(false);
    }
    for (const image of await page.locator(".case-hero-image, .gallery-image").all()) {
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
    await expect(page.locator("[data-site-content]")).toHaveCSS("opacity", "1");
    await expect(page.locator("[data-logo-loader]")).toHaveCount(0);
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 900 });
      await page.evaluate(() => document.fonts.ready);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width + 1);
      const heading = await page.getByRole("heading", { level: 1 }).boundingBox();
      expect(heading).not.toBeNull();
      expect(heading!.x).toBeGreaterThanOrEqual(0);
      expect(heading!.x + heading!.width).toBeLessThanOrEqual(width + 1);
    }
    await expect(page.getByRole("link", { name: "Back to work", exact: true })).toHaveAttribute("href", "/work");
  });
}

for (const width of [1440, 390]) {
  test(`case hero and full galleries load visibly with motion enabled at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "no-preference" });
    for (const slug of ["off-the-rack", "marci-metzger-homes", "task-mate"] as const) {
      await page.goto(`/work/${slug}`);
      const images = page.locator(".case-hero-image, .gallery-image");
      await expect(images).toHaveCount({ "off-the-rack": 8, "marci-metzger-homes": 3, "task-mate": 10 }[slug]);
      for (const image of await images.all()) {
        await image.scrollIntoViewIfNeeded();
        await expect(image).toBeVisible();
        await expect.poll(() => image.evaluate(node => (node as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
        const visibleFrame = await image.evaluate(node => {
          const frame = node.closest("[data-paper-reveal]") ?? node;
          const style = getComputedStyle(frame);
          return Number(style.opacity) > 0.99 && style.clipPath === "none";
        });
        expect(visibleFrame).toBe(true);
      }
    }
  });
}
