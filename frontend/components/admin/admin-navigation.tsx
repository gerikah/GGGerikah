"use client";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useRef, useState } from "react";
import { SquaresFourIcon, FolderIcon, ImageIcon, HouseIcon, TextTIcon, GearIcon, ArrowSquareOutIcon, SignOutIcon, SidebarIcon, ListIcon, XIcon } from "@phosphor-icons/react";
import { signOut } from "@api/actions/admin";

const groups = [
  { label: "Dashboard", icon: SquaresFourIcon, links: [["Overview", "/admin"]] },
  { label: "Projects", icon: FolderIcon, links: [["All projects", "/admin/projects"], ["Add new project", "/admin/projects/new"], ["Drafts", "/admin/projects?status=draft"], ["Published projects", "/admin/projects?status=published"]] },
  { label: "Media Library", icon: ImageIcon, links: [["All images", "/admin/media"], ["Project covers", "/admin/media?category=cover"], ["Project galleries", "/admin/media?category=gallery"], ["Homepage images", "/admin/media?category=homepage"], ["Unassigned images", "/admin/media?category=unassigned"]] },
  { label: "Homepage", icon: HouseIcon, links: [["Homepage", "/admin/homepage"]] },
  { label: "Site Content", icon: TextTIcon, links: [["Site details", "/admin/content"], ["Capabilities", "/admin/capabilities"], ["Workflow", "/admin/capabilities?kind=process"]] },
  { label: "Settings", icon: GearIcon, links: [["Settings", "/admin/settings"]] },
];
export function AdminNavigation({ email, children }: { email?: string; children: React.ReactNode }) {
  const pathname = usePathname(), search = useSearchParams();
  const [collapsed, setCollapsed] = useState(false);
  const drawer = useRef<HTMLDialogElement>(null);
  const activePath = /^\/admin\/projects\/(?!new(?:\/|$))/.test(pathname) ? "/admin/projects" : pathname;
  const current = activePath + (search.get("status") ? `?status=${search.get("status")}` : search.get("category") ? `?category=${search.get("category")}` : search.get("kind") ? `?kind=${search.get("kind")}` : "");
  const navigation = (mobile: boolean) => <>
    <div className="admin-sidebar-brand"><Link href="/admin">GA<span>PORTFOLIO CMS</span></Link><button className="admin-icon-button" aria-label={mobile ? "Close navigation" : collapsed ? "Expand sidebar" : "Collapse sidebar"} onClick={() => mobile ? drawer.current?.close() : setCollapsed(!collapsed)}>{mobile ? <XIcon size={20} /> : <SidebarIcon size={20} />}</button></div>
    <nav aria-label={mobile ? "Mobile CMS navigation" : "CMS navigation"}>{groups.map(group => <section className="admin-nav-group" key={group.label}><Link className="admin-nav-title" title={group.label} href={group.links[0][1]} onClick={() => drawer.current?.close()}><group.icon size={20} /><span>{group.label}</span></Link><div className="admin-nav-children">{group.links.map(([label, href]) => <Link key={href} href={href} aria-current={current === href ? "page" : undefined} onClick={() => drawer.current?.close()}>{label}</Link>)}</div></section>)}</nav>
    <div className="admin-sidebar-bottom"><Link title="View live website" href="/" target="_blank" rel="noopener noreferrer"><ArrowSquareOutIcon size={20} /><span>View live website</span></Link><form action={signOut}><button title="Sign out"><SignOutIcon size={20} /><span>Sign out</span></button></form><small>{email}</small></div>
  </>;
  return <div className={`admin-workspace ${collapsed ? "sidebar-collapsed" : ""}`}><aside className="admin-sidebar">{navigation(false)}</aside><div className="admin-workspace-content"><header className="admin-topbar"><button className="admin-icon-button admin-mobile-toggle" aria-label="Open navigation" onClick={() => drawer.current?.showModal()}><ListIcon size={24} /></button><nav aria-label="Breadcrumb"><Link href="/admin">CMS</Link><span>/</span><span>{pathname.includes("projects/") ? "Project editor" : pathname.split("/").at(-1) === "admin" ? "Dashboard" : pathname.split("/").at(-1)?.replace("content", "Site details")}</span></nav><span className="admin-badge">Administrator</span></header><main id="admin-content" className="admin-main">{children}</main></div><dialog ref={drawer} className="admin-mobile-drawer">{navigation(true)}</dialog></div>;
}
