"use client";

import Link from "next/link";
import { ArrowRight, Clock, Activity, Wrench, Shield } from "lucide-react";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import type { Run } from "@/lib/types";
import { formatRelative } from "@/lib/utils";

export function RunCard({ run }: { run: Run }) {
  const state = (run.current_state as {
    event_count?: number;
    action_count?: number;
  }) || {};

  const isRunning = run.status === "running";

  return (
    <Link href={`/runs/${run.id}`}>
      <Card
        className={`group relative p-5 transition-all duration-200 hover:-translate-y-0.5 ${
          isRunning
            ? "border-emerald-500/30 bg-[#111618] glow-active"
            : "bg-[#111118] border-[#1e1e2a] hover:border-[#2d2d3e] hover:bg-[#151520]"
        }`}
      >
        <div className="flex items-center justify-between pb-3">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl font-bold text-xs ${
                isRunning
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : "bg-[#1a1a24] text-text-muted border border-[#242434]"
              }`}
            >
              <Shield className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-text group-hover:text-emerald-400 transition-colors">
                Order {run.order_id}
              </h3>
              <p className="text-xs text-text-dim">
                {run.supervisor?.name || "Order Supervisor"}
              </p>
            </div>
          </div>
          <StatusBadge status={run.status} />
        </div>

        {/* Stats Grid */}
        <div className="my-3 grid grid-cols-2 gap-2 rounded-xl bg-[#09090d] p-3 border border-[#1e1e2a]/60 text-xs">
          <div className="flex items-center gap-2">
            <Activity className="h-3.5 w-3.5 text-blue-400" />
            <span className="text-text-muted">Events:</span>
            <span className="font-semibold text-text">{state.event_count ?? 0}</span>
          </div>
          <div className="flex items-center gap-2">
            <Wrench className="h-3.5 w-3.5 text-purple-400" />
            <span className="text-text-muted">Actions:</span>
            <span className="font-semibold text-text">{state.action_count ?? 0}</span>
          </div>
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between pt-1 text-[11px] text-text-dim">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatRelative(run.created_at)}
          </span>
          <span className="flex items-center gap-1 font-medium text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity">
            View Details
            <ArrowRight className="h-3 w-3" />
          </span>
        </div>
      </Card>
    </Link>
  );
}