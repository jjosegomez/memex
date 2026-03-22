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
  LogOut,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Projects", href: "/projects", icon: FolderKanban },
  { label: "Agency Standards", href: "/standards", icon: Shield },
  { label: "Search", href: "/search", icon: Search },
  { label: "Health", href: "/health", icon: Activity },
  { label: "My Projects", href: "/my-projects", icon: User },
];

interface SidebarProps {
  userName?: string | null;
  userImage?: string | null;
  orgName?: string;
}

export function Sidebar({ userName, userImage, orgName }: SidebarProps) {
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
          {orgName || "Knowledge Layer"}
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

      {/* User info + Sign out */}
      <div className="px-3 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            {userImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={userImage}
                alt=""
                className="h-7 w-7 rounded-full shrink-0"
              />
            ) : (
              <div className="h-7 w-7 rounded-full bg-surface-highest flex items-center justify-center shrink-0">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
            )}
            <span className="text-sm text-foreground leading-tight truncate">
              {userName || "User"}
            </span>
          </div>
          <form action="/api/auth/signout" method="POST">
            <button
              type="submit"
              className="p-1 text-muted-foreground hover:text-foreground transition-colors"
              title="Sign out"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
