"use client";

import Link from "next/link";
import { Bot, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { formatRelative, truncate } from "@/lib/utils";
import type { Supervisor } from "@/lib/types";

export function SupervisorCard({ supervisor }: { supervisor: Supervisor }) {
  return (
    <Link href={`/supervisors/${supervisor.id}`} className="block">
      <Card className="p-5 transition-all hover:border-emerald-500/30 hover:bg-[#151520] bg-[#111118] border-[#1e1e2a] rounded-2xl">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-surface-2">
              <Bot className="h-3.5 w-3.5 text-accent" />
            </div>
            <span className="text-sm font-medium text-text">
              {supervisor.name}
            </span>
          </div>
          <p className="line-clamp-2 text-xs text-text-muted">
            {truncate(supervisor.base_instruction, 140)}
          </p>
          <div className="flex items-center justify-between border-t border-border pt-3 text-[11px] text-text-dim">
            <span>{supervisor.available_tools.length} tools</span>
            <span>Updated {formatRelative(supervisor.updated_at)}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </div>
        </div>
      </Card>
    </Link>
  );
}