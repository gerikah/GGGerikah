import type { Metadata } from "next";
import type { ReactNode } from "react";
import "@fontsource/space-grotesk/400.css";
import "@fontsource/space-grotesk/500.css";
import "@fontsource/space-grotesk/600.css";
import "@fontsource/space-grotesk/700.css";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/manrope/latin-400.css";
import "@fontsource/manrope/latin-500.css";
import "@fontsource/manrope/latin-600.css";
import "@frontend/styles/globals.css";
import "@frontend/styles/brand.css";

export const metadata: Metadata = {
  title: { default: "Gerikah — Design & Development", template: "%s — Gerikah" },
  description: "Gerikah is a UI/UX Designer, Frontend Developer, and Computer Engineer in Manila, Philippines. I design it. Then I build it.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
