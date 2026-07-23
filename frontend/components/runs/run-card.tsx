"use client";

import Link from "next/link";
import { Activity, ArrowRight, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { formatRelative, truncate } from "@/lib/utils";
import type { WorkflowRun } from "@/lib/types";

export function RunCard({ run }: { run: WorkflowRun }) {
  const state = run.current_state as {
    event_count?: number;
    action_count?: number;
  };
  return (
    <Link href={`/runs/${run.id}`} className="block">
      <Card className="transition-colors hover:border-border-hover">
        <CardContent className="space-y-3 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-3.5 w-3.5 text-text-dim" />
              <span className="font-mono text-xs text-text-muted">
                {run.order_id}
              </span>
            </div>
            <StatusBadge status={run.status} />
          </div>

          <p className="text-xs text-text-muted">
            Created {formatRelative(run.created_at)}
          </p>

          {run.memory_summary && (
            <p className="line-clamp-2 text-xs text-text-muted">
              {truncate(run.memory_summary, 120)}
            </p>
          )}

          <div className="flex items-center justify-between border-t border-border pt-3 text-[11px] text-text-dim">
            <span>
              {state.event_count ?? 0} events · {state.action_count ?? 0}{" "}
              actions
            </span>
            {run.next_wake_up_at && run.status === "running" && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                wake {formatRelative(run.next_wake_up_at)}
              </span>
            )}
            <ArrowRight className="h-3.5 w-3.5" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}