"use client";

import Image from 'next/image';
import { portfolio as c } from '@frontend/content/portfolio';
import '@frontend/styles/flow-details-polish.css';

type ToolDisplay = { id: string; title: string; logo_key: string | null; description: string | null };

export function AboutDetails({ resumeUrl }: { resumeUrl: string }) {
    const [degree, ...degreeDetails] = c.about.education[0].split(' · ');
    const [university, ...universityDetails] = c.about.education[1].split(' · ');
    return (
        <div className="flow-about__details flow-details-polished">
            <h2 id="flow-about-title">{c.about.title}</h2>
            <p className="flow-bio">{c.about.bio}</p>
            <p className="flow-bio flow-bio--support">{c.about.bioSupport}</p>
            <section className="flow-education" aria-labelledby="flow-education-title">
                <h3 id="flow-education-title">Education</h3>
                <p className="flow-education__degree">{degree}</p>
                <p className="flow-education__school">{university}</p>
                <p className="flow-education__metadata">{[...degreeDetails, ...universityDetails].join(' · ')}</p>
            </section>
            <dl className="flow-facts">
                <div><dt>{c.about.roleTitle}</dt><dd>{c.about.role}</dd></div>
                <div><dt>{c.about.basedTitle}</dt><dd>{c.about.based}</dd></div>
                <div><dt>{c.about.howTitle}</dt><dd>{c.about.how}</dd></div>
            </dl>
            <p className="flow-about__deliverable"><strong>{c.about.receiveTitle}</strong>{c.about.receive}</p>
            {resumeUrl && <a className="flow-text-link" href={resumeUrl} target="_blank" rel="noopener noreferrer">{c.about.resume} ↗</a>}
        </div>
    );
}

export function AboutCredentials() {
    return (
        <aside className="flow-about__credentials flow-details-polished" aria-labelledby="flow-credentials-title">
            <h3 id="flow-credentials-title">{c.about.achievementsTitle}</h3>
            <ul>
                {c.about.achievements.map((item, index) => (
                    <li key={item}>
                        <span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
                        <p>{item}</p>
                    </li>
                ))}
            </ul>
        </aside>
    );
}

// Classify only published CMS records; matching a category never adds a technology.
const toolGroups = [
    { title: 'Design & planning', pattern: /figma|figjam|canva|design|wireframe|prototyp|planning/ },
    { title: 'Frontend', pattern: /html|css|javascript|typescript|react|nextjs|next\.js|\bvite\b|vue|svelte|angular|tailwind/ },
    { title: 'Backend & data', pattern: /node|supabase|postgres|upstash|redis|mysql|sql|mongo|firebase|fastify|express|prisma|python|php/ },
    { title: 'Testing', pattern: /playwright|jest|vitest|cypress|testing|test/ },
    { title: 'Deployment', pattern: /vercel|netlify|docker|cloudflare|aws|azure|hosting|deploy/ },
    { title: 'Version control', pattern: /github|gitlab|bitbucket|\bgit\b/ },
    { title: 'AI & workflow', pattern: /codex|openai|chatgpt|claude|copilot|automation/ },
    { title: 'Development environment', pattern: /vscode|vs code|visual studio|cursor|webstorm|intellij|editor|ide/ },
];
const availableLogos = new Set(['figma', 'javascript', 'html5', 'css3', 'react', 'nextjs', 'typescript', 'nodejs', 'supabase', 'postgresql', 'git', 'vercel']);

function ToolIcon({ tool }: { tool: ToolDisplay }) {
    const words = tool.title.trim().split(/[\s.-]+/);
    const initials = (words.length > 1 ? words.slice(0, 2).map(word => word[0]).join('') : tool.title.slice(0, 2)).toUpperCase();
    return (
        <span className="flow-tool-icon" aria-hidden="true">
            {tool.logo_key && availableLogos.has(tool.logo_key)
                ? <Image src={`/images/stack/${tool.logo_key}.svg`} alt="" width={24} height={24} />
                : <span className="flow-tool-fallback">{initials}</span>}
        </span>
    );
}

export function DeveloperTools({ tools, githubUrl, id }: { tools: ToolDisplay[]; githubUrl: string; id?: string }) {
    const categories = new Map<string, ToolDisplay[]>();
    for (const tool of tools) {
        const searchable = `${tool.title} ${tool.logo_key || ''}`.toLowerCase();
        const category = toolGroups.find(group => group.pattern.test(searchable))?.title || 'Development tools';
        categories.set(category, [...(categories.get(category) || []), tool]);
    }
    const groups = [...toolGroups.map(group => group.title), 'Development tools']
        .filter(title => categories.has(title))
        .map(title => ({ title, tools: categories.get(title)! }));

    return (
        <section id={id} className="flow-branch-copy flow-panel flow-panel--tools flow-details-polished" aria-labelledby="flow-tools-title">
            <div className="flow-tools-heading">
                <p className="flow-kicker">Capability / Tools and technology</p>
                <h2 id="flow-tools-title">From flows to function.</h2>
                <p>I bring interface design and development together so the experience stays clear from the first sketch to the working website.</p>
            </div>
            <div className="flow-branch-descriptions">
                <p className="flow-branch-description flow-branch-description--design"><strong>UI/UX &amp; Flows</strong>Organizing information, mapping user journeys, and designing interfaces that make the next step clear.</p>
                <p className="flow-branch-description flow-branch-description--build"><strong>Development</strong>Building responsive interfaces, reusable components, and the functionality behind the experience.</p>
            </div>
            <div className="flow-tools-board">
                <div className="flow-tools-groups">
                    {groups.map(group => (
                        <section className="flow-tools-group" key={group.title} aria-label={group.title}>
                            <h3>{group.title}</h3>
                            <ul>
                                {group.tools.map(tool => (
                                    <li key={tool.id} title={tool.description || undefined}>
                                        <ToolIcon tool={tool} />
                                        <span>{tool.title}</span>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    ))}
                </div>
                <aside className="flow-github-history" aria-labelledby="flow-github-title">
                    <div>
                        <h3 id="flow-github-title">Explore the code.</h3>
                        <p>Take a closer look at the code behind my projects and how they’re put together.</p>
                    </div>
                    {githubUrl && <a href={githubUrl} target="_blank" rel="noopener noreferrer">View GitHub profile <span aria-hidden="true">↗</span></a>}
                </aside>
            </div>
        </section>
    );
}
