import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function loadHome(page: Page, width = 1440, height = 900, startAtFlow = true) {
  await page.setViewportSize({ width, height });
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() => document.querySelector('[data-flow-edge]')?.getAttribute('d'));
  if (startAtFlow) {
    await page.evaluate(() => {
      const flow = document.querySelector<HTMLElement>('#flow-journey')!;
      const headerHeight = document.querySelector('.nav-shell')!.getBoundingClientRect().height;
      scrollTo({ top: flow.getBoundingClientRect().top + scrollY - headerHeight, behavior: 'instant' });
    });
    await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
  }
}

async function setProgress(page: Page, progress: number) {
  await page.evaluate(value => {
    const root = document.querySelector<HTMLElement>('#flow-journey')!;
    const travel = parseFloat(getComputedStyle(root).getPropertyValue('--flow-travel'));
    const track = root.querySelector<HTMLElement>('.flow-track') || root;
    const navHeight = document.querySelector('.nav-shell .nav')?.getBoundingClientRect().height || 0;
    const start = Math.max(0, track.getBoundingClientRect().top + scrollY - navHeight);
    const scrollBehavior = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = 'auto';
    scrollTo(0, start + travel * value);
    document.documentElement.style.scrollBehavior = scrollBehavior;
  }, progress);
  await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
  await expect.poll(async () => Math.abs(Number(await page.locator('#flow-journey').getAttribute('data-progress')) - progress)).toBeLessThan(.005);
}

async function noOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
}

async function connectorsAttachToNodes(page: Page) {
  const errors = await page.evaluate(() => {
    const svg = document.querySelector<SVGSVGElement>('.flow-connectors')!;
    const junction = document.querySelector<SVGCircleElement>('[data-flow-junction]')!;
    const bounds = svg.getBoundingClientRect();
    const nodePoint = (id: string, side: 'top' | 'bottom' | 'left' | 'right') => {
      const rect = document.querySelector<HTMLElement>(`[data-flow-node="${id}"]`)!.getBoundingClientRect();
      const x = side === 'left' ? rect.left : side === 'right' ? rect.right : rect.left + rect.width / 2;
      const y = side === 'top' ? rect.top : side === 'bottom' ? rect.bottom : rect.top + rect.height / 2;
      return { x: x - bounds.left, y: y - bounds.top };
    };
    const join = { x: Number(junction.getAttribute('cx')), y: Number(junction.getAttribute('cy')) };

    return [...document.querySelectorAll<SVGPathElement>('[data-flow-edge]')].map(path => {
      const [from, to] = path.dataset.flowEdge!.split('-');
      const first = path.getPointAtLength(0);
      const last = path.getPointAtLength(path.getTotalLength());
      const source = from === 'merge' ? join
        : from === 'decision' ? nodePoint(from, to === 'design' ? 'left' : 'right')
          : from === 'engineer' || from === 'developer' ? nodePoint(from, 'right')
            : from === 'design' || from === 'build' ? nodePoint(from, from === 'design' ? 'left' : 'right')
              : nodePoint(from, 'bottom');
      const destination = to === 'merge' ? join
        : to === 'engineer' ? nodePoint(to, 'left')
            : nodePoint(to, 'top');
      return {
        edge: path.dataset.flowEdge,
        error: Math.max(Math.abs(first.x - source.x), Math.abs(first.y - source.y), Math.abs(last.x - destination.x), Math.abs(last.y - destination.y)),
      };
    });
  });
  expect(errors.length).toBe(9);
  expect(errors.filter(result => result.error >= 2)).toEqual([]);
}

async function chartHasNoOverlappingNodes(page: Page) {
  const intersects = await page.locator('.flow-diagram').evaluate(element => {
    const stage = element.getBoundingClientRect();
    const nodes = [...element.querySelectorAll<HTMLElement>('[data-flow-node]')].filter(node => {
      const rect = node.getBoundingClientRect();
      return rect.bottom > stage.top && rect.top < stage.bottom && node.getAttribute('aria-hidden') !== 'true';
    });
    return nodes.some((node, index) => nodes.slice(index + 1).some(other => {
      const a = node.getBoundingClientRect();
      const b = other.getBoundingClientRect();
      return a.left < b.right - 1 && a.right > b.left + 1 && a.top < b.bottom - 1 && a.bottom > b.top + 1;
    }));
  });
  expect(intersects).toBe(false);
}

async function connectorsAvoidContent(page: Page) {
  const overlaps = await page.evaluate(() => {
    const svg = document.querySelector<SVGSVGElement>('.flow-connectors')!;
    const svgBounds = svg.getBoundingClientRect();
    const stage = document.querySelector<HTMLElement>('.flow-stage')!.getBoundingClientRect();
    const moving = document.querySelector<HTMLElement>('#flow-journey')!.dataset.motion === 'true';
    const selectors = '.flow-hero,.flow-about__credentials,.flow-about__details,.flow-tools-heading,.flow-branch-description,.flow-tools-board,.flow-projects__heading,.flow-project-card[data-active=true],.flow-project-controls,.nav-shell';
    const visibleContent = [...document.querySelectorAll<HTMLElement>(selectors)]
      .filter(element => {
        const panel = element.closest<HTMLElement>('.flow-panel') || element;
        const style = getComputedStyle(panel);
        return panel.getAttribute('aria-hidden') !== 'true' && style.visibility !== 'hidden' && Number(style.opacity) > .05;
      })
      .map(element => ({ className: element.className, rect: element.getBoundingClientRect() }));
    return [...document.querySelectorAll<SVGPathElement>('[data-flow-edge]')].flatMap(path => {
      const length = path.getTotalLength();
      for (let distance = 3; distance < length - 3; distance += 4) {
        const point = path.getPointAtLength(distance);
        const x = point.x + svgBounds.left;
        const y = point.y + svgBounds.top;
        // Offstage geometry is an intentional continuation of the unfolding flow.
        if (moving && (x < stage.left || x > stage.right || y < stage.top || y > stage.bottom)) continue;
        const content = visibleContent.find(item => x > item.rect.left + 1 && x < item.rect.right - 1 && y > item.rect.top + 1 && y < item.rect.bottom - 1);
        if (content) return [path.dataset.flowEdge + ': content ' + content.className + ' at ' + x.toFixed(1) + ',' + y.toFixed(1)];
      }
      return [];
    });
  });
  expect(overlaps).toEqual([]);
}

async function readableText(page: Page, selector: string, minimum: number) {
  const small = await page.locator(selector).evaluateAll((elements, min) => elements.flatMap(element => {
    const fontSize = parseFloat(getComputedStyle(element).fontSize);
    return fontSize < min ? [{ text: element.textContent?.trim(), fontSize }] : [];
  }), minimum);
  expect(small).toEqual([]);
}

test('opening hero presents the portrait and leads into the existing flow', async ({ page }) => {
  for (const [width, height] of [[1440, 900], [1366, 768], [390, 844]]) {
    await loadHome(page, width, height, false);
    const landing = page.locator('.landing-hero');
    const title = landing.getByRole('heading', { name: 'GERIKAH', level: 1, exact: true });
    await expect(title).toBeInViewport({ ratio: 1 });
    await expect(page.locator('h1')).toHaveCount(1);
    const portrait = landing.getByRole('img', { name: /Gerikah/i });
    await expect(portrait).toBeInViewport({ ratio: 1 });
    await expect.poll(() => portrait.evaluate(image => (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0)).toBe(true);
    const cue = landing.locator('a[href="#flow-journey"]');
    await expect(cue).toBeInViewport({ ratio: 1 });
    await expect(cue).toHaveAccessibleName(/flow|scroll|explore/i);
    await noOverflow(page);
    await cue.focus();
    await expect(cue).toBeFocused();
    expect(await cue.evaluate(element => getComputedStyle(element).outlineStyle)).toBe('solid');
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/#flow-journey$/);
    await expect(page.locator('.flow-headline')).toBeInViewport({ ratio: 1 });
    if (width >= 1100) {
      await expect(page.locator('[data-flow-node="start"]')).toBeInViewport();
      expect(Number(await page.locator('#flow-journey').getAttribute('data-progress'))).toBeLessThan(.01);
      await connectorsAttachToNodes(page);
    }
    await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
    await expect(title).toBeInViewport({ ratio: 1 });
  }
});

test('opening hero remains usable with reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await loadHome(page, 390, 844, false);
  const landing = page.locator('.landing-hero');
  await expect(landing.getByRole('heading', { name: 'GERIKAH', level: 1, exact: true })).toBeInViewport();
  await landing.locator('a[href="#flow-journey"]').click();
  await expect(page.locator('.flow-headline')).toBeInViewport();
  await expect(page.locator('.flow-stage')).not.toHaveCSS('position', 'sticky');
  await connectorsAttachToNodes(page);
  await noOverflow(page);
});

test('compact overview shows the complete diagram with attached connectors', async ({ page }) => {
  await loadHome(page);
  const sequence = ['start', 'engineer', 'developer', 'decision', 'design', 'build', 'works', 'talk'];
  for (const id of sequence) {
    const node = page.locator(`[data-flow-node="${id}"]`);
    await expect(node).toBeVisible();
    await expect(node).toBeInViewport();
  }
  await expect(page.locator('.flow-headline')).toContainText('Before the code,');
  await expect(page.locator('.flow-subhead')).toContainText('UI/UX design and frontend development');
  await expect(page.locator('.flow-mobile-cue')).toContainText('Scroll to follow the flow.');
  await expect(page.locator('[data-flow-node="decision"]')).toHaveText('?');
  await expect(page.locator('[data-flow-node="start"]')).toHaveAttribute('href', '#about');
  await expect(page.locator('[data-flow-node="engineer"]')).toHaveAttribute('href', '#about');
  await expect(page.locator('[data-flow-node="developer"]')).toHaveAttribute('href', '#development');
  await expect(page.locator('[data-flow-node="design"]')).toContainText('UI/UX & Flows');
  await expect(page.locator('[data-flow-node="build"]')).toContainText('Development');
  await expect(page.locator('[data-flow-node="works"]')).toHaveAttribute('href', '#selected-work');
  await expect(page.locator('[data-flow-node="talk"]')).toHaveAttribute('href', '#contact');
  await expect(page.locator('.flow-stage')).toHaveCSS('position', 'sticky');
  await connectorsAttachToNodes(page);
  await chartHasNoOverlappingNodes(page);
  await connectorsAvoidContent(page);
  await expect(page.locator('.flow-technical')).toHaveCount(0);
});

test('scroll expands the diagram through introduction, tools, projects and workflow, then reverses', async ({ page }) => {
  await loadHome(page);
  const engineer = page.locator('[data-flow-node="engineer"]');
  const developer = page.locator('[data-flow-node="developer"]');
  const initialDistance = (await developer.boundingBox())!.y - (await engineer.boundingBox())!.y;
  const initialEdgeLength = await page.locator('[data-flow-edge="engineer-developer"]').evaluate(path => (path as SVGPathElement).getTotalLength());

  await setProgress(page, .25);
  await expect(page.getByRole('heading', { name: /the person behind the flow/i })).toBeVisible();
  await expect(page.locator('.flow-education')).toBeVisible();
  await expect(page.locator('.flow-about__credentials')).toBeVisible();
  expect((await developer.boundingBox())!.y - (await engineer.boundingBox())!.y).toBeGreaterThan(initialDistance + 250);
  expect(await page.locator('[data-flow-edge="engineer-developer"]').evaluate(path => (path as SVGPathElement).getTotalLength())).toBeGreaterThan(initialEdgeLength + 200);
  await connectorsAttachToNodes(page);
  await connectorsAvoidContent(page);

  await setProgress(page, .50);
  await expect(page.locator('.flow-branch-copy')).toHaveAttribute('aria-hidden', 'false');
  await expect(page.locator('.flow-tools-board')).toBeVisible();
  await expect(page.locator('.flow-branch-description--design')).toContainText('mapping user journeys');
  await expect(page.locator('.flow-branch-description--build')).toContainText('reusable components');
  await connectorsAttachToNodes(page);
  await connectorsAvoidContent(page);

  await setProgress(page, .75);
  await expect(page.locator('.flow-projects')).toHaveAttribute('aria-hidden', 'false');
  await expect(page.locator('.flow-project-card[data-active=true]')).toBeVisible();
  await expect(page.locator('[data-flow-node="works"]')).toBeInViewport();
  await expect(page.locator('[data-flow-node="talk"]')).toBeInViewport();
  await connectorsAttachToNodes(page);
  await connectorsAvoidContent(page);
  const projectCard = await page.locator('.flow-project-card[data-active=true]').boundingBox();
  const worksNode = await page.locator('[data-flow-node="works"]').boundingBox();
  expect(projectCard!.x + projectCard!.width).toBeLessThan(worksNode!.x);

  await page.locator('#process').scrollIntoViewIfNeeded();
  await expect(page.locator('.flow-process')).toBeInViewport();
  await expect(page.locator('.flow-process__cards li')).toHaveCount(5);
  const endingGap = await page.evaluate(() => document.querySelector('#contact')!.getBoundingClientRect().top - document.querySelector('.flow-process')!.getBoundingClientRect().bottom);
  expect(endingGap).toBeLessThan(180);

  await setProgress(page, .50);
  await expect(page.locator('.flow-tools-board')).toBeVisible();
  await expect(page.locator('.flow-process')).not.toBeInViewport();
});

test('responsive and reduced-motion layouts retain the complete readable flow', async ({ page }) => {
  for (const [width, height] of [[390, 844], [768, 1024], [1024, 900], [1280, 800], [1366, 768], [1440, 900]]) {
    await loadHome(page, width, height);
    await connectorsAttachToNodes(page);
    await chartHasNoOverlappingNodes(page);
    await expect(page.locator('[data-flow-node="talk"]')).toBeVisible();
    await noOverflow(page);
  }

  await loadHome(page, 1440, 900);
  await setProgress(page, .50);
  await connectorsAttachToNodes(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('.flow-stage')).not.toHaveCSS('position', 'sticky');
  await expect(page.locator('.flow-about')).toBeVisible();
  await expect(page.locator('.flow-branch-copy')).toBeVisible();
  await expect(page.locator('.flow-projects')).toBeVisible();
  await expect(page.locator('.flow-process')).toBeVisible();
  await connectorsAttachToNodes(page);
  await noOverflow(page);
});

test('navigation and flow links reach the intended content and work archive', async ({ page }) => {
  await loadHome(page);
  const nav = page.getByRole('navigation', { name: 'Primary navigation' });
  await nav.getByRole('link', { name: 'About', exact: true }).click();
  await expect(page.locator('.flow-about')).toBeInViewport();
  await expect(nav.getByRole('link', { name: 'About', exact: true })).toHaveAttribute('aria-current', 'location');

  await setProgress(page, .46);
  await page.locator('[data-flow-node="design"]').click();
  await expect(page).toHaveURL(/#development$/);
  await expect(page.locator('.flow-branch-copy')).toBeInViewport();
  await setProgress(page, .75);
  await page.locator('[data-flow-node="works"]').click();
  await expect(page).toHaveURL(/#selected-work$/);
  await expect(page.locator('.flow-projects')).toBeInViewport();
  await page.locator('[data-flow-node="talk"]').click();
  await expect(page.locator('#contact')).toBeInViewport();
  await expect(nav.getByRole('link', { name: 'Contact', exact: true })).toHaveAttribute('aria-current', 'location');

  await nav.getByRole('link', { name: 'Work', exact: true }).click();
  await expect(page).toHaveURL(/\/work$/);
  await expect(page.getByRole('heading', { name: 'Works', exact: true })).toBeVisible();
  const projects = page.locator('.work-archive .selected-project');
  expect(await projects.count()).toBeGreaterThan(0);
  for (const project of await projects.all()) await expect(project).toHaveAttribute('href', /^\/work\//);
});

test('project stack controls and active links remain usable', async ({ page }) => {
  await loadHome(page);
  await setProgress(page, .96);
  const cards = page.locator('.flow-project-card');
  const count = await cards.count();
  expect(count).toBeGreaterThan(0);
  expect(count).toBeLessThanOrEqual(4);
  for (const card of await cards.all()) {
    if (await card.getAttribute('data-active') === 'true') await expect(card.locator('.flow-project-link')).toHaveAttribute('href', /^\/work\//);
    else await expect(card).toHaveAttribute('inert', '');
  }
  if (count > 1) {
    const current = await page.locator('.flow-project-card[data-active=true] h3').textContent();
    await page.getByRole('button', { name: 'Next project' }).click();
    await expect(page.locator('.flow-project-card[data-active=true] h3')).not.toHaveText(current ?? '');
    await page.getByRole('button', { name: 'Previous project' }).click();
    await expect(page.locator('.flow-project-card[data-active=true] h3')).toHaveText(current ?? '');
  }
  const removedDraft = await page.goto('/case-studies/not-a-cms-project', { waitUntil: 'domcontentloaded' });
  expect(removedDraft?.status()).toBe(404);
});

test('tools, workflow, and about use complete non-placeholder content', async ({ page }) => {
  await loadHome(page);
  await setProgress(page, .50);
  const tools = page.locator('.flow-branch-copy');
  await expect(tools.getByRole('heading', { name: 'From flows to function.' })).toBeVisible();
  await expect(tools.getByRole('heading', { name: 'Explore the code.' })).toBeVisible();
  await expect(tools.locator('.flow-github-history a')).toHaveAttribute('href', /^https:\/\//);
  expect(await tools.locator('.flow-tools-group li').count()).toBeGreaterThan(0);
  await expect(tools.locator('.flow-tool-placeholder')).toHaveCount(0);
  for (const tool of await tools.locator('.flow-tools-group li').all()) await expect(tool).toContainText(/\S/);

  await page.locator('#process').scrollIntoViewIfNeeded();
  const process = page.locator('.flow-process');
  await expect(process.getByRole('heading', { name: 'How I work.' })).toBeVisible();
  await expect(process.locator('.flow-process__cards li')).toHaveText([
    /01\s*Understand\s*Clarify the goal, audience, requirements, and constraints\./i,
    /02\s*Map\s*Organize the content and outline the user’s journey\./i,
    /03\s*Design\s*Shape the layout, visual hierarchy, and interactions\./i,
    /04\s*Build\s*Turn the design into a responsive, working interface\./i,
    /05\s*Refine\s*Check usability, fix issues, and polish the details\./i,
  ]);

  await setProgress(page, .25);
  const about = page.locator('.flow-about');
  await expect(about.getByRole('heading', { name: /the person behind the flow/i })).toBeVisible();
  await expect(about.getByRole('heading', { name: 'Education' })).toBeVisible();
  await expect(about.getByRole('heading', { name: 'Learning & milestones' })).toBeVisible();
  await expect(about.locator('.flow-education')).toContainText('Polytechnic University');
  await expect(about.locator('.flow-about__credentials li')).toHaveCount(3);
  await expect(about).toContainText('UI/UX & frontend development');
  await expect(about).toContainText('Manila, Philippines');
  await expect(about).not.toContainText('00 Projects');
  await expect(about).not.toContainText('00 Clients');
});

test('clean contact footer and complete page pass accessibility checks on mobile', async ({ page }) => {
  await loadHome(page, 390, 844);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const result = await new AxeBuilder({ page }).include('#main-content').include('header').include('footer').withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(result.violations.map(violation => ({ id: violation.id, nodes: violation.nodes.map(node => node.target) }))).toEqual([]);
  const contact = page.locator('#contact');
  await expect(contact.getByRole('heading', { name: 'Have a project in mind?' })).toBeVisible();
  await expect(contact).toContainText('Have a rough idea or a half-built product? I’d like to hear about it.');
  const email = contact.locator('a[href^="mailto:"]');
  await expect(email).toBeVisible();
  await page.getByRole('navigation', { name: 'Primary navigation' }).getByRole('link', { name: 'Contact', exact: true }).click();
  await expect(contact).toBeInViewport();
  await email.focus();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Shift+Tab');
  await expect(email).toBeFocused();
  expect(await email.evaluate(element => getComputedStyle(element).outlineStyle)).toBe('solid');
});

for (const [width, height] of [[1440, 900], [1366, 768], [1280, 800]]) {
  test('laptop motion stays clear and attached at ' + width + ' × ' + height, async ({ page }) => {
    await loadHome(page, width, height);
    await setProgress(page, 0);
    const hero = await page.locator('.flow-hero').boundingBox();
    expect(hero!.x).toBeGreaterThan(width * .45);
    const lines = await page.locator('.flow-headline > span').evaluateAll(elements => elements.map(element => ({ height: element.getBoundingClientRect().height, lineHeight: parseFloat(getComputedStyle(element).lineHeight) })));
    expect(lines.every(line => line.height < line.lineHeight * 1.2)).toBe(true);
    const talk = await page.locator('[data-flow-node="talk"]').boundingBox();
    expect(width - talk!.x - talk!.width).toBeGreaterThanOrEqual(24);
    expect(height - talk!.y - talk!.height).toBeGreaterThanOrEqual(24);
    const protection = await page.evaluate(() => {
      const stage = document.querySelector<HTMLElement>('.flow-stage')!;
      const diagram = document.querySelector<HTMLElement>('.flow-diagram')!;
      const svg = document.querySelector<SVGSVGElement>('.flow-connectors')!;
      const nav = document.querySelector<HTMLElement>('.nav-shell')!;
      return {
        belowHeader: stage.getBoundingClientRect().top >= nav.getBoundingClientRect().bottom - 1,
        clipped: [stage, diagram, svg].some(element => ['hidden', 'clip'].includes(getComputedStyle(element).overflowY)),
      };
    });
    expect(protection).toEqual({ belowHeader: true, clipped: true });
    const arrowOffset = await page.locator('#flow-arrow').evaluate(element => {
      const marker = element as SVGMarkerElement;
      const drawing = marker.querySelector<SVGGraphicsElement>('path')!.getBBox();
      return Math.abs(drawing.x + drawing.width - marker.refX.baseVal.value);
    });
    expect(arrowOffset).toBeLessThanOrEqual(1);
    const initialPath = await page.locator('[data-flow-edge="engineer-developer"]').getAttribute('d');
    for (const progress of [0, .08, .10, .16, .19, .23, .24, .26, .32, .36, .40, .44, .50, .60, .64, .68, .72, .78, .90, .96, 1, .96, .78, .68, .60, .50, .40, .32, .26, .16, 0]) {
      await test.step('scroll progress ' + progress, async () => {
        await setProgress(page, progress);
        await connectorsAttachToNodes(page);
        await chartHasNoOverlappingNodes(page);
        await connectorsAvoidContent(page);
        await noOverflow(page);
      });
    }
    expect(await page.locator('[data-flow-edge="engineer-developer"]').getAttribute('d')).toBe(initialPath);
    await setProgress(page, .26);
    await readableText(page, '.flow-bio,.flow-about__credentials li p', 15);
    await setProgress(page, .50);
    await readableText(page, '.flow-tools-group li', 14);
    await expect(page.locator('.flow-tools-board')).toHaveCSS('border-top-width', '0px');
    await expect(page.getByRole('heading', { name: 'Other tools', exact: true })).toHaveCount(0);
    await setProgress(page, .78);
    await readableText(page, '.flow-project-summary > p', 15);
    await setProgress(page, .96);
    await expect(page.locator('.flow-project-controls')).toBeInViewport({ ratio: 1 });
    await page.locator('#process').scrollIntoViewIfNeeded();
    await readableText(page, '.flow-process__cards p', 15);
  });
}


for (const [width, height] of [[1440, 900], [1366, 768], [1280, 800], [390, 844]]) {
  test('selected work artwork keeps its natural ratio at ' + width + ' x ' + height, async ({ page }) => {
    await loadHome(page, width, height);
    const moving = await page.locator('#flow-journey').getAttribute('data-motion') === 'true';
    const count = await page.locator('.flow-project-card').count();
    expect(count).toBeGreaterThan(0);
    expect(count).toBeLessThanOrEqual(4);

    for (let index = 0; index < count; index += 1) {
      const card = page.locator('.flow-project-card[data-active=true]');
      const title = await card.locator('h3').textContent();
      await test.step(title || 'Selected project', async () => {
        if (moving) await setProgress(page, .78);
        else {
          await card.evaluate(element => {
            const navBottom = document.querySelector('.nav-shell')!.getBoundingClientRect().bottom;
            scrollTo({ top: scrollY + element.getBoundingClientRect().top - navBottom - 16, behavior: 'instant' });
          });
        }
        const image = card.locator('.media-frame img');
        await expect(image).toHaveCount(1);
        await expect.poll(() => image.evaluate(element => {
          const artwork = element as HTMLImageElement;
          return artwork.complete && artwork.naturalWidth > 0;
        })).toBe(true);
        // Compare rendered artwork space with its actual source dimensions, allowing pixel rounding.
        await expect.poll(() => image.evaluate(element => {
          const artwork = element as HTMLImageElement;
          const frame = artwork.closest('.media-frame')!.getBoundingClientRect();
          return Math.abs(frame.height - frame.width * artwork.naturalHeight / artwork.naturalWidth);
        })).toBeLessThan(1.5);
        await expect(image).toHaveCSS('object-fit', 'contain');
        await expect(image).toHaveCSS('filter', 'none');
        await expect(image).toBeInViewport({ ratio: 1 });
        const layout = await card.evaluate(element => {
          const bounds = element.getBoundingClientRect();
          const frame = element.querySelector('.media-frame')!.getBoundingClientRect();
          const caption = element.querySelector('.flow-project-caption')!.getBoundingClientRect();
          const description = element.querySelector('.flow-project-summary > p')!.getBoundingClientRect();
          const details = element.querySelector('.flow-text-link')!.getBoundingClientRect();
          const controls = document.querySelector('.flow-project-controls')!.getBoundingClientRect();
          return {
            imageInsideCard: frame.left >= bounds.left && frame.right <= bounds.right && frame.top >= bounds.top,
            titleBelowImage: caption.top >= frame.bottom,
            descriptionBelowTitle: description.top >= caption.bottom,
            detailsInsideCard: details.bottom <= bounds.bottom,
            controlsBelowCard: controls.top >= bounds.bottom,
            imageWidth: frame.width,
            cardTop: bounds.top,
          };
        });
        expect(layout).toMatchObject({ imageInsideCard: true, titleBelowImage: true, descriptionBelowTitle: true, detailsInsideCard: true, controlsBelowCard: true });
        if (moving) {
          expect(layout.imageWidth).toBeGreaterThan(width * .38);
          await connectorsAvoidContent(page);
          await setProgress(page, .96);
          await expect(card.locator('.flow-text-link')).toBeInViewport({ ratio: 1 });
          await expect(page.locator('.flow-project-controls')).toBeInViewport({ ratio: 1 });
          await connectorsAttachToNodes(page);
          await connectorsAvoidContent(page);
          expect((await card.boundingBox())!.y).toBeLessThanOrEqual(layout.cardTop + 1);
          await setProgress(page, .78);
          await expect(image).toBeInViewport({ ratio: 1 });
          expect(Math.abs((await card.boundingBox())!.y - layout.cardTop)).toBeLessThan(1);
          await setProgress(page, .96);
        } else {
          await expect(card).toBeInViewport({ ratio: 1 });
          await expect(page.locator('.flow-project-controls')).toBeInViewport({ ratio: 1 });
        }
        await noOverflow(page);
      });
      if (index < count - 1) {
        await page.getByRole('button', { name: 'Next project' }).click();
        await expect(page.locator('.flow-project-card[data-active=true] h3')).not.toHaveText(title || '');
      }
    }
  });
}
