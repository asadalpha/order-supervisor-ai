"use client";

import { Wrench } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { formatRelative, prettyJson } from "@/lib/utils";
import type { AgentAction } from "@/lib/types";

export function ActionsList({ actions }: { actions: AgentAction[] }) {
  if (!actions.length) {
    return (
      <EmptyState
        icon={Wrench}
        title="No actions taken"
        description="Tool calls the agent has executed will appear here."
      />
    );
  }

  return (
    <div className="space-y-2">
      {actions.map((action) => (
        <div
          key={action.id}
          className="rounded-md border border-border bg-surface p-3"
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-medium text-accent">
              {action.tool_name}
            </span>
            <span className="text-[11px] text-text-dim">
              {formatRelative(action.created_at)}
            </span>
          </div>
          {action.reasoning && (
            <p className="mt-2 text-xs text-text-muted">{action.reasoning}</p>
          )}
          <div className="mt-2 grid grid-cols-2 gap-2">
            <div>
              <div className="mb-1 text-[10px] uppercase tracking-wider text-text-dim">
                Input
              </div>
              <pre className="overflow-x-auto rounded border border-border bg-surface-2 p-2 font-mono text-[10px] text-text-muted">
                {prettyJson(action.tool_input)}
              </pre>
            </div>
            <div>
              <div className="mb-1 text-[10px] uppercase tracking-wider text-text-dim">
                Output
              </div>
              <pre className="overflow-x-auto rounded border border-border bg-surface-2 p-2 font-mono text-[10px] text-text-muted">
                {prettyJson(action.tool_output ?? "—")}
              </pre>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}