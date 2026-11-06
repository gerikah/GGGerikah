"use client";

import Link from 'next/link';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import type { Capability, Project } from '@api/contracts/cms';
import { AboutCredentials, AboutDetails, DeveloperTools } from './flow-details';
import { ProcessFlow } from './process-flow';
import { MediaFrame } from '@frontend/components/media/media-frame';
import { portfolio as c } from '@frontend/content/portfolio';
import { connections, connectorPoints, pathData, lineProgress, type Box, type ConnectorId, type NodeId, type Point } from './flow-layout';

type Props = { resumeUrl: string; githubUrl: string; projects: Project[]; tools: Capability[] };
type ToolDisplay = { id: string; title: string; logo_key: string | null; description: string | null };
const nodeLinks: Record<NodeId, string> = { start: '#about', engineer: '#about', developer: '#development', decision: '#capability-branches', design: '#design-details', build: '#build-details', works: '#selected-work', process: '#process', talk: '#contact' };
function FlowNode({ id }: { id: NodeId }) {
  const label = id === 'process' ? 'How I work' : c.nodes[id];
  const content = <span>{label}</span>;
  return id === 'decision'
    ? <div className="flow-node flow-node--decision" data-flow-node={id} aria-label="Design and development branches">{content}</div>
    : <a className={`flow-node flow-node--${id}${id === 'start' || id === 'talk' ? ' flow-node--pill' : ''}`} data-flow-node={id} href={nodeLinks[id]}>{content}</a>;
}
function FlowConnectors() {
  return <svg className="flow-connectors" aria-hidden="true">
    <defs><marker id="flow-arrow" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto" markerUnits="userSpaceOnUse"><path d="M 2 0 L 7 4.5 L 2 9" fill="none" stroke="currentColor" strokeWidth="1.5" /></marker></defs>
    {connections.map(edge => <g key={`${edge.from}-${edge.to}`}>
      <path className="flow-edge-guide" data-flow-guide={`${edge.from}-${edge.to}`} markerEnd={edge.to === 'merge' ? undefined : 'url(#flow-arrow)'} />
      <path className="flow-edge" data-flow-edge={`${edge.from}-${edge.to}`} data-from={edge.from} data-to={edge.to} pathLength="1" />
    </g>)}
    <circle className="flow-junction" data-flow-junction r="3" />
  </svg>;
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
    ...projects.flatMap(project => project.tools.map(title => { const key = title.toLowerCase().replace(/[^a-z0-9]+/g, ''); return { id: `project-${project.id}-${key}`, title, logo_key: logoKeys.has(key) ? key : null, description: null }; })),
  ];
  const unique = new Map<string, ToolDisplay>();
  for (const tool of display) { const key = tool.title.trim().toLowerCase(), previous = unique.get(key); if (!previous || (!previous.logo_key && tool.logo_key)) unique.set(key, tool); }
  return [...unique.values()];
}

export function FlowJourney({ resumeUrl, githubUrl, projects, tools }: Props) {
  const root = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  const [enhanced, setEnhanced] = useState(false);
  const [coverRatios, setCoverRatios] = useState<Record<string, number>>({});
  const availableTools = mergeTools(tools, projects);
  const select = (direction: number) => { if (projects.length) setActive(current => (current + direction + projects.length) % projects.length); };

  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const svg = element.querySelector<SVGSVGElement>('.flow-connectors')!;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const compact = matchMedia('(max-width: 699px)');
    const chapters = [...element.querySelectorAll<HTMLElement>('[data-flow-stage]')];
    const contact = document.querySelector<HTMLElement>('#contact');
    const stages = contact ? [...chapters, contact] : chapters;
    const nodeElements = new Map<ConnectorId, HTMLElement>();
    document.querySelectorAll<HTMLElement>('[data-flow-node]').forEach(node => nodeElements.set(node.dataset.flowNode as NodeId, node));
    const paths = connections.map(edge => ({ edge, path: svg.querySelector<SVGPathElement>(`[data-flow-edge="${edge.from}-${edge.to}"]`)!, guide: svg.querySelector<SVGPathElement>(`[data-flow-guide="${edge.from}-${edge.to}"]`)!, points: [] as Point[] }));
    let frame = 0, dirty = true, disposed = false;
    const rect = (target: Element, origin: DOMRect): Box => { const box = target.getBoundingClientRect(); return { x: box.left - origin.left, y: box.top - origin.top, width: box.width, height: box.height }; };
    const render = () => {
      frame = 0;
      const origin = element.getBoundingClientRect();
      const headerHeight = document.querySelector('.nav-shell')?.getBoundingClientRect().height || 72;
      document.documentElement.style.setProperty('--journey-header', `${headerHeight}px`);
      if (dirty) {
        dirty = false;
        const boxes = Object.fromEntries([...nodeElements].map(([id, node]) => [id, rect(node, origin)])) as Record<ConnectorId, Box>;
        if (!boxes.talk) return;
        const branchArea = rect(element.querySelector('.flow-branches')!, origin);
        const decision = boxes.decision;
        boxes.merge = { x: decision.x + decision.width / 2, y: branchArea.y + branchArea.height + 28, width: 0, height: 0 };
        const rail = compact.matches ? 12 : boxes.developer.x + boxes.developer.width / 2;
        const height = Math.max(element.offsetHeight, boxes.talk.y + boxes.talk.height + 2);
        svg.style.height = `${height}px`;
        svg.setAttribute('viewBox', `0 0 ${element.clientWidth} ${height}`);
        const junction = svg.querySelector('[data-flow-junction]')!;
        junction.setAttribute('cx', String(boxes.merge.x)); junction.setAttribute('cy', String(boxes.merge.y));
        for (const item of paths) {
          const route = connectorPoints(boxes, item.edge, { mobile: compact.matches, rail, branchLeft: branchArea.x - 12, branchRight: branchArea.x + branchArea.width + 12 });
          item.points = route.points;
          const d = pathData(route.points);
          item.path.setAttribute('d', d); item.guide.setAttribute('d', d);
          item.path.dataset.fromPort = route.fromPort; item.path.dataset.toPort = route.toPort;
        }
        element.dataset.flowReady = 'true';
        setEnhanced(true);
      }
      const revealY = innerHeight * .78 - origin.top;
      for (const item of paths) {
        const progress = reduced.matches ? 1 : lineProgress(item.points, revealY);
        item.path.style.strokeDashoffset = String(1 - progress);
        item.path.dataset.draw = progress.toFixed(4);
        if (progress > .999 && item.edge.to !== 'merge') item.path.setAttribute('marker-end', 'url(#flow-arrow)');
        else item.path.removeAttribute('marker-end');
      }
      let current = stages[0];
      for (const stage of stages) if (stage.getBoundingClientRect().top <= headerHeight + Math.max(100, (innerHeight - headerHeight) * .32)) current = stage;
      // A short final stage cannot reach the usual activation line before scroll ends.
      if (contact && scrollY + innerHeight >= document.documentElement.scrollHeight - 2 && contact.getBoundingClientRect().top < innerHeight) current = contact;
      for (const stage of stages) stage.dataset.activeStage = String(stage === current);
      for (const node of nodeElements.values()) node.dataset.active = String(node.closest('[data-flow-stage],#contact') === current);
      element.dataset.activeStage = current.dataset.flowStage || 'contact';
      element.dataset.motion = reduced.matches ? 'false' : 'true';
    };
    const queue = () => { if (!frame) frame = requestAnimationFrame(render); };
    const measure = () => { dirty = true; queue(); };
    const observer = new ResizeObserver(measure);
    observer.observe(element); if (contact) observer.observe(contact);
    for (const stage of stages) observer.observe(stage);
    for (const node of nodeElements.values()) observer.observe(node);
    window.addEventListener('scroll', queue, { passive: true });
    window.addEventListener('resize', measure);
    window.addEventListener('hashchange', measure);
    reduced.addEventListener('change', measure); compact.addEventListener('change', measure);
    document.fonts.ready.then(() => { if (!disposed) measure(); });
    measure();
    return () => { disposed = true; cancelAnimationFrame(frame); observer.disconnect(); window.removeEventListener('scroll', queue); window.removeEventListener('resize', measure); window.removeEventListener('hashchange', measure); reduced.removeEventListener('change', measure); compact.removeEventListener('change', measure); };
  }, []);

  // Native hash navigation can run before hydration collapses the project fallback
  // or fonts settle. Align once after that reflow, unless the visitor has moved on.
  useEffect(() => {
    if (!enhanced || !location.hash) return;
    const hash = location.hash;
    let cancelled = false, frame = 0;
    const cancel = () => { cancelled = true; };
    const inputs = ['wheel', 'touchstart', 'pointerdown', 'keydown'] as const;
    inputs.forEach(type => window.addEventListener(type, cancel, { passive: true }));
    document.fonts.ready.then(() => {
      frame = requestAnimationFrame(() => {
        frame = requestAnimationFrame(() => {
          if (cancelled || location.hash !== hash) return;
          const target = document.getElementById(hash.slice(1));
          target?.scrollIntoView({ block: 'start', behavior: 'instant' });
        });
      });
    });
    return () => { cancelled = true; cancelAnimationFrame(frame); inputs.forEach(type => window.removeEventListener(type, cancel)); };
  }, [enhanced]);

  return <section id="flow-journey" ref={root} className="flow-journey" aria-labelledby="hero-title">
    <FlowConnectors />
    <section className="flow-chapter flow-chapter--intro" data-flow-stage="intro" aria-labelledby="hero-title">
      <div className="flow-station"><FlowNode id="start" /></div>
      <div className="flow-content flow-hero" data-flow-content>
        <h2 id="hero-title" className="flow-headline">{c.hero.lines.map(line => <span key={line}>{line}</span>)}</h2>
        <p className="flow-subhead">{c.hero.subhead}</p>
        <div className="flow-hero-actions"><a href="#selected-work">{c.hero.primary} ↗</a><a href="#contact">{c.hero.secondary} ↗</a></div>
        <p className="flow-status">{c.hero.status}</p>
        <a className="flow-mobile-cue" href="#about">{c.hero.scroll} <span aria-hidden="true">↓</span></a>
      </div>
    </section>
    <section id="about" className="flow-chapter flow-chapter--about" data-flow-stage="about" aria-labelledby="flow-about-title">
      <div className="flow-station"><FlowNode id="engineer" /></div>
      <div className="flow-content flow-about" data-flow-content><AboutDetails resumeUrl={resumeUrl} /><AboutCredentials /></div>
    </section>
    <section id="development" className="flow-chapter flow-chapter--capabilities" data-flow-stage="capabilities" aria-labelledby="flow-tools-title">
      <div className="flow-station"><FlowNode id="developer" /></div>
      <div className="flow-content">
        <div className="flow-tools-heading" data-flow-content><p className="flow-kicker">Capability / Tools and technology</p><h2 id="flow-tools-title">From flows to function.</h2><p>I bring interface design and development together so the experience stays clear from the first sketch to the working website.</p></div>
        <div id="capability-branches" className="flow-branching">
          <div className="flow-decision"><FlowNode id="decision" /></div>
          <div className="flow-branches">
            <div className="flow-branch"><FlowNode id="design" /><p id="design-details" className="flow-branch-description" data-flow-content><strong>Design.</strong> Organizing information, mapping user journeys, and designing interfaces that make the next step clear.</p></div>
            <div className="flow-branch"><FlowNode id="build" /><p id="build-details" className="flow-branch-description" data-flow-content><strong>Development.</strong> Building responsive interfaces, reusable components, and the functionality behind the experience.</p></div>
          </div>
        </div>
        <div className="flow-tool-content" data-flow-content><DeveloperTools tools={availableTools} githubUrl={githubUrl} /></div>
      </div>
    </section>
    <section id="selected-work" className="flow-chapter flow-chapter--works" data-flow-stage="works" aria-labelledby="selected-works-title">
      <div className="flow-station"><FlowNode id="works" /></div>
      <div className="flow-content flow-projects" data-flow-content>
        <div className="flow-projects__heading"><p className="flow-kicker">Projects / Selected works</p><h2 id="selected-works-title">{c.work.title}</h2><p>{c.work.intro}</p></div>
        <div className="flow-project-stack" data-enhanced={enhanced} aria-label="Selected projects">
          {projects.map((project, index) => { const depth = (index - active + projects.length) % projects.length; return <article key={project.id} className="flow-project-card" data-active={!enhanced || index === active} data-depth={Math.min(depth, 3)} aria-hidden={enhanced && index !== active} inert={enhanced && index !== active} style={{ '--cover-ratio': coverRatios[project.id] || 2, zIndex: projects.length - depth } as CSSProperties}>
            <Link href={'/work/' + project.slug} className="flow-project-link" tabIndex={!enhanced || index === active ? undefined : -1}>
              <MediaFrame src={project.cover_image_url} alt={project.cover_alt || project.title} sizes="(min-width:1100px) 700px, (min-width:700px) 65vw, 90vw" onDimensions={(width, height) => { if (width > 0 && height > 0) setCoverRatios(previous => previous[project.id] === width / height ? previous : { ...previous, [project.id]: width / height }); }} />
              <div className="flow-project-caption"><h3>{project.title}</h3><span aria-hidden="true">↗</span></div>
              <div className="flow-project-summary"><p>{projectDescription(project)}</p></div>
              <span className="flow-text-link">{c.work.read} ↗</span>
            </Link>
          </article>; })}
        </div>
        {projects.length > 0 && <div className="flow-project-controls">{enhanced && projects.length > 1 && <><button type="button" onClick={() => select(-1)} aria-label={c.work.previous}>←</button><span aria-live="polite" aria-atomic="true">{String(active + 1).padStart(2, '0')} / {String(projects.length).padStart(2, '0')}</span><button type="button" onClick={() => select(1)} aria-label={c.work.next}>→</button></>}<Link href="/work">{c.work.all} ↗</Link></div>}
        {!projects.length && <p>Projects are being prepared. <Link href="/work">Visit the work archive ↗</Link></p>}
      </div>
    </section>
    <section id="process" className="flow-chapter flow-chapter--process" data-flow-stage="process" aria-labelledby="process-title"><div className="flow-station"><FlowNode id="process" /></div><div className="flow-content" data-flow-content><ProcessFlow /></div></section>
  </section>;
}
