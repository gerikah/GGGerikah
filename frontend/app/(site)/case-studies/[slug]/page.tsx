import { redirect } from "next/navigation";

export default async function CaseStudyAlias({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  redirect(`/work/${encodeURIComponent(slug)}`);
}
