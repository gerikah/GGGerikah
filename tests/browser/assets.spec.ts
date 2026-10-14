import { expect, test } from "@playwright/test";
import { mkdirSync, readFileSync } from "node:fs";
const seed = JSON.parse(readFileSync("database/seed-data.json", "utf8"));

for (const width of [390, 1440]) {
  test(`real portfolio images reveal with motion enabled at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.addInitScript(() => sessionStorage.setItem("ga-intro-seen", "1"));
    await page.goto("/");
    await expect(page.locator(".od-public")).toHaveClass(/is-enhanced/);
    const images = page.locator(".about__portrait-image, .project__cover");
    await expect(images).toHaveCount(1 + seed.projects.filter((project: { is_published: boolean }) => project.is_published).length);
    let index = 0;
    for (const image of await images.all()) {
      await image.evaluate(node => node.scrollIntoView({ block: "center", behavior: "instant" }));
      await expect.poll(() => image.evaluate(node => (node as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
      await expect.poll(() => image.evaluate(node => {
        const frame = node.closest("[data-reveal]");
        if (!frame) return false;
        const style = getComputedStyle(frame.querySelector("[data-paper-reveal]") ?? frame);
        const clip = style.clipPath;
        return Number(style.opacity) > 0.99 && (clip === "none" || (clip.match(/[-\d.]+/g) ?? []).every(value => Number(value) === 0));
      })).toBe(true);
      mkdirSync(".local/screenshots", { recursive: true });
      await image.locator("xpath=ancestor::*[@data-reveal][1]").screenshot({ path: `.local/screenshots/asset-${width}-${index++}.png` });
    }
    await expect(page.locator("img.nav__mark")).toHaveAttribute("src", /logo-white/);
    await expect(page.locator(".nav__name")).toHaveCount(0);
    await expect(page.locator("footer img")).toHaveCount(0);
    await expect(page.locator(".brand-footer__name")).toHaveText("Gerikah");
  });

  test(`case-study hero and galleries reveal with motion enabled at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.addInitScript(() => sessionStorage.setItem("ga-intro-seen", "1"));
    for (const slug of ["off-the-rack", "marci-metzger-homes"]) {
      await page.goto(`/work/${slug}`);
      await expect(page.locator(".od-public")).toHaveClass(/is-enhanced/);
      const images = page.locator(".case-hero-image, .gallery-image");
      await expect(images).toHaveCount(slug === "off-the-rack" ? 8 : 3);
      for (const image of await images.all()) {
        await image.evaluate(node => node.scrollIntoView({ block: "center", behavior: "instant" }));
        await expect.poll(() => image.evaluate(node => (node as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
        await expect.poll(() => image.evaluate(node => {
          const clip = getComputedStyle(node.closest("[data-paper-reveal]")!).clipPath;
          return clip === "none" || (clip.match(/[-\d.]+/g) ?? []).every(value => Number(value) === 0);
        })).toBe(true);
      }
    }
  });
}
