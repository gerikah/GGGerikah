"use client";

import Link from 'next/link';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import type { Capability, Project } from '@api/contracts/cms';
import { AboutCredentials, AboutDetails, DeveloperTools } from './flow-details';
import { ProcessFlow } from './process-flow';
import { MediaFrame } from '@frontend/components/media/media-frame';
import { portfolio as c } from '@frontend/content/portfolio';
import { connections, flowConnectorPath, flowNodePositions, flowPanelLayout, flowPanelOpacity, nodeIds, type Box, type ConnectorId, type NodeId, type PanelRect } from './flow-layout';

type Props = { resumeUrl: string; githubUrl: string; projects: Project[]; tools: Capability[] };
type PanelId = 'about' | 'tools' | 'projects';
type ToolDisplay = { id: string; title: string; logo_key: string | null; description: string | null };

const nodes: { id: NodeId; href?: string; pill?: boolean }[] = [
  { id: 'start', href: '#about', pill: true },
  { id: 'engineer', href: '#about' },
  { id: 'developer', href: '#development' },
  { id: 'decision' },
  { id: 'design', href: '#development' },
  { id: 'build', href: '#development' },
  { id: 'works', href: '#selected-work' },
  { id: 'talk', href: '#contact', pill: true },
];

function FlowNode({ id }: { id: NodeId }) {
  const node = nodes.find(item => item.id === id)!;
  const className = `flow-node flow-node--${id}${node.pill ? ' flow-node--pill' : ''}`;
  const label = <><span>{c.nodes[id]}</span>{(id === 'design' || id === 'build') && <small className="flow-branch-label">{c.branches[id]}</small>}</>;
  return node.href
    ? <a className={className} data-flow-node={id} href={node.href}>{label}</a>
    : <div className={className} data-flow-node={id} aria-label={c.nodes.decision}>{label}</div>;
}

function FlowConnectors() {
  return <svg className="flow-connectors" aria-hidden="true">
    <defs>
      <marker id="flow-arrow" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto" markerUnits="userSpaceOnUse">
        <path d="M 2 0 L 7 4.5 L 2 9" fill="none" stroke="currentColor" strokeWidth="1.5" />
      </marker>
    </defs>
    {connections.map(edge => <path key={`${edge.from}-${edge.to}`} data-flow-edge={`${edge.from}-${edge.to}`} fill="none" stroke="currentColor" strokeWidth="1.5" markerEnd={edge.to === 'merge' ? undefined : 'url(#flow-arrow)'} />)}
    <circle className="flow-junction" data-flow-junction cx="0" cy="0" r="2.5" />
  </svg>;
}

function FlowDiagram() {
  return <div className="flow-diagram" role="group" aria-label="Portfolio flowchart">
    <FlowConnectors />
    {nodeIds.map(id => <FlowNode key={id} id={id} />)}
  </div>;
}

function projectDescription(project: Project) {
  if (/sipi/i.test(project.title)) return 'A searchable thesis repository for the Computer Engineering Department at PUP Main Campus.';
  if (/off\s*the\s*rack/i.test(project.title)) return 'A fashion catalog with a storefront and product management dashboard.';
  return project.short_description;
}

function mergeTools(tools: Capability[], projects: Project[]): ToolDisplay[] {
  const logoKeys = new Set(['figma', 'git', 'html5', 'css3', 'javascript', 'nextjs', 'nodejs', 'postgresql', 'react', 'supabase', 'typescript', 'vercel']);
  const display: ToolDisplay[] = [
    ...tools.map(({ id, title, logo_key, description }) => ({ id, title, logo_key: logo_key || null, description: description || null })),
    ...projects.flatMap(project => project.tools.map(title => {
      const key = title.toLowerCase().replace(/[^a-z0-9]+/g, '');
      return {
        id: `project-${project.id}-${key}`,
        title,
        logo_key: logoKeys.has(key) ? key : null,
        description: null,
      };
    })),
  ];
  const unique = new Map<string, ToolDisplay>();
  for (const tool of display) {
    const key = tool.title.trim().toLowerCase();
    const previous = unique.get(key);
    if (!previous || (!previous.logo_key && tool.logo_key)) unique.set(key, tool);
  }
  return [...unique.values()];
}

function setPanelPosition(element: HTMLElement, rect: PanelRect, width: number, height: number) {
  element.style.left = `${rect.left * width}px`;
  element.style.top = `${rect.top * height}px`;
  element.style.width = `${rect.width * width}px`;
  element.style.height = `${rect.height * height}px`;
}

export function FlowJourney({ resumeUrl, githubUrl, projects, tools }: Props) {
  const root = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  const [coverRatios, setCoverRatios] = useState<Record<string, number>>({});
  const [motion, setMotion] = useState(false);
  const select = (direction: number) => { if (projects.length) setActive(current => (current + direction + projects.length) % projects.length); };
  const availableTools = mergeTools(tools, projects);

  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const track = element.querySelector<HTMLElement>('.flow-track')!;
    const stage = element.querySelector<HTMLElement>('.flow-stage')!;
    const svg = element.querySelector<SVGSVGElement>('.flow-connectors')!;
    const paths = Array.from(element.querySelectorAll<SVGPathElement>('[data-flow-edge]'));
    const junction = element.querySelector<SVGCircleElement>('[data-flow-junction]')!;
    const panelElements = Object.fromEntries((['about', 'tools', 'projects'] as const).map(id => [
      id, element.querySelector<HTMLElement>(`.flow-panel--${id}`)!,
    ])) as Record<PanelId, HTMLElement>;
    const hero = element.querySelector<HTMLElement>('.flow-hero')!;
    const media = window.matchMedia('(min-width: 1100px) and (min-height: 720px) and (prefers-reduced-motion: no-preference)');
    let frame = 0;
    let disposed = false;
    let travel = 0;
    let start = 0;
    let currentMotion = media.matches;
    let width = 0;
    let height = 0;

    const syncMode = () => {
      currentMotion = media.matches;
      element.dataset.motion = String(currentMotion);
      setMotion(currentMotion);
      if (!currentMotion) {
        track.style.height = '';
        element.style.removeProperty('--flow-travel');
        for (const panel of Object.values(panelElements)) {
          panel.style.cssText = '';
          panel.removeAttribute('aria-hidden');
          panel.inert = false;
        }
        hero.style.opacity = '';
        hero.style.visibility = '';
      }
      queue();
    };

    const measure = () => {
      frame = 0;
      const nav = document.querySelector<HTMLElement>('.nav-shell .nav');
      const navHeight = nav?.getBoundingClientRect().height ?? 0;
      element.style.setProperty('--flow-sticky-top', `${navHeight}px`);
      width = stage.clientWidth;
      height = stage.clientHeight;
      if (!width || !height) return;

      if (currentMotion) {
        travel = height * 4.3;
        track.style.height = `${height + travel}px`;
        element.style.setProperty('--flow-travel', `${travel}px`);
        start = Math.max(0, track.getBoundingClientRect().top + window.scrollY - navHeight);
      }

      const progress = currentMotion ? Math.max(0, Math.min(1, (window.scrollY - start) / travel)) : 0;
      element.dataset.progress = progress.toFixed(4);
      const positions = flowNodePositions(progress);
      const gutter = nav ? nav.getBoundingClientRect().left - stage.getBoundingClientRect().left : 56;
      const opacity = flowPanelOpacity(progress);
      if (currentMotion) {
        const anchorStops = [.25, .50, .78];
        element.querySelectorAll<HTMLElement>('[data-flow-anchor]').forEach((anchor, index) => {
          anchor.style.top = `${anchorStops[index] * travel}px`;
        });
      }

      let projectOffset = 0;
      if (currentMotion) {
        for (const id of nodeIds) {
          const node = element.querySelector<HTMLElement>(`[data-flow-node="${id}"]`)!;
          const dimensions = node.getBoundingClientRect();
          node.style.left = `${positions[id].x * width - dimensions.width / 2}px`;
          node.style.top = `${positions[id].y * height - dimensions.height / 2}px`;
          const nodeBounds = node.getBoundingClientRect();
          const stageBounds = stage.getBoundingClientRect();
          const outside = nodeBounds.bottom <= stageBounds.top || nodeBounds.top >= stageBounds.bottom
            || nodeBounds.right <= stageBounds.left || nodeBounds.left >= stageBounds.right;
          node.setAttribute('aria-hidden', String(outside));
          node.inert = outside;
        }
        const layout = flowPanelLayout(width, height, gutter);
        for (const [id, panel] of Object.entries(panelElements) as [PanelId, HTMLElement][]) {
          setPanelPosition(panel, layout[id], width, height);
          panel.style.opacity = String(opacity[id]);
          const hidden = opacity[id] < .05;
          panel.style.visibility = hidden ? 'hidden' : 'visible';
          panel.setAttribute('aria-hidden', String(hidden));
          panel.inert = hidden;
        }
        // A content panel may be taller than a laptop stage: let the reading hold pan it,
        // while keeping type at its readable size. Routes use the same measured frame.
        for (const [id, from, to] of [['about', .21, .31], ['tools', .46, .57], ['projects', .78, .96]] as const) {
          const panel = panelElements[id];
          panel.style.transform = '';
          const stageTop = stage.getBoundingClientRect().top;
          const children = [...panel.querySelectorAll<HTMLElement>(id === 'about' ? '.flow-about__details,.flow-about__credentials' : id === 'tools' ? '.flow-tools-board' : '.flow-project-stack,.flow-project-controls')];
          const bottom = Math.max(...children.map(child => child.getBoundingClientRect().bottom - stageTop));
          const overflow = Math.max(0, bottom - height + 32);
          const reading = Math.max(0, Math.min(1, (progress - from) / (to - from)));
          panel.style.transform = `translateY(${-overflow * reading}px)`;
          if (id === 'projects') projectOffset = overflow * reading;
        }
        hero.style.opacity = String(opacity.hero);
        hero.style.visibility = opacity.hero < .05 ? 'hidden' : 'visible';
        hero.setAttribute('aria-hidden', String(opacity.hero < .05));
        hero.inert = opacity.hero < .05;
      } else {
        for (const id of nodeIds) {
          const node = element.querySelector<HTMLElement>(`[data-flow-node="${id}"]`)!;
          node.style.left = '';
          node.style.top = '';
          node.removeAttribute('aria-hidden');
          node.inert = false;
        }
        hero.removeAttribute('aria-hidden');
        hero.inert = false;
      }

      const svgBounds = svg.getBoundingClientRect();
      svg.setAttribute('viewBox', `0 0 ${svgBounds.width} ${svgBounds.height}`);
      const boxes = Object.fromEntries(nodeIds.map(id => {
        const rect = element.querySelector<HTMLElement>(`[data-flow-node="${id}"]`)!.getBoundingClientRect();
        return [id, {
          x: rect.left - svgBounds.left + rect.width / 2,
          y: rect.top - svgBounds.top + rect.height / 2,
          width: rect.width,
          height: rect.height,
        }];
      })) as Record<NodeId, Box>;
      const branchesBottom = Math.max(boxes.design.y + boxes.design.height / 2, boxes.build.y + boxes.build.height / 2);
      const worksTop = boxes.works.y - boxes.works.height / 2;
      const spread = currentMotion ? Math.max(0, Math.min(1, (progress - .34) / .10)) : 0;
      const projectSpread = currentMotion ? Math.max(0, Math.min(1, (progress - .60) / .12)) : 0;
      const boardTop = panelElements.tools.querySelector('.flow-tools-board')!.getBoundingClientRect().top - svgBounds.top;
      const merge: Box = {
        x: ((boxes.build.x + boxes.build.width / 2 + 28) * (1 - spread) + (svgBounds.width - gutter / 2) * spread) * (1 - projectSpread) + boxes.works.x * projectSpread,
        y: (branchesBottom + worksTop) / 2 * (1 - spread) + (height + 28) * spread * (1 - projectSpread) + (28 - projectOffset) * projectSpread,
        width: 0, height: 0,
      };
      junction.setAttribute('cx', String(merge.x));
      junction.setAttribute('cy', String(merge.y));
      const allBoxes: Record<ConnectorId, Box> = { ...boxes, merge };
      for (const [index, edge] of connections.entries()) {
        paths[index].setAttribute('d', flowConnectorPath(allBoxes, edge, { spread, projectSpread, boardTop, gutter, width: svgBounds.width }));
      }
    };

    const queue = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    const observer = new ResizeObserver(queue);
    observer.observe(stage);
    for (const id of nodeIds) observer.observe(element.querySelector<HTMLElement>(`[data-flow-node="${id}"]`)!);
    for (const panel of Object.values(panelElements)) observer.observe(panel);
    element.querySelectorAll('.flow-project-stack,.flow-project-controls').forEach(child => observer.observe(child));
    window.addEventListener('scroll', queue, { passive: true });
    window.addEventListener('resize', syncMode);
    media.addEventListener('change', syncMode);
    document.fonts.ready.then(() => { if (!disposed) queue(); });
    element.dataset.motion = String(currentMotion);
    setMotion(currentMotion);
    queue();

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('scroll', queue);
      window.removeEventListener('resize', syncMode);
      media.removeEventListener('change', syncMode);
    };
  }, []);

  const hero = <div className="flow-hero">
    <h2 id="hero-title" className="flow-headline">{c.hero.lines.map(line => <span key={line}>{line}</span>)}</h2>
    <p className="flow-subhead">{c.hero.subhead}</p>
    <div className="flow-hero-actions"><a href="#selected-work">{c.hero.primary} ↗</a><a href="#contact">{c.hero.secondary} ↗</a></div>
    <p className="flow-status">{c.hero.status}</p>
    <a className="flow-mobile-cue" href="#about">{c.hero.scroll} <span aria-hidden="true">↓</span></a>
  </div>;

  return (
    <section id="flow-journey" ref={root} className="flow-journey" aria-labelledby="hero-title">
      {(['about', 'development', 'selected-work'] as const).map((id, index) => (
        <span key={id} className="flow-scroll-anchor" data-flow-anchor={id} id={motion ? id : undefined} style={{ top: `${[.25, .50, .78][index] * 100}%` }} />
      ))}
      <div className="flow-track"><div className="flow-stage">
        {hero}
        <FlowDiagram />
        <section id={!motion ? 'about' : undefined} className="flow-about flow-panel flow-panel--about wrap" aria-labelledby="flow-about-title">
          <AboutCredentials />
          <AboutDetails resumeUrl={resumeUrl} />
        </section>
        <DeveloperTools id={!motion ? 'development' : undefined} tools={availableTools} githubUrl={githubUrl} />
        <section id={!motion ? 'selected-work' : undefined} className="flow-projects flow-panel flow-panel--projects wrap" aria-labelledby="selected-works-title">
          <div className="flow-projects__heading">
            <p className="flow-kicker">Projects / Selected works</p>
            <h2 id="selected-works-title">{c.work.title}</h2>
            <p>{c.work.intro}</p>
          </div>
          <div className="flow-project-stack" aria-label="Selected project">
            {projects.map((project, index) => {
              const depth = (index - active + projects.length) % projects.length;
              return <article key={project.id} className="flow-project-card" data-active={index === active} data-depth={Math.min(depth, 3)} aria-hidden={index !== active} inert={index !== active} style={{ '--cover-ratio': coverRatios[project.id] || 2, '--card-depth': Math.min(depth, 3), '--card-rotation': (depth === 1 ? .7 : depth === 2 ? 1.4 : 2) + 'deg', zIndex: projects.length - depth } as CSSProperties}>
                <Link href={'/work/' + project.slug} className="flow-project-link" tabIndex={index === active ? undefined : -1}>
                  <MediaFrame src={project.cover_image_url} alt={project.cover_alt || project.title} sizes="(min-width:820px) 682px, 92vw" onDimensions={(width, height) => {
                    if (width > 0 && height > 0) setCoverRatios(previous => previous[project.id] === width / height ? previous : { ...previous, [project.id]: width / height });
                  }} />
                  <div className="flow-project-caption"><h3>{project.title}</h3><span aria-hidden="true">↗</span></div>
                  <div className="flow-project-summary"><p>{projectDescription(project)}</p></div>
                  <span className="flow-text-link">{c.work.read} ↗</span>
                </Link>
              </article>;
            })}
          </div>
          {projects.length > 0 && <div className="flow-project-controls">
            {projects.length > 1 && <>
            <button type="button" onClick={() => select(-1)} aria-label={c.work.previous}>←</button>
            <span aria-live="polite" aria-atomic="true">{String(active + 1).padStart(2, '0')} / {String(projects.length).padStart(2, '0')}</span>
            <button type="button" onClick={() => select(1)} aria-label={c.work.next}>→</button>
            </>}<Link href="/work">{c.work.all} ↗</Link>
          </div>}
          {!projects.length && <p>Projects are being prepared. <Link href="/work">Visit the work archive ↗</Link></p>}
        </section>
      </div></div>
      <div id="process" className="flow-continuation"><ProcessFlow /></div>
    </section>
  );
}
