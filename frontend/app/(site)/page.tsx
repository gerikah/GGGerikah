import { LandingHero } from '@frontend/components/home/landing-hero';
import { FlowJourney } from '@frontend/components/home/flow-journey';
import '@frontend/styles/flow-journey.css';
import { externalUrl } from '@api/validation/cms';
import { getCapabilities, getHomepageProjects, getSiteSettings } from '@backend/cms/data';
import { portfolio } from '@frontend/content/portfolio';
export default async function HomePage() {
  const [settings, selectedProjects, content] = await Promise.all([getSiteSettings(), getHomepageProjects(), getCapabilities()]);
  const resume = portfolio.contact.overrides.resume || settings.resume_url;
  const github = portfolio.contact.overrides.github || settings.github_url;
  return <main id="main-content" className="portfolio-home" data-page-ready="/"><LandingHero /><FlowJourney resumeUrl={externalUrl.safeParse(resume).success ? resume : ''} githubUrl={externalUrl.safeParse(github).success ? github : ''} projects={selectedProjects} tools={content.filter(item => item.kind === 'tool')}/></main>;
}
