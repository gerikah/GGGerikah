import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProject, getProjectNavigation } from "@backend/cms/data";
import { ProjectDetail } from "@frontend/components/case-study/project-detail";
type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const study = await getProject((await params).slug);
  return study ? { title: study.project.title, description: study.project.short_description } : { title: "Project not found" };
}
export default async function CaseStudyPage({ params }: Props) {
  const study = await getProject((await params).slug);
  if (!study) notFound();
  const projects = await getProjectNavigation();
  const index = projects.findIndex(project => project.slug === study.project.slug);
  const nextProject = projects.length > 1 && index >= 0 ? projects[(index + 1) % projects.length] : undefined;
  return <ProjectDetail project={study.project} media={study.media} nextProject={nextProject} />;
}
