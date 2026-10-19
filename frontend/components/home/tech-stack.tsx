import Image from "next/image";
import { Reveal } from "@frontend/components/motion/archive-motion";

const technologies = [
  ["Next.js", "nextjs"], ["TypeScript", "typescript"], ["React", "react"],
  ["Supabase", "supabase"], ["PostgreSQL", "postgresql"], ["Node.js", "nodejs"],
  ["HTML5", "html5"], ["CSS3", "css3"], ["JavaScript", "javascript"],
  ["Figma", "figma"], ["Git", "git"], ["Vercel", "vercel"],
];

export function TechStack() {
  return <section className="stack-editorial wrap" aria-labelledby="stack-title">
    <div className="stack-mark" data-parallax="40"><Reveal variant="image"><Image src="/images/brand/logo.svg" alt="Gerikah's G and cursor mark" width={360} height={360} /></Reveal></div>
    <div className="stack-content">
      <Reveal><h2 id="stack-title">THE STACK</h2><p>The things I rely on to make things work.</p></Reveal>
      <ul>{technologies.map(([name, icon], i) => <li key={icon}><Reveal delay={(i % 3) * 60} className="stack-item"><Image src={`/images/stack/${icon}.svg`} alt="" aria-hidden="true" width={22} height={22} /><span>{name}</span></Reveal></li>)}</ul>
    </div>
  </section>;
}
