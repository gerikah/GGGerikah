import type { ReactNode } from "react";
import { Header } from "@frontend/components/layout/header";
import { Footer } from "@frontend/components/layout/footer";
import { ArchiveMotion } from "@frontend/components/motion/archive-motion";
import { getSiteSettings } from "@backend/cms/data";
import "@frontend/styles/taste.css";

export default async function SiteLayout({ children }: { children: ReactNode }) {
  const settings = await getSiteSettings();
  return <ArchiveMotion><a href="#main-content" className="skip">Skip to content</a><div id="top" /><Header />{children}<Footer settings={settings} /></ArchiveMotion>;
}
