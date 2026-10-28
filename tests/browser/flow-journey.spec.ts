import { expect, test, type Page } from '@playwright/test';

async function progress(page:Page, value:number) {
  await expect(page.locator('.flow-journey')).toHaveAttribute('data-motion','true');
  await page.evaluate(p=>{const root=document.querySelector<HTMLElement>('.flow-journey')!;const stage=document.querySelector<HTMLElement>('.flow-stage')!;const nav=document.querySelector('.nav-shell')!.getBoundingClientRect().height;window.scrollTo({top:root.getBoundingClientRect().top+scrollY-nav+p*(root.offsetHeight-stage.offsetHeight),behavior:'instant'});},value);
  await expect.poll(async()=>Number(await page.locator('.flow-journey').getAttribute('data-progress'))).toBeCloseTo(value,2);
}
async function connectorErrors(page:Page) {
  return page.evaluate(()=>[...document.querySelectorAll<SVGPathElement>('[data-flow-edge]')].map(path=>{
    const [from,to]=path.dataset.flowEdge!.split('-');
    const a=document.querySelector('[data-flow-node="'+from+'"]')!.getBoundingClientRect();
    const b=document.querySelector('[data-flow-node="'+to+'"]')!.getBoundingClientRect();
    const svg=path.ownerSVGElement!.getBoundingClientRect();
    const first=path.getPointAtLength(0),last=path.getPointAtLength(path.getTotalLength());
    const expectedStart=from==='start'?{x:a.x+a.width/2,y:a.bottom}:from==='decision'&&to==='design'?{x:a.left,y:a.y+a.height/2}:{x:a.right,y:a.y+a.height/2};
    const expectedEnd=to==='engineer'?{x:b.left,y:b.y+b.height/2}:{x:b.x+b.width/2,y:b.top};
    return Math.max(Math.abs(first.x+svg.x-expectedStart.x),Math.abs(first.y+svg.y-expectedStart.y),Math.abs(last.x+svg.x-expectedEnd.x),Math.abs(last.y+svg.y-expectedEnd.y));
  }));
}
test('diagram stays attached, reverses, and supports native navigation and project controls',async({page})=>{
  test.setTimeout(120000);
  await page.setViewportSize({width:1440,height:900});
  await page.goto('/',{waitUntil:'domcontentloaded'});
  await expect(page.locator('.flow-journey')).toHaveAttribute('data-motion','true');
  await page.evaluate(()=>document.fonts.ready);
  await expect(page.locator('#hero-title')).toHaveText('BEFORE THE CODE,I CONNECT THE DOTS.');
  const initial=await page.locator('[data-flow-node="developer"]').boundingBox();
  for(const p of [0,.24,.49,.72,.95,.49,.24,0]){await progress(page,p);expect(Math.max(...await connectorErrors(page))).toBeLessThan(2);}
  const reversed=await page.locator('[data-flow-node="developer"]').boundingBox();
  expect(Math.abs(initial!.y-reversed!.y)).toBeLessThan(2);
  await page.getByRole('navigation',{name:'Primary navigation'}).getByRole('link',{name:'About',exact:true}).click();
  await expect.poll(async()=>Number(await page.locator('.flow-journey').getAttribute('data-progress'))).toBeCloseTo(.24,2);
  await expect(page.locator('.flow-about')).toHaveAttribute('aria-hidden','false');
  await page.getByRole('navigation',{name:'Primary navigation'}).getByRole('link',{name:'Work',exact:true}).click();
  await expect.poll(async()=>Number(await page.locator('.flow-journey').getAttribute('data-progress'))).toBeCloseTo(.72,2);
  const before=await page.locator('.flow-project-card[data-active=true] h2').textContent();
  await page.getByRole('button',{name:'Next project',exact:true}).click();
  await expect(page.locator('.flow-project-card[data-active=true] h2')).not.toHaveText(before!);
  await expect(page.locator('.flow-project-card[data-active=true]')).not.toHaveAttribute('inert','');
  expect(await page.locator('.flow-project-card img').evaluateAll(imgs=>imgs.every(img=>getComputedStyle(img).filter==='none'))).toBe(true);
  await page.getByRole('button',{name:'Previous project',exact:true}).click();
  await expect(page.locator('.flow-project-card[data-active=true] h2')).toHaveText(before!);
  await page.locator('[data-flow-node="talk"]').click();
  await expect(page.locator('#contact')).toBeInViewport();
});
for(const [name,width,height,reduced] of [['mobile',390,844,false],['tablet',768,1024,false],['short laptop',1280,650,false],['reduced motion',1440,900,true]] as const){
  test(name+' shows a readable unpinned document',async({page})=>{
    test.setTimeout(120000);
    await page.setViewportSize({width,height});
    if(reduced)await page.emulateMedia({reducedMotion:'reduce'});
    await page.goto('/',{waitUntil:'domcontentloaded'});
    await expect(page.locator('.flow-journey')).toHaveAttribute('data-motion','false');
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    expect(await page.locator('.flow-stage').evaluate(el=>getComputedStyle(el).position)).not.toBe('sticky');
    expect(await page.locator('.flow-project-card').evaluateAll(cards=>cards.every(card=>!card.hasAttribute('inert')))).toBe(true);
    await page.getByRole('navigation',{name:'Primary navigation'}).getByRole('link',{name:'About',exact:true}).click();
    await expect(page.locator('.flow-about')).toBeInViewport();
    await expect(page.locator('[data-flow-node="design"]')).toHaveAttribute('href',/^\/work(?:\/[^/]+)?$/);
    await expect(page.getByText('Behind the work',{exact:false})).toHaveCount(0);
    await expect(page.locator('.flow-tools')).toContainText('Codex');
  });
}

test('direct work links and resizing keep the journey usable',async({page})=>{
  test.setTimeout(120000);
  await page.setViewportSize({width:1440,height:900});
  await page.goto('/#selected-work',{waitUntil:'domcontentloaded'});
  await expect.poll(async()=>Number(await page.locator('.flow-journey').getAttribute('data-progress'))).toBeCloseTo(.72,2);
  await expect(page.locator('.flow-projects')).toHaveAttribute('aria-hidden','false');
  await page.setViewportSize({width:1100,height:720});
  await progress(page,.24);
  const details=await page.locator('.flow-about').boundingBox();
  expect(details!.y+details!.height).toBeLessThan(720);
  expect(Math.max(...await connectorErrors(page))).toBeLessThan(2);
  await page.setViewportSize({width:390,height:844});
  await expect(page.locator('.flow-journey')).toHaveAttribute('data-motion','false');
  expect(await page.locator('.flow-about').evaluate(el=>el.hasAttribute('inert'))).toBe(false);
  await page.setViewportSize({width:1440,height:900});
  await progress(page,.49);
  expect(Math.max(...await connectorErrors(page))).toBeLessThan(2);
  const tools=await page.locator('.flow-branch-copy').boundingBox();
  expect(tools!.y+tools!.height).toBeLessThan(900);
  await expect(page.locator('.flow-about time')).toContainText(/\d{1,2}:\d{2}\s*[AP]M/);
});
