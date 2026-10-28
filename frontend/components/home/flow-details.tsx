"use client";

import Image from 'next/image';
import { useEffect, useRef } from 'react';

function LocalTime() {
  const clock=useRef<HTMLTimeElement>(null);
  useEffect(()=>{
    const formatter=new Intl.DateTimeFormat('en-PH',{timeZone:'Asia/Manila',hour:'2-digit',minute:'2-digit',hour12:true});
    const update=()=>{if(clock.current){const now=new Date();clock.current.dateTime=now.toISOString();clock.current.textContent=formatter.format(now)+' · Manila (UTC+8)';}};
    update();const timer=window.setInterval(update,30000);
    return()=>window.clearInterval(timer);
  },[]);
  return <time ref={clock}>Manila · UTC+8</time>;
}

export function AboutDetails({bio,role,resumeUrl}:{bio:string;role:string;resumeUrl:string}) {
  return <div className="flow-about__details"><h2 id="flow-about-title">About</h2><p className="flow-bio">{bio}</p>
    <dl className="flow-facts">
      <div><dt>Title & education</dt><dd>BS Computer Engineering<br/>Network Administration · 2026</dd><dd>Polytechnic University of the Philippines<br/>Sta. Mesa, Manila</dd></div>
      <div><dt>Role</dt><dd>{role}</dd><dd className="flow-fact-note">UI/UX, technical documentation, and web development.</dd></div>
      <div><dt>Way & workflow</dt><dd>Understand the problem, map the flow, design the interface, build, test, and refine.</dd></div>
      <div><dt>Handover</dt><dd>Design files, documented user flows, responsive interfaces, and clear implementation notes.</dd></div>
      <div><dt>Local time</dt><dd><LocalTime/></dd></div>
      <div><dt>Achievements & certificates</dt><dd>30+ freelance technical and academic engagements.</dd><dd>AWS Academy Cloud Foundations · May 2026</dd><dd>Civil Service Professional Eligibility · March 2026</dd></div>
    </dl>
    {resumeUrl && <a className="flow-text-link" href={resumeUrl} target="_blank" rel="noopener noreferrer">View résumé <span aria-hidden="true">↗</span></a>}
  </div>;
}

type Tool = {name:string;icon?:string};
// Verified against the existing portfolio and the owner's linked résumé.
const toolGroups:{title:string;tools:Tool[]}[]=[
  {title:'Frontend',tools:[{name:'React',icon:'react'},{name:'Next.js',icon:'nextjs'},{name:'TypeScript',icon:'typescript'},{name:'JavaScript',icon:'javascript'},{name:'HTML',icon:'html5'},{name:'CSS',icon:'css3'}]},
  {title:'Backend & database',tools:[{name:'Node.js',icon:'nodejs'},{name:'Fastify'},{name:'Supabase',icon:'supabase'},{name:'PostgreSQL',icon:'postgresql'},{name:'MySQL'}]},
  {title:'AI tools',tools:[{name:'Codex'}]},
  {title:'Deployment & version control',tools:[{name:'Vercel',icon:'vercel'},{name:'Git',icon:'git'},{name:'GitHub'}]},
  {title:'IDE',tools:[{name:'VS Code'}]},
  {title:'Currently learning',tools:[{name:'Codex workflows'}]},
];
export function DeveloperTools() {
  return <section className="flow-branch-copy" aria-labelledby="flow-tools-title"><h2 id="flow-tools-title">Tools & tech</h2>
    <dl className="flow-tools">{toolGroups.map(group=><div key={group.title}><dt>{group.title}</dt><dd>{group.tools.length ? <ul className="flow-tool-list">{group.tools.map(tool=><li key={tool.name}>{tool.icon && <Image src={'/images/stack/'+tool.icon+'.svg'} alt="" aria-hidden="true" width={15} height={15}/>}<span>{tool.name}</span></li>)}</ul> : <span className="flow-fact-note">To be added</span>}</dd></div>)}</dl>
  </section>;
}
