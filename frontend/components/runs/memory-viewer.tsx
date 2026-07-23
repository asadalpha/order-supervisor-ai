"use client";

import { Brain, Clock, Moon } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { formatRelative, prettyJson } from "@/lib/utils";
import type { MemoryResponse } from "@/lib/types";

export function MemoryViewer({ memory }: { memory: MemoryResponse | undefined }) {
  if (!memory) {
    return (
      <EmptyState
        icon={Brain}
        title="No memory snapshot"
        description="The agent has not produced a memory summary yet."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-surface p-4">
        <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-text-dim">
          <Brain className="h-3.5 w-3.5" />
          Compact Summary
        </div>
        {memory.compact_summary ? (
          <p className="text-sm leading-relaxed text-text">
            {memory.compact_summary}
          </p>
        ) : (
          <p className="text-sm text-text-muted">
            No summary generated yet.
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-border bg-surface p-4">
          <div className="mb-1.5 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-text-dim">
            <Moon className="h-3.5 w-3.5" />
            Sleep State
          </div>
          <p className="text-sm capitalize text-text">{memory.sleep_state}</p>
        </div>
        <div className="rounded-lg border border-border bg-surface p-4">
          <div className="mb-1.5 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-text-dim">
            <Clock className="h-3.5 w-3.5" />
            Next Wake-up
          </div>
          <p className="text-sm text-text">
            {memory.next_wake_up ? formatRelative(memory.next_wake_up) : "—"}
          </p>
        </div>
      </div>

      {memory.recent_events.length > 0 && (
        <div className="rounded-lg border border-border bg-surface p-4">
          <div className="mb-3 text-xs font-medium uppercase tracking-wider text-text-dim">
            Recent Events ({memory.recent_events.length})
          </div>
          <div className="space-y-2">
            {memory.recent_events.map((event) => (
              <div
                key={event.id}
                className="rounded-md border border-border bg-surface-2 p-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-text">
                    {event.event_type.replace(/_/g, " ")}
                  </span>
                  <span className="text-[11px] text-text-dim">
                    {formatRelative(event.created_at)}
                  </span>
                </div>
                {Object.keys(event.event_data).length > 0 && (
                  <pre className="mt-1.5 overflow-x-auto font-mono text-[11px] text-text-muted">
                    {prettyJson(event.event_data)}
                  </pre>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}