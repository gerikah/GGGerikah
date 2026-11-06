import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const viewports = [
  { width: 320, height: 740 }, { width: 375, height: 812 },
  { width: 390, height: 844 }, { width: 768, height: 1024 },
  { width: 1024, height: 768 }, { width: 1280, height: 800 },
  { width: 1440, height: 900 }, { width: 844, height: 390 },
];
const stages = ['intro', 'about', 'capabilities', 'works', 'process', 'contact'];
const settle = (page: Page) => page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
async function load(page: Page, viewport = viewports[6], hash = '') {
  await page.setViewportSize(viewport);
  await page.goto('/' + hash);
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator('#flow-journey')).toHaveAttribute('data-flow-ready', 'true');
  // Complete image-driven reflow before checking the measured geometry.
  await page.locator('.flow-project-card img').evaluateAll(images => images.forEach(image => (image as HTMLImageElement).loading = 'eager'));
  await expect.poll(() => page.locator('.flow-project-card img').evaluateAll(images => images.every(image => (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0))).toBe(true);
  await settle(page);
}
async function stage(page: Page, name: string) {
  await page.locator(`[data-flow-stage="${name}"]`).evaluate(element => {
    const header = document.querySelector('.nav-shell')!.getBoundingClientRect().height;
    scrollTo({ top: element.getBoundingClientRect().top + scrollY - header - 24, behavior: 'instant' });
  });
  await settle(page);
}
async function anchorAligned(page: Page, id: string) {
  await expect.poll(() => page.locator(id).evaluate(el => {
    const header = document.querySelector('.nav-shell')!.getBoundingClientRect().bottom;
    const top = el.getBoundingClientRect().top;
    const max = document.documentElement.scrollHeight - innerHeight;
    const desired = Math.min(max, top + scrollY - header - 24);
    return Math.abs(scrollY - desired) < 2 && top >= header;
  })).toBe(true);
}
async function geometry(page: Page) {
  const result = await page.evaluate(() => {
    const svg = document.querySelector<SVGSVGElement>('.flow-connectors')!;
    const origin = svg.getBoundingClientRect();
    const join = document.querySelector<SVGCircleElement>('[data-flow-junction]')!;
    const point = (id: string, side: string) => {
      if (id === 'merge') return { x: Number(join.getAttribute('cx')), y: Number(join.getAttribute('cy')) };
      const box = document.querySelector(`[data-flow-node="${id}"]`)!.getBoundingClientRect();
      return { x: (side === 'left' ? box.left : side === 'right' ? box.right : box.left + box.width / 2) - origin.left,
        y: (side === 'top' ? box.top : side === 'bottom' ? box.bottom : box.top + box.height / 2) - origin.top };
    };
    const content = [...document.querySelectorAll<HTMLElement>('[data-flow-content],.site-footer__main')].map(element => ({ label: element.className || element.id, box: element.getBoundingClientRect() }));
    const endpointErrors: string[] = [], crossings: string[] = [];
    for (const path of document.querySelectorAll<SVGPathElement>('[data-flow-edge]')) {
      const length = path.getTotalLength();
      const first = path.getPointAtLength(0), last = path.getPointAtLength(length);
      const from = point(path.dataset.from!, path.dataset.fromPort!), to = point(path.dataset.to!, path.dataset.toPort!);
      if (Math.hypot(first.x - from.x, first.y - from.y) > 1 || Math.hypot(last.x - to.x, last.y - to.y) > 1) endpointErrors.push(path.dataset.flowEdge!);
      for (let distance = 0; distance <= length; distance += 8) {
        const p = path.getPointAtLength(distance), x = p.x + origin.left, y = p.y + origin.top;
        const hit = content.find(({ box }) => x > box.left + 2 && x < box.right - 2 && y > box.top + 2 && y < box.bottom - 2);
        if (hit) { crossings.push(`${path.dataset.flowEdge}: ${hit.label}`); break; }
      }
    }
    const nodes = [...document.querySelectorAll<HTMLElement>('[data-flow-node]')].map(node => ({ id: node.dataset.flowNode, box: node.getBoundingClientRect() }));
    const overlap: string[] = [];
    nodes.forEach((node, i) => nodes.slice(i + 1).forEach(other => {
      const a = node.box, b = other.box;
      if (a.left < b.right - 2 && a.right > b.left + 2 && a.top < b.bottom - 2 && a.bottom > b.top + 2) overlap.push(`${node.id}/${other.id}`);
    }));
    return { endpointErrors, crossings, overlap, overflow: document.documentElement.scrollWidth - innerWidth,
      clipped: [...document.querySelectorAll<HTMLElement>('[data-flow-content]')].filter(el => el.scrollWidth > el.clientWidth + 1).map(el => el.className),
      visible: content.every(({ box }) => box.width > 0 && box.height > 0), count: svg.querySelectorAll('[data-flow-edge]').length };
  });
  expect(result).toEqual({ endpointErrors: [], crossings: [], overlap: [], overflow: 0, clipped: [], visible: true, count: 10 });
}

for (const viewport of viewports) {
  test(`connected journey forward and backward at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await load(page, viewport);
    const hero = await page.locator('.landing-hero').boundingBox();
    const name = await page.locator('.landing-hero__name').boundingBox();
    const portrait = await page.locator('.landing-hero__portrait').boundingBox();
    for (const box of [name!, portrait!]) {
      expect(box.x).toBeGreaterThanOrEqual(hero!.x);
      expect(box.x + box.width).toBeLessThanOrEqual(hero!.x + hero!.width + 1);
      expect(box.y + box.height).toBeLessThanOrEqual(hero!.y + hero!.height + 1);
    }
    if (viewport.height < 600) expect(hero!.height).toBeLessThanOrEqual(viewport.height);
    await geometry(page);
    // Visit the entire document in overlapping viewport steps, then reverse.
    const samples = await page.evaluate(() => {
      const max = document.documentElement.scrollHeight - innerHeight, step = innerHeight * .7;
      const positions = Array.from({ length: Math.ceil(max / step) }, (_, i) => i * step);
      return [...positions, max, ...positions.reverse()];
    });
    for (const top of samples) {
      await page.evaluate(top => scrollTo({ top, behavior: 'instant' }), top);
      await settle(page);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      expect(await page.locator('[data-flow-content]').evaluateAll(elements => elements.every(el => {
        const style = getComputedStyle(el);
        return style.visibility !== 'hidden' && Number(style.opacity) > 0 && el.getBoundingClientRect().height > 0;
      }))).toBe(true);
    }
    for (const name of [...stages, ...stages.slice().reverse()]) {
      await stage(page, name);
      await expect(page.locator(`[data-flow-stage="${name}"]`)).toHaveAttribute('data-active-stage', 'true');
      await geometry(page);
    }
    await stage(page, 'intro');
    const before = Number(await page.locator('[data-flow-edge="process-talk"]').getAttribute('data-draw'));
    await stage(page, 'contact');
    expect(Number(await page.locator('[data-flow-edge="process-talk"]').getAttribute('data-draw'))).toBeGreaterThan(before);
    await stage(page, 'intro');
    expect(Number(await page.locator('[data-flow-edge="process-talk"]').getAttribute('data-draw'))).toBe(before);
    expect(errors).toEqual([]);
  });
}

test('anchors reveal the right stage below the header; cards and keyboard controls remain usable', async ({ page }) => {
  await load(page, viewports[2]);
  for (const [target, id] of [['about', 'about'], ['contact', 'contact']]) {
    await page.locator(`[data-nav-target="${target}"]`).click();
    await expect.poll(() => page.locator(`[data-nav-target="${target}"]`).getAttribute('aria-current')).toBe('location');
    await anchorAligned(page, `#${id}`);
  }
  await stage(page, 'works');
  const count = await page.locator('.flow-project-card').count();
  expect(count).toBeLessThanOrEqual(4);
  for (let index = 0; index < count; index++) {
    const card = page.locator('.flow-project-card[data-active=true]');
    await expect(card).not.toHaveAttribute('inert', '');
    const dimensions = await card.evaluate(el => {
      const image = el.querySelector('img')!, media = image.parentElement!.getBoundingClientRect(), title = el.querySelector('h3')!.getBoundingClientRect();
      return { actual: media.width / media.height, expected: image.naturalWidth / image.naturalHeight, below: title.top >= media.bottom, fit: getComputedStyle(image).objectFit };
    });
    expect(dimensions.actual).toBeCloseTo(dimensions.expected, 2);
    expect(dimensions.below).toBe(true);
    expect(dimensions.fit).toBe('contain');
    if (count > 1) { await page.getByRole('button', { name: 'Next project', exact: true }).focus(); await page.keyboard.press('Enter'); await settle(page); }
  }
  const audit = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(audit.violations).toEqual([]);
  await page.locator('[data-nav-target="work"]').click();
  await expect(page).toHaveURL(/\/work$/);
  await expect(page.getByRole('heading', { name: 'Works', exact: true })).toBeVisible();
  await expect(page.locator('[data-nav-target="work"]')).toHaveAttribute('aria-current', 'page');
});

test('direct anchors and responsive resize keep the graph attached', async ({ page }) => {
  await load(page, viewports[6], '#selected-work');
  await anchorAligned(page, '#selected-work');
  for (const viewport of [viewports[2], viewports[3], viewports[6], viewports[0]]) {
    await page.setViewportSize(viewport); await settle(page); await geometry(page);
  }
  await load(page, viewports[2], '#contact');
  await anchorAligned(page, '#contact');
});

test('reduced motion presents the whole connected journey with static lines', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await load(page, viewports[2]);
  for (const name of stages) { await stage(page, name); await geometry(page); }
  expect(await page.locator('[data-flow-edge]').evaluateAll(edges => edges.every(el => el.getAttribute('data-draw') === '1.0000'))).toBe(true);
  await expect(page.locator('#flow-journey')).toHaveAttribute('data-motion', 'false');
});

test('without JavaScript every stage and selected project remains readable', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: viewports[2] });
  const page = await context.newPage();
  await page.goto(baseURL!);
  for (const name of stages) await expect(page.locator(`[data-flow-stage="${name}"]`)).toBeVisible();
  await expect(page.locator('.flow-project-stack')).toHaveAttribute('data-enhanced', 'false');
  expect(await page.locator('.flow-project-card').evaluateAll(cards => cards.every((el, i) => !el.hasAttribute('inert') && (i === 0 || el.getBoundingClientRect().top > cards[i - 1].getBoundingClientRect().bottom)))).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.locator('[data-nav-target="contact"]').click();
  await expect(page).toHaveURL(/#contact$/);
  await context.close();
});
