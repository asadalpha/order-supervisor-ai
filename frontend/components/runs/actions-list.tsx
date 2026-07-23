"use client";

import { useState } from "react";
import { formatRelative, prettyJson } from "@/lib/utils";
import type { AgentAction } from "@/lib/types";

export function ActionsList({ actions }: { actions: AgentAction[] }) {
  const [viewMode, setViewMode] = useState<"human" | "json">("human");

  if (!actions.length) {
    return (
      <div className="py-12 text-center text-xs text-[#888892] border border-[#1c1c24] rounded-lg bg-[#141418]">
        No agent actions recorded yet for this order.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Mode Selector Toggle */}
      <div className="flex items-center justify-between pb-2 border-b border-[#1c1c24]">
        <span className="text-xs font-medium text-[#888892]">
          Agent Actions Log ({actions.length})
        </span>
        <div className="flex items-center rounded-md border border-[#1c1c24] bg-[#141418] p-0.5 text-[11px]">
          <button
            onClick={() => setViewMode("human")}
            className={`rounded px-2.5 py-1 font-medium transition-colors ${
              viewMode === "human"
                ? "bg-[#22222a] text-text"
                : "text-[#888892] hover:text-text"
            }`}
          >
            Human View
          </button>
          <button
            onClick={() => setViewMode("json")}
            className={`rounded px-2.5 py-1 font-mono transition-colors ${
              viewMode === "json"
                ? "bg-[#22222a] text-text"
                : "text-[#888892] hover:text-text"
            }`}
          >
            {"{ } Raw JSON"}
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {actions.map((action) => (
          <ActionItem key={action.id} action={action} viewMode={viewMode} />
        ))}
      </div>
    </div>
  );
}

function ActionItem({
  action,
  viewMode,
}: {
  action: AgentAction;
  viewMode: "human" | "json";
}) {
  // Parse inputs cleanly (handling cases where tool_input contains raw JSON strings)
  const parseInput = (rawInput: Record<string, unknown>): Record<string, any> => {
    if (!rawInput) return {};
    let input = { ...rawInput };
    if (typeof input._raw === "string") {
      try {
        const parsed = JSON.parse(input._raw);
        input = { ...input, ...parsed };
      } catch {
        // ignore
      }
    }
    return input;
  };

  const input = parseInput(action.tool_input || {});

  const getActionMetadata = (toolName: string) => {
    switch (toolName) {
      case "schedule_wake_up":
        const mins = Math.max(1, Math.round((Number(input.seconds) || 300) / 60));
        return {
          title: "Schedule Wake-Up Timer",
          status: "Scheduled",
          statusColor: "text-blue-400 border-blue-500/20 bg-blue-500/10",
          summary: `Scheduled next automated wake-up check in ${mins} minute${mins === 1 ? "" : "s"}.`,
          fields: [
            { label: "Check Interval", value: `${mins} minute${mins === 1 ? "" : "s"} (${input.seconds || 300}s)` },
            { label: "Reason for Timer", value: input.reason || "Monitoring order lifecycle" },
          ],
        };
      case "send_customer_message":
        return {
          title: "Send Customer Email Message",
          status: "Message Sent",
          statusColor: "text-emerald-400 border-emerald-500/20 bg-emerald-500/10",
          summary: `Sent automated customer notification email.`,
          fields: [
            { label: "Message Body", value: `"${input.message || ""}"` },
            { label: "Urgency Level", value: input.urgency || "medium" },
          ],
        };
      case "escalate_issue":
        return {
          title: "Escalate Issue to Support",
          status: "Escalated",
          statusColor: "text-rose-400 border-rose-500/20 bg-rose-500/10",
          summary: `Escalated order issue for manual human review.`,
          fields: [
            { label: "Escalation Reason", value: input.reason || "Order disruption requires human review" },
          ],
        };
      case "create_internal_note":
        return {
          title: "Create Operations Note",
          status: "Note Added",
          statusColor: "text-purple-400 border-purple-500/20 bg-purple-500/10",
          summary: `Added internal operations note for logistics team.`,
          fields: [
            { label: "Internal Note", value: `"${input.note || ""}"` },
          ],
        };
      case "request_refund":
        return {
          title: "Process Refund Request",
          status: "Refund Dispatched",
          statusColor: "text-amber-400 border-amber-500/20 bg-amber-500/10",
          summary: `Requested refund of $${input.amount || "0.00"}.`,
          fields: [
            { label: "Refund Amount", value: `$${input.amount || "0.00"}` },
            { label: "Reason", value: input.reason || "Customer refund request" },
          ],
        };
      case "close_workflow":
        return {
          title: "Close Order Supervision",
          status: "Workflow Closed",
          statusColor: "text-[#888892] border-[#242432] bg-[#1a1a24]",
          summary: `Closed supervisor tracking for this order.`,
          fields: [
            { label: "Closing Reason", value: input.reason || "Order completed" },
          ],
        };
      default:
        return {
          title: action.tool_name.replace(/_/g, " "),
          status: "Executed",
          statusColor: "text-[#888892] border-[#242432] bg-[#1a1a24]",
          summary: `Executed action ${action.tool_name}.`,
          fields: Object.entries(input).map(([k, v]) => ({
            label: k,
            value: typeof v === "object" ? JSON.stringify(v) : String(v),
          })),
        };
    }
  };

  const meta = getActionMetadata(action.tool_name);

  return (
    <div className="rounded-lg border border-[#1c1c24] bg-[#141418] p-4 text-xs space-y-3">
      {/* Header Bar */}
      <div className="flex items-center justify-between pb-2.5 border-b border-[#1c1c24]/60">
        <div className="flex items-center gap-2.5">
          <span className="font-bold text-text text-xs">
            {meta.title}
          </span>
          <span
            className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${meta.statusColor}`}
          >
            ✓ {meta.status}
          </span>
        </div>

        <span className="text-[11px] text-[#656570]">
          {formatRelative(action.created_at)}
        </span>
      </div>

      {/* Reasoning Quote Callout (if present) */}
      {action.reasoning && (
        <div className="rounded-md border border-[#1c1c24] bg-[#09090d] p-3 text-[11px] text-[#888892]">
          <span className="font-semibold text-text block mb-0.5">AI Agent Reasoning:</span>
          <p className="italic leading-relaxed">"{action.reasoning}"</p>
        </div>
      )}

      {/* Body Content */}
      {viewMode === "human" ? (
        <div className="space-y-2 pt-1">
          <p className="text-text font-medium leading-relaxed">
            {meta.summary}
          </p>

          {/* Key-Value Parameters Grid */}
          {meta.fields.length > 0 && (
            <div className="grid grid-cols-1 gap-2 pt-2 border-t border-[#1c1c24]/40">
              {meta.fields.map((f, i) => (
                <div key={i} className="flex flex-col gap-0.5 bg-[#09090d] p-2.5 rounded-md border border-[#1c1c24]">
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-[#656570]">
                    {f.label}
                  </span>
                  <span className="text-xs text-text font-medium leading-normal">
                    {f.value}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div>
            <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-[#656570]">
              Tool Input
            </div>
            <pre className="overflow-x-auto rounded bg-[#09090d] p-3 font-mono text-[11px] text-[#888892] border border-[#1c1c24]">
              {prettyJson(action.tool_input)}
            </pre>
          </div>
          <div>
            <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-[#656570]">
              Tool Output
            </div>
            <pre className="overflow-x-auto rounded bg-[#09090d] p-3 font-mono text-[11px] text-[#888892] border border-[#1c1c24]">
              {prettyJson(action.tool_output ?? "—")}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}