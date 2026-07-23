"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Bot,
  Activity,
  Settings,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV: NavItem[] = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Runs", href: "/runs", icon: Activity },
  { label: "Supervisors", href: "/supervisors", icon: Bot },
];

const SECONDARY_NAV: NavItem[] = [
  { label: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <aside className="flex h-full w-60 flex-col border-r border-border bg-surface">
      <div className="flex h-14 items-center gap-2.5 border-b border-border px-5">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-accent">
          <Eye className="h-4 w-4 text-accent-fg" />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-semibold text-text">Supervisor</span>
          <span className="text-[11px] text-text-dim">Order Oversight</span>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-3">
        <span className="px-3 pb-1.5 pt-3 text-[11px] font-medium uppercase tracking-wider text-text-dim">
          Workspace
        </span>
        {NAV.map((item) => (
          <SidebarLink
            key={item.href}
            item={item}
            active={isActive(item.href)}
          />
        ))}

        <span className="px-3 pb-1.5 pt-5 text-[11px] font-medium uppercase tracking-wider text-text-dim">
          System
        </span>
        {SECONDARY_NAV.map((item) => (
          <SidebarLink
            key={item.href}
            item={item}
            active={isActive(item.href)}
          />
        ))}
      </nav>

      <div className="border-t border-border p-3">
        <div className="flex items-center gap-2.5 rounded-md px-3 py-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-surface-2 text-[11px] font-medium text-text-muted">
            PO
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-xs font-medium text-text">Operator</span>
            <span className="text-[11px] text-text-dim">poc@local</span>
          </div>
        </div>
      </div>
    </aside>
  );
}

function SidebarLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
        active
          ? "bg-surface-2 text-text"
          : "text-text-muted hover:bg-surface-2/60 hover:text-text",
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span>{item.label}</span>
    </Link>
  );
}