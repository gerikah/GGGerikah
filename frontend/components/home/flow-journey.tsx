"use client";

import Link from 'next/link';
import { AboutDetails, DeveloperTools } from './flow-details';
import { useEffect, useRef, useState } from 'react';
import type { Project } from '@api/contracts/cms';
import { MediaFrame } from '@frontend/components/media/media-frame';
import { clamp, connections, connectorPath, ease, nodeIds, positions, stages, type Box, type NodeId } from './flow-layout';

type Props = { bio:string; projects:Project[]; role:string; resumeUrl:string };
const nodes: {id:NodeId; label:string; href?:string; pill?:boolean}[] = [
  {id:'start',label:'I’m Gerikah',href:'#about',pill:true},
  {id:'engineer',label:'Computer Engineer',href:'#about'},
  {id:'developer',label:'Developer',href:'#development'},
  {id:'decision',label:'?'},
  {id:'design',label:'UI/UX & Flows',href:'/work'},
  {id:'build',label:'Development',href:'#selected-work'},
  {id:'works',label:'Selected Works',href:'#selected-work'},
  {id:'talk',label:'Let’s Talk',href:'#contact',pill:true},
];
function FlowNode({id,href}: {id:NodeId;href?:string}) {
  const node=nodes.find(item=>item.id===id)!;
  const className='flow-node flow-node--'+id+(node.pill?' flow-node--pill':'');
  return node.href ? <a className={className} data-flow-node={id} href={href || node.href}><span>{node.label}</span></a> : <div className={className} data-flow-node={id} aria-label="Design and development"><span>{node.label}</span></div>;
}
function Contours() {
  return <svg className="flow-contours" viewBox="0 0 1728 1100" preserveAspectRatio="xMaxYMid slice" aria-hidden="true"><g fill="none" stroke="currentColor" strokeWidth=".7">{[148,290,445,600,980,1470].map((r,i)=><ellipse key={r} cx="1655" cy="1050" rx={r} ry={r*1.17} transform={'rotate(24 1655 1050)'} opacity={.75-i*.035}/>)}</g></svg>;
}
function FlowConnectors() {
  return <svg className="flow-connectors" aria-hidden="true"><defs><marker id="flow-arrow" markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto" markerUnits="userSpaceOnUse"><path d="M 2 0 L 7 4.5 L 2 9" fill="none" stroke="currentColor" strokeWidth="1.5"/></marker></defs>{connections.map(edge=><path key={edge.from+edge.to} data-flow-edge={edge.from+'-'+edge.to} fill="none" stroke="currentColor" strokeWidth="1.5" markerEnd="url(#flow-arrow)"/>)}</svg>;
}
export function FlowJourney({bio,projects,role,resumeUrl}:Props) {
  const designProject=projects.find(project=>/flowchart|wireframe/i.test(project.title));
  const root=useRef<HTMLElement>(null);
  const [active,setActive]=useState(0);
  const [motion,setMotion]=useState(false);
  const initialHashHandled=useRef(false);
  const select=(index:number)=>{const next=(index+projects.length)%projects.length; setActive(next);};
  useEffect(()=>{
    const section=root.current;
    if(!section) return;
    const stage=section.querySelector<HTMLElement>('.flow-stage')!;
    const elements=Object.fromEntries(nodeIds.map(id=>[id,section.querySelector<HTMLElement>('[data-flow-node="'+id+'"]')!])) as Record<NodeId,HTMLElement>;
    const paths=Array.from(section.querySelectorAll<SVGPathElement>('[data-flow-edge]'));
    const heading=section.querySelector<HTMLElement>('.flow-headline')!;
    const about=section.querySelector<HTMLElement>('.flow-about')!;
    const branch=section.querySelector<HTMLElement>('.flow-branch-copy')!;
    const stack=section.querySelector<HTMLElement>('.flow-projects')!;
    const contour=section.querySelector<SVGElement>('.flow-contours')!;
    const query=window.matchMedia('(min-width:1100px) and (min-height:720px) and (prefers-reduced-motion:no-preference)');
    let enabled=false, frame=0, width=0, height=0, start=0, travel=0, lastScrollIndex=-1, disposed=false;
    let dimensions={} as Record<NodeId,{width:number;height:number}>;
    const panel=(element:HTMLElement,opacity:number)=>{
      element.style.opacity=String(opacity);
      element.style.visibility=opacity<.001?'hidden':'visible';
      element.style.transform='translateY('+((1-opacity)*24)+'px)';
      element.inert=opacity<.6;
      element.setAttribute('aria-hidden',String(opacity<.6));
    };
    const render=()=>{
      frame=0;
      if(!enabled) return;
      const progress=clamp((window.scrollY-start)/travel);
      section.dataset.progress=progress.toFixed(4);
      const points=positions(progress,width,height);
      const boxes={} as Record<NodeId,Box>;
      nodeIds.forEach(id=>{
        const element=elements[id], point=points[id], size=dimensions[id];
        boxes[id]={...point,...size};
        element.style.transform='translate3d('+(point.x-size.width/2)+'px,'+(point.y-size.height/2)+'px,0)';
        const outside=point.y+size.height/2<0 || point.y-size.height/2>height;
        element.inert=outside;
        element.setAttribute('aria-hidden',String(outside));
      });
      paths.forEach((path,i)=>{
        const edge=connections[i];
        path.setAttribute('d',connectorPath(boxes[edge.from],boxes[edge.to],edge.exit,edge.entry));
        // Reveal the newly extending Development line; earlier connections stay drawn.
        const draw=i===5 && progress>.32 && progress<.44 ? ease((progress-.32)/.12) : 1;
        path.setAttribute('pathLength','1');
        path.style.strokeDasharray='1'; path.style.strokeDashoffset=String(1-draw);
        path.style.markerEnd=draw>.97?'url(#flow-arrow)':'none';
      });
      const headingOpacity=1-ease((progress-.04)/.08);
      heading.style.opacity=String(headingOpacity);
      heading.style.visibility=headingOpacity<.001?'hidden':'visible';
      panel(about,ease((progress-.12)/.07)*(1-ease((progress-.32)/.08)));
      panel(branch,ease((progress-.39)/.05)*(1-ease((progress-.56)/.06)));
      panel(stack,ease((progress-.62)/.07));
      contour.style.transform='translate3d('+(-progress*5)+'%, '+(-progress*10)+'%,0)';
      if(progress>=.69 && projects.length){
        const scrollIndex=Math.min(projects.length-1,Math.floor(clamp((progress-.72)/.24)*projects.length));
        if(scrollIndex!==lastScrollIndex){lastScrollIndex=scrollIndex;setActive(scrollIndex);}
      } else lastScrollIndex=-1;
      stack.style.setProperty('--stack-drift',String(Math.sin(progress*Math.PI*2)*1.5)+'deg');
    };
    const queue=()=>{if(!frame)frame=requestAnimationFrame(render);};
    const measure=()=>{
      enabled=query.matches;
      section.dataset.motion=String(enabled); setMotion(enabled);
      if(!enabled){
        section.style.removeProperty('height');
        contour.style.removeProperty('transform');
        [heading,about,branch,stack,...Object.values(elements)].forEach(element=>{element.removeAttribute('style');element.inert=false;element.removeAttribute('aria-hidden');});
        section.querySelectorAll<HTMLElement>('.flow-anchor').forEach(el=>el.style.removeProperty('top'));
        return;
      }
      const navHeight=document.querySelector('.nav-shell')?.getBoundingClientRect().height || 88;
      section.style.setProperty('--flow-nav',navHeight+'px');
      height=window.innerHeight-navHeight; width=stage.clientWidth;
      travel=height*5.8; section.style.height=(travel+height)+'px';
      start=section.getBoundingClientRect().top+window.scrollY-navHeight;
      dimensions=Object.fromEntries(nodeIds.map(id=>[id,{width:elements[id].offsetWidth,height:elements[id].offsetHeight}])) as typeof dimensions;
      for(const [id,p] of Object.entries({'about':stages.about,'development':stages.development,'selected-work':stages.works})) section.querySelector<HTMLElement>('[data-anchor="'+id+'"]')!.style.top=(p*travel)+'px';
      queue();
    };
    measure();
    // Fonts change node geometry; derive connectors again after they settle.
    document.fonts.ready.then(()=>{if(!disposed)measure();});
    const observer=new ResizeObserver(measure); observer.observe(stage);
    window.addEventListener('scroll',queue,{passive:true}); window.addEventListener('resize',measure);query.addEventListener('change',measure);
    return()=>{disposed=true;cancelAnimationFrame(frame);observer.disconnect();window.removeEventListener('scroll',queue);window.removeEventListener('resize',measure);query.removeEventListener('change',measure);};
  },[projects.length]);
  useEffect(()=>{
    if(initialHashHandled.current || root.current?.dataset.motion!==String(motion)) return;
    const hash=window.location.hash;
    if(!['#about','#development','#selected-work'].includes(hash)){initialHashHandled.current=true;return;}
    const frame=requestAnimationFrame(()=>{initialHashHandled.current=true;root.current?.querySelector(hash)?.scrollIntoView({behavior:'instant'});});
    return()=>cancelAnimationFrame(frame);
  },[motion]);
  return <section ref={root} className="flow-journey" aria-labelledby="hero-title">
    {['about','development','selected-work'].map(id=><span key={id} id={motion?id:undefined} data-anchor={id} className="flow-scroll-anchor" aria-hidden="true"/>)}
    <div className="flow-stage">
      <Contours/><FlowConnectors/>
      <h1 id="hero-title" className="flow-headline"><span>BEFORE THE CODE,</span><span>I CONNECT THE DOTS.</span></h1>
      <FlowNode id="start"/>
      <span id={!motion?"about":undefined} className="flow-anchor" aria-hidden="true"/>
      <FlowNode id="engineer"/>
      <section className="flow-about" aria-labelledby="flow-about-title">
        <div className="flow-profile"><span className="flow-profile__initials" aria-hidden="true">GA</span><p>Gerikah Alday<br/><span>Computer engineer.<br/>Designer. Developer.</span></p></div>
        <AboutDetails bio={bio} role={role} resumeUrl={resumeUrl}/>
      </section>
      <span id={!motion?"development":undefined} className="flow-anchor" aria-hidden="true"/>
      <FlowNode id="developer"/><FlowNode id="decision"/>
      <div className="flow-branches"><FlowNode id="design" href={designProject ? '/work/'+designProject.slug : '/work'}/><FlowNode id="build"/></div>
      <DeveloperTools/>
      <span id={!motion?"selected-work":undefined} className="flow-anchor" aria-hidden="true"/>
      <FlowNode id="works"/>
      <section className="flow-projects" aria-label="Selected projects">
        <div className="flow-project-stack">{projects.map((project,index)=>{
          const depth=(index-active+projects.length)%projects.length;
          return <article key={project.id} className="flow-project-card" data-active={index===active} data-depth={Math.min(depth,3)} inert={motion && index!==active} aria-hidden={motion && index!==active ? true : undefined} style={{'--card-depth':Math.min(depth,3),'--card-rotation':(depth===1?-3:depth===2?6:0)+'deg',zIndex:projects.length-depth} as React.CSSProperties}>
            <Link href={'/work/'+project.slug} className="flow-project-link"><MediaFrame src={project.cover_image_url} alt={project.cover_alt || project.title} sizes="(min-width:1100px) 55vw, 92vw"/><div className="flow-project-caption"><h2>{project.title}</h2><span aria-hidden="true">↗</span></div><p>{project.short_description}</p></Link>
          </article>;
        })}</div>
        {projects.length>1 && <div className="flow-project-controls"><button type="button" onClick={()=>select(active-1)} aria-label="Previous project">←</button><span aria-live="polite" aria-atomic="true">{String(active+1).padStart(2,'0')} / {String(projects.length).padStart(2,'0')}</span><button type="button" onClick={()=>select(active+1)} aria-label="Next project">→</button><Link href="/work">All projects ↗</Link></div>}
        {!projects.length && <p>Projects are being prepared. <Link href="/work">Visit the work archive ↗</Link></p>}
      </section>
      <FlowNode id="talk"/>
      <p className="flow-scroll-hint" aria-hidden="true">Follow the connections <span>↓</span></p>
    </div>
  </section>;
}
