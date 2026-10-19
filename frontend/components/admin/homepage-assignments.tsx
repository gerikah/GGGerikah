"use client";
import Image from "next/image";
import { useState } from "react";
import { saveHomepage } from "@api/actions/editorial";
import { ActionForm } from "./action-form";
export function HomepageAssignments({ slots, projects }: { slots: { field: string; title: string; id: string | null }[]; projects: { id: string; title: string; cover: string; cover_alt: string }[] }) {
 const [values,setValues]=useState(slots.map(s=>s.id??""));
 return <ActionForm action={saveHomepage} submitLabel="Save homepage projects"><div className="admin-homepage-slots">{slots.map((slot,i)=>{const project=projects.find(p=>p.id===values[i]);return <label className="admin-field" key={slot.field}><span>{slot.title}</span><div className="admin-assignment-preview">{project?.cover?<Image src={project.cover} alt={project.cover_alt} fill sizes="30vw" unoptimized />:<span>Empty placeholder</span>}</div><select name={slot.field} value={values[i]} onChange={e=>setValues(old=>old.map((v,j)=>i===j?e.target.value:v))}><option value="">Empty placeholder</option>{projects.map(p=><option key={p.id} value={p.id}>{p.title}</option>)}</select></label>;})}</div></ActionForm>;
}
