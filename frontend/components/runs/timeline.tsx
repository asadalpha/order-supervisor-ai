"use client";

import {
  Package,
  CheckCircle2,
  XCircle,
  Truck,
  Clock,
  Home,
  RotateCcw,
  MessageSquare,
  Moon,
  Bot,
  type LucideIcon,
} from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { formatRelative, prettyJson } from "@/lib/utils";
import type { TimelineEvent } from "@/lib/types";

const EVENT_ICONS: Record<string, LucideIcon> = {
  order_created: Package,
  payment_confirmed: CheckCircle2,
  payment_failed: XCircle,
  shipment_created: Truck,
  shipment_delayed: Clock,
  delivered: Home,
  refund_requested: RotateCcw,
  customer_message_received: MessageSquare,
  no_update_for_n_hours: Moon,
  agent_run: Bot,
};

export function Timeline({ events }: { events: TimelineEvent[] }) {
  if (!events.length) {
    return (
      <EmptyState
        icon={Clock}
        title="No events yet"
        description="Events injected into this run will appear here in chronological order."
      />
    );
  }

  return (
    <div className="space-y-0">
      {events.map((event, idx) => {
        const Icon = EVENT_ICONS[event.event_type] ?? Clock;
        const isLast = idx === events.length - 1;
        return (
          <div key={event.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className="flex h-7 w-7 items-center justify-center rounded-full border border-border bg-surface-2">
                <Icon className="h-3.5 w-3.5 text-text-muted" />
              </div>
              {!isLast && (
                <div className="w-px flex-1 bg-border" />
              )}
            </div>
            <div className="flex-1 pb-6">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-text">
                  {event.event_type.replace(/_/g, " ")}
                </span>
                <span className="text-[11px] text-text-dim">
                  {formatRelative(event.created_at)}
                </span>
              </div>
              {Object.keys(event.event_data).length > 0 && (
                <pre className="mt-2 overflow-x-auto rounded-md border border-border bg-surface-2 p-2.5 font-mono text-[11px] leading-relaxed text-text-muted">
                  {prettyJson(event.event_data)}
                </pre>
              )}
              {event.action_taken && (
                <pre className="mt-2 overflow-x-auto rounded-md border border-accent/20 bg-accent/5 p-2.5 font-mono text-[11px] leading-relaxed text-text-muted">
                  {prettyJson(event.action_taken)}
                </pre>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}