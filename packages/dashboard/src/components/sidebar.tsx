"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderKanban,
  Shield,
  Search,
  Activity,
  User,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Projects", href: "/projects", icon: FolderKanban },
  { label: "Agency Standards", href: "/standards", icon: Shield },
  { label: "Search", href: "/search", icon: Search },
  { label: "Health", href: "/health", icon: Activity },
  { label: "My Projects", href: "/my-projects", icon: User },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 h-full bg-surface-low flex flex-col shrink-0">
      {/* Brand */}
      <div className="px-4 pt-5 pb-1">
        <Link href="/" className="block">
          <span className="text-lg font-semibold text-foreground tracking-tight">
            Memex
          </span>
        </Link>
        <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
          {process.env.NEXT_PUBLIC_ORG_NAME || "Knowledge Layer"}
        </span>
      </div>

      {/* Search */}
      <div className="px-3 py-3">
        <div className="flex items-center gap-2 rounded bg-surface-lowest px-3 py-1.5 text-sm text-muted-foreground">
          <Search className="h-3.5 w-3.5 shrink-0 opacity-60" />
          <input
            type="text"
            placeholder="Search systems..."
            className="w-full bg-transparent text-sm placeholder:text-muted-foreground/60 focus:outline-none"
          />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-1 flex flex-col gap-0.5">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 rounded px-3 py-2 text-sm transition-colors ${
                isActive
                  ? "bg-surface-highest text-foreground"
                  : "text-muted-foreground hover:bg-surface-high hover:text-foreground"
              }`}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User info */}
      <div className="px-3 py-4">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-full bg-surface-highest flex items-center justify-center">
            <User className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm text-foreground leading-tight">
              Juan Gomez
            </span>
            <span className="text-[11px] text-muted-foreground leading-tight">
              Admin
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
