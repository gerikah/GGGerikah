import { expect, test } from "@playwright/test";

for (const width of [1440, 390]) {
  test(`anchor navigation keeps content visible and usable at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await page.evaluate(() => {
      const states: string[] = [];
      const inspect = () => {
        const content = document.querySelector<HTMLElement>("[data-site-content]")!;
        if (document.querySelector("[data-logo-loader]")) states.push("loader");
        if (document.querySelector('.od-public[data-loading="true"]')) states.push("loading");
        if (content.inert) states.push("inert");
        if (getComputedStyle(content).opacity === "0") states.push("hidden");
      };
      const observer = new MutationObserver(inspect);
      observer.observe(document.body, { childList: true, subtree: true, attributes: true });
      Object.assign(window, { navigationVisibilityStates: states });
      inspect();
    });
    await page.locator(".editorial-hero").getByRole("link", { name: "Browse selected work", exact: true }).click();
    await expect(page).toHaveURL(/#work$/);
    await expect(page.locator("#work")).toBeInViewport();
    await page.getByRole("navigation", { name: "Primary navigation" }).getByRole("link", { name: "Contact", exact: true }).click();
    await expect(page).toHaveURL(/#contact$/);
    await expect(page.locator("#contact")).toBeInViewport();
    await expect(page.locator("[data-site-content]")).toHaveCSS("opacity", "1");
    await expect(page.locator("[data-logo-loader]")).toHaveCount(0);
    expect(await page.evaluate(() => (window as unknown as { navigationVisibilityStates: string[] }).navigationVisibilityStates)).toEqual([]);
    await expect(page.locator("#contact a[href='mailto:aldaygerikah@gmail.com']")).toBeVisible();
    await expect(page.locator("#contact a[href='https://github.com/gerikah']")).toBeVisible();
    await expect(page.locator("footer a[href='/work']").first()).toBeVisible();
  });
}

test("reduced motion keeps the archive static and exposed", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator("[data-site-content]")).toHaveCSS("opacity", "1");
  await expect(page.locator("[data-logo-loader], .mosaic-lens canvas")).toHaveCount(0);
  const motion = await page.evaluate(() => {
    const root = getComputedStyle(document.documentElement);
    const animations = document.getAnimations().filter(animation => {
      const target = (animation.effect as KeyframeEffect | null)?.target;
      return animation.playState === "running" && target instanceof Element && Boolean(target.closest("[data-site-content]"));
    });
    return { scroll: root.scrollBehavior, runningAnimations: animations.length };
  });
  expect(motion.scroll).toBe("auto");
  expect(motion.runningAnimations).toBe(0);
  const wireframe = page.locator(".project-switch").getByRole("button", { name: "Wireframe", exact: true });
  await wireframe.click();
  await expect(wireframe).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".project-switch").getByRole("img", { name: /Original Off The Rack homepage wireframe/ })).toBeVisible();
});

test("unknown routes expose recovery links and remain responsive", async ({ page }) => {
  for (const route of ["/nothing-filed-here", "/work/not-a-published-project"]) {
    const response = await page.goto(route);
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: "Not in this archive." })).toBeVisible();
    await expect(page.locator("meta[name='robots']").first()).toHaveAttribute("content", /noindex/);
    await expect(page.locator("[data-logo-loader]")).toHaveCount(0);
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 900 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width + 1);
    }
    await page.getByRole("link", { name: /Return home/ }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(/I design it\.\s*Then I build it\./);
  }
});
