import type { Metadata } from "next";
import { NotFoundView } from "@frontend/components/layout/not-found-view";
import { ArchiveMotion } from "@frontend/components/motion/archive-motion";
import "@frontend/styles/opendesign.css";
import "@frontend/styles/opendesign-adaptations.css";
import "@frontend/styles/loading-screen.css";

export const metadata: Metadata = { title: "Page not found", description: "This page is not in GERIKAH’s design and development archive.", robots: { index: false, follow: false } };

export default function NotFound() { return <ArchiveMotion><NotFoundView standalone /></ArchiveMotion>; }
