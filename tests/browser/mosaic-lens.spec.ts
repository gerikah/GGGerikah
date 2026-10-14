import { expect, test, type Page } from "@playwright/test";

type RenderAudit = { draws: number; requests: number };

// Observe native GPU draws and the animation callbacks that perform them.
// Other page animations and the test's own frame sampling are excluded.
async function auditRenderer(page: Page) {
  await page.addInitScript(() => {
    const audit = { draws: 0, requests: 0 };
    Object.assign(window, { mosaicAudit: audit });
    const renderCallbacks = new WeakSet<FrameRequestCallback>();
    let currentFrame: FrameRequestCallback | null = null;
    const requestFrame = window.requestAnimationFrame.bind(window);
    window.requestAnimationFrame = callback => {
      if (renderCallbacks.has(callback)) audit.requests++;
      return requestFrame(time => {
        const previous = currentFrame;
        currentFrame = callback;
        try { callback(time); }
        finally { currentFrame = previous; }
      });
    };
    for (const prototype of [WebGLRenderingContext.prototype, WebGL2RenderingContext.prototype]) {
      for (const method of ["drawArrays", "drawElements", "drawArraysInstanced", "drawElementsInstanced"]) {
        const original = Reflect.get(prototype, method);
        if (typeof original !== "function") continue;
        Object.defineProperty(prototype, method, {
          configurable: true,
          writable: true,
          value: function (this: WebGLRenderingContext, ...args: unknown[]) {
            if (this.canvas instanceof HTMLCanvasElement && this.canvas.closest(".mosaic-lens")) {
              audit.draws++;
              if (currentFrame) renderCallbacks.add(currentFrame);
            }
            return Reflect.apply(original, this, args);
          },
        });
      }
    }
  });
}

async function audit(page: Page): Promise<RenderAudit> {
  return page.evaluate(() => ({ ...(window as unknown as { mosaicAudit: RenderAudit }).mosaicAudit }));
}

async function expectRendererStopped(page: Page) {
  const result = await page.evaluate(async () => {
    const frame = () => new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
    await frame();
    await frame();
    const state = (window as unknown as { mosaicAudit: RenderAudit }).mosaicAudit;
    const before = { ...state };
    for (let index = 0; index < 8; index++) await frame();
    return { before, after: { ...state } };
  });
  expect(result.after).toEqual(result.before);
}

async function ready(page: Page) {
  await expect(page.locator(".od-public")).toHaveAttribute("data-loading", "false");
  await expect(page.locator(".mosaic-lens")).toHaveAttribute("data-visual-ready", "true");
}

test.use({
  viewport: { width: 360, height: 300 },
  deviceScaleFactor: 1,
  launchOptions: { args: ["--enable-unsafe-swiftshader", "--use-angle=swiftshader"] },
});

test.describe("Mosaic Lens hero", () => {

  test("real GPU frames pause, resume, and stop when hidden or offscreen", async ({ page }) => {
    await auditRenderer(page);
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/");
    await ready(page);
    const lens = page.locator(".mosaic-lens");
    await expect(lens).toHaveAttribute("data-state", "running");
    await expect(lens.locator("canvas")).toHaveAttribute("aria-hidden", "true");
    const first = await audit(page);
    await expect.poll(async () => (await audit(page)).draws).toBeGreaterThan(first.draws);
    await expect.poll(async () => (await audit(page)).requests).toBeGreaterThan(first.requests);

    await page.getByRole("button", { name: "Pause background motion", exact: true }).click();
    await expect(lens).toHaveAttribute("data-state", "paused");
    await expect(page.getByRole("button", { name: "Play background motion", exact: true })).toBeVisible();
    await expectRendererStopped(page);

    const paused = await audit(page);
    await page.getByRole("button", { name: "Play background motion", exact: true }).click();
    await expect(lens).toHaveAttribute("data-state", "running");
    await expect.poll(async () => (await audit(page)).draws).toBeGreaterThan(paused.draws);

    await page.evaluate(() => {
      Object.defineProperty(document, "hidden", { configurable: true, value: true });
      Object.defineProperty(document, "visibilityState", { configurable: true, value: "hidden" });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    await expect(lens).toHaveAttribute("data-state", "paused");
    await expectRendererStopped(page);
    const hidden = await audit(page);
    await page.evaluate(() => {
      Object.defineProperty(document, "hidden", { configurable: true, value: false });
      Object.defineProperty(document, "visibilityState", { configurable: true, value: "visible" });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    await ready(page);
    await expect(lens).toHaveAttribute("data-state", "running");
    await expect.poll(async () => (await audit(page)).draws).toBeGreaterThan(hidden.draws);

    await page.locator("#contact").scrollIntoViewIfNeeded();
    await expect(lens).toHaveAttribute("data-state", "paused");
    await expectRendererStopped(page);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  });

  test("reduced motion paints once and stops scheduling background frames", async ({ page }) => {
    await auditRenderer(page);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await ready(page);
    const lens = page.locator(".mosaic-lens");
    await expect(lens).toHaveAttribute("data-state", "static");
    expect((await audit(page)).draws).toBeGreaterThan(0);
    await expect(page.getByRole("button", { name: /background motion/ })).toHaveCount(0);
    await expectRendererStopped(page);

    const still = await audit(page);
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await expect(lens).toHaveAttribute("data-state", "running");
    await expect.poll(async () => (await audit(page)).draws).toBeGreaterThan(still.draws);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(lens).toHaveAttribute("data-state", "static");
    await expectRendererStopped(page);
  });

  test("WebGL failure leaves the content and primary navigation usable", async ({ page }) => {
    await page.addInitScript(() => {
      const getContext = HTMLCanvasElement.prototype.getContext;
      Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
        configurable: true,
        writable: true,
        value: function (this: HTMLCanvasElement, context: string, ...options: unknown[]) {
          if (["webgl", "webgl2", "experimental-webgl"].includes(context)) return null;
          return Reflect.apply(getContext, this, [context, ...options]);
        },
      });
    });
    await page.goto("/");
    await ready(page);
    await expect(page.locator(".mosaic-lens")).toHaveAttribute("data-state", "unavailable");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Gerikah");
    await expect(page.locator(".hero img")).toHaveCount(0);
    await expect(page.locator(".about__portrait-image")).toHaveAttribute("src", /portrait/);
    await expect(page.getByRole("button", { name: /background motion/ })).toHaveCount(0);
    await page.locator(".hero").getByRole("link", { name: "View the work", exact: true }).click();
    await expect(page).toHaveURL(/#work$/);
    await expect(page.locator(".od-public")).toHaveAttribute("data-loading", "false");
    await expect(page.locator("#work")).toBeFocused();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  });
});
