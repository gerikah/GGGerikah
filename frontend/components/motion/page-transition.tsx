"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

// Keep navigation native to Next: no exit delays, intercepted links, or scroll resets.
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return <div key={pathname} className="page-transition">{children}</div>;
}
