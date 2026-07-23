"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Activity,
  Bot,
  Settings,
  Layers,
  FileText,
  Sliders,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const OVERVIEW_NAV: NavItem[] = [
  { label: "Dashboard", href: "/", icon: Home },
];

const SUPERVISION_NAV: NavItem[] = [
  { label: "Schedules & Runs", href: "/runs", icon: Activity },
  { label: "Supervisors", href: "/supervisors", icon: Bot },
];

const SYSTEM_NAV: NavItem[] = [
  { label: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <aside className="flex h-full w-56 flex-col border-r border-[#1c1c24] bg-[#09090b] text-text">
      {/* Brand Header */}
      <div className="flex h-14 items-center gap-2.5 px-5 pt-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#1f1f26] border border-[#2a2a34]">
          <Layers className="h-3.5 w-3.5 text-text" />
        </div>
        <span className="text-sm font-semibold text-text tracking-tight">
          Supervisor
        </span>
      </div>

      {/* Main Navigation */}
      <nav className="flex flex-1 flex-col gap-5 px-3 py-4 text-xs">
        {/* Section 1 */}
        <div>
          <div className="flex flex-col gap-0.5">
            {OVERVIEW_NAV.map((item) => (
              <SidebarLink
                key={item.href}
                item={item}
                active={isActive(item.href)}
              />
            ))}
          </div>
        </div>

        {/* Section 2: Supervision */}
        <div>
          <span className="px-3 text-[11px] font-medium text-[#656570] block mb-1">
            Supervision
          </span>
          <div className="flex flex-col gap-0.5">
            {SUPERVISION_NAV.map((item) => (
              <SidebarLink
                key={item.href}
                item={item}
                active={isActive(item.href)}
              />
            ))}
          </div>
        </div>

        {/* Section 3: System */}
        <div>
          <span className="px-3 text-[11px] font-medium text-[#656570] block mb-1">
            System
          </span>
          <div className="flex flex-col gap-0.5">
            {SYSTEM_NAV.map((item) => (
              <SidebarLink
                key={item.href}
                item={item}
                active={isActive(item.href)}
              />
            ))}
          </div>
        </div>
      </nav>

      {/* User Footer */}
      <div className="border-t border-[#1c1c24] p-3">
        <div className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-[#141418] transition-colors cursor-pointer">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1f1f26] text-[10px] font-semibold text-text-muted">
            OP
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-xs font-medium text-text">Operator</span>
            <span className="text-[10px] text-[#656570]">poc@local</span>
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
        "flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors",
        active
          ? "bg-[#1f1f26] text-text font-semibold"
          : "text-text-muted hover:bg-[#141418] hover:text-text",
      )}
    >
      <Icon className="h-4 w-4 shrink-0 text-[#888892]" />
      <span>{item.label}</span>
    </Link>
  );
}