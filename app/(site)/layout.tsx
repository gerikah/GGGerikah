import type { ReactNode } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ArchiveMotion } from "@/components/motion/archive-motion";
import { getSiteSettings } from "@/lib/cms/data";

export default async function SiteLayout({ children }: { children: ReactNode }) {
  const settings = await getSiteSettings();
  return <ArchiveMotion><a href="#main-content" className="skip-link">Skip to content</a><div id="top" /><Header name={settings.name} />{children}<Footer settings={settings} /></ArchiveMotion>;
}
