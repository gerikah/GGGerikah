import type { Metadata } from "next";
import { NotFoundView } from "@frontend/components/layout/not-found-view";

export const metadata: Metadata = { title: "Page not found", description: "This page is not in GERIKAH’s design and development archive.", robots: { index: false, follow: false } };

export default function SiteNotFound() { return <NotFoundView />; }
