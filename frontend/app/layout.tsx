import type { Metadata } from "next";
import type { ReactNode } from "react";
import "@fontsource/space-mono/latin-400.css";
import "@fontsource/space-mono/latin-700.css";
import "@fontsource/space-mono/latin-400-italic.css";
import "@fontsource/poppins/latin-400.css";
import "@fontsource/poppins/latin-500.css";
import "@fontsource/poppins/latin-600.css";
import "@fontsource/poppins/latin-700.css";
import "@frontend/styles/globals.css";
import "@frontend/styles/media.css";

export const metadata: Metadata = {
  title: { default: "Gerikah — Design & Development", template: "%s — Gerikah" },
  description: "Gerikah is a UI/UX Designer, Frontend Developer, and Computer Engineer in Manila, Philippines. I design it. Then I build it.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="en" data-scroll-behavior="smooth"><body>{children}</body></html>;
}
