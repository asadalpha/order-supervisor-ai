"use client";

import { useState } from "react";
import { formatRelative, prettyJson } from "@/lib/utils";
import type { TimelineEvent } from "@/lib/types";

export function Timeline({ events }: { events: TimelineEvent[] }) {
  const [viewMode, setViewMode] = useState<"human" | "json">("human");

  if (events.length === 0) {
    return (
      <div className="py-12 text-center text-xs text-[#888892] border border-[#1c1c24] rounded-lg bg-[#141418]">
        No timeline events recorded for this order yet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Mode Selector Toggle */}
      <div className="flex items-center justify-between pb-2 border-b border-[#1c1c24]">
        <span className="text-xs font-medium text-[#888892]">
          Order Timeline History ({events.length} events)
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

      {/* Events List */}
      <div className="space-y-3">
        {events.map((event, idx) => (
          <TimelineItem
            key={event.id || idx}
            event={event}
            viewMode={viewMode}
          />
        ))}
      </div>
    </div>
  );
}

function TimelineItem({
  event,
  viewMode,
}: {
  event: TimelineEvent;
  viewMode: "human" | "json";
}) {
  const rawData = (event.event_data || {}) as Record<string, any>;
  const innerData =
    rawData.event_data && typeof rawData.event_data === "object"
      ? (rawData.event_data as Record<string, any>)
      : {};
  const data = { ...rawData, ...innerData };

  const getOrderId = () => String(data.order_id || data.orderId || data.id || "N/A");
  const getAmount = () => {
    const val = data.amount ?? data.amount_paid ?? data.amountPaid;
    return val !== undefined && val !== null ? String(val) : "0.00";
  };

  const getEventMetadata = (event: TimelineEvent) => {
    switch (event.event_type) {
      case "order_created":
        const orderIdVal = getOrderId();
        return {
          title: "Order Supervision Initialized",
          badge: "Order Created",
          badgeColor: "text-blue-400 border-blue-500/20 bg-blue-500/10",
          summary: `Order ${orderIdVal} created and initialized in supervision workflow.`,
          fields: [
            { label: "Order ID", value: orderIdVal },
            { label: "Initial Status", value: "Workflow Supervision Started" },
          ],
        };
      case "shipment_delayed":
        return {
          title: "Shipment Delay Reported",
          badge: "Delay Alert",
          badgeColor: "text-amber-400 border-amber-500/20 bg-amber-500/10",
          summary: `Shipment delayed by ${data.delay_hours || 24} hours via ${data.carrier || "Carrier"}.`,
          fields: [
            { label: "Delay Duration", value: `${data.delay_hours || 24} hours` },
            { label: "Shipping Carrier", value: String(data.carrier || "N/A") },
            { label: "Tracking Number", value: String(data.tracking_id || data.tracking_number || data.trackingId || "N/A") },
            { label: "Delay Reason", value: String(data.reason || data.delay_reason || data.delayReason || "Logistics disruption") },
          ],
        };
      case "payment_failed":
        const failedAmount = getAmount();
        return {
          title: "Payment Transaction Declined",
          badge: "Payment Failed",
          badgeColor: "text-rose-400 border-rose-500/20 bg-rose-500/10",
          summary: `Payment transaction of $${failedAmount} was declined.`,
          fields: [
            { label: "Amount Declined", value: `$${failedAmount}` },
            { label: "Failure Reason", value: String(data.reason || data.failure_code || data.failureReason || "Card declined") },
            { label: "Customer Contact", value: String(data.customer_email || data.customerEmail || "N/A") },
          ],
        };
      case "customer_message_received":
        return {
          title: "Customer Message Received",
          badge: "Inquiry",
          badgeColor: "text-purple-400 border-purple-500/20 bg-purple-500/10",
          summary: `Incoming customer message: "${data.message || data.message_body || data.messageBody || ""}"`,
          fields: [
            { label: "Customer Email", value: String(data.customer_email || data.customerEmail || "N/A") },
            { label: "Message Body", value: `"${data.message || data.message_body || data.messageBody || ""}"` },
          ],
        };
      case "delivered":
        return {
          title: "Order Delivered Successfully",
          badge: "Delivered",
          badgeColor: "text-emerald-400 border-emerald-500/20 bg-emerald-500/10",
          summary: `Order package arrived safely at destination.`,
          fields: [
            { label: "Delivery Location", value: String(data.delivery_location || data.deliveryLocation || data.location || "Front Porch") },
            { label: "Signed By", value: String(data.signed_by || data.signedBy || "Customer") },
          ],
        };
      case "payment_confirmed":
        const paidAmount = getAmount();
        return {
          title: "Payment Confirmed",
          badge: "Paid",
          badgeColor: "text-emerald-400 border-emerald-500/20 bg-emerald-500/10",
          summary: `Payment of $${paidAmount} confirmed successfully.`,
          fields: [
            { label: "Amount Paid", value: `$${paidAmount}` },
            { label: "Transaction Reference", value: String(data.transaction_id || data.transactionId || data.transaction_ref || "TXN-CONFIRMED") },
          ],
        };
      case "shipment_created":
        return {
          title: "Shipment Dispatched",
          badge: "In Transit",
          badgeColor: "text-blue-400 border-blue-500/20 bg-blue-500/10",
          summary: `Package handed over to shipping carrier.`,
          fields: [
            { label: "Carrier", value: String(data.carrier || "Logistics Partner") },
            { label: "Tracking Number", value: String(data.tracking_id || data.trackingId || "N/A") },
          ],
        };
      case "refund_requested":
        const refundAmount = getAmount();
        return {
          title: "Refund Requested by Customer",
          badge: "Refund Request",
          badgeColor: "text-amber-400 border-amber-500/20 bg-amber-500/10",
          summary: `Refund requested for $${refundAmount}.`,
          fields: [
            { label: "Refund Amount", value: `$${refundAmount}` },
            { label: "Refund Reason", value: String(data.reason || "Customer request") },
          ],
        };
      case "agent_run":
        return {
          title: "AI Agent Supervision Run",
          badge: "Agent Cycle",
          badgeColor: "text-blue-400 border-blue-500/20 bg-blue-500/10",
          summary: `AI Agent evaluated context and executed supervision step.`,
          fields: [
            { label: "Trigger Event", value: String(data.trigger || "signal") },
            { label: "Reasoning Summary", value: String(data.reasoning || "Context evaluated cleanly") },
          ],
        };
      default:
        return {
          title: event.event_type.replace(/_/g, " "),
          badge: "Event",
          badgeColor: "text-[#888892] border-[#242432] bg-[#1a1a24]",
          summary: `${event.event_type} event recorded in order lifecycle.`,
          fields: Object.entries(data).map(([k, v]) => ({
            label: k,
            value: typeof v === "object" ? JSON.stringify(v) : String(v),
          })),
        };
    }
  };

  const meta = getEventMetadata(event);

  const formatHumanActionTaken = (actionObj: Record<string, any>) => {
    if (!actionObj || typeof actionObj !== "object") return null;
    const tool = actionObj.tool || actionObj.tool_name || actionObj.action;
    if (tool === "schedule_wake_up") {
      const mins = Math.max(1, Math.round((Number(actionObj.seconds) || 300) / 60));
      return `Scheduled next check in ${mins} minute${mins === 1 ? "" : "s"}. ${actionObj.reason ? `Reason: ${actionObj.reason}` : ""}`;
    }
    if (tool === "send_customer_message" || tool === "message_customer") {
      return `Sent message to customer: "${actionObj.message || ""}"`;
    }
    if (tool === "escalate_issue") {
      return `Escalated issue to human support. ${actionObj.reason ? `Reason: ${actionObj.reason}` : ""}`;
    }
    if (tool === "create_internal_note") {
      return `Created internal note: "${actionObj.note || ""}"`;
    }
    if (tool === "message_logistics_team") {
      return `Sent message to logistics team: "${actionObj.message || ""}"`;
    }
    if (tool === "message_fulfillment_team") {
      return `Sent message to fulfillment team: "${actionObj.message || ""}"`;
    }
    if (tool === "message_payments_team") {
      return `Sent message to payments team: "${actionObj.message || ""}"`;
    }
    return `Executed action: ${tool}`;
  };

  return (
    <div className="rounded-lg border border-[#1c1c24] bg-[#141418] p-4 text-xs space-y-3">
      {/* Event Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-[#1c1c24]/60">
        <div className="flex items-center gap-2.5">
          <span className="font-bold text-text text-xs">
            {meta.title}
          </span>
          <span
            className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${meta.badgeColor}`}
          >
            {meta.badge}
          </span>
        </div>
        <span className="text-[11px] text-[#656570]">
          {event.created_at ? formatRelative(event.created_at) : "Just now"}
        </span>
      </div>

      {/* Main Content */}
      {viewMode === "human" ? (
        <div className="space-y-2 pt-1">
          <p className="text-text font-medium leading-relaxed">
            {meta.summary}
          </p>

          {/* Key-Value Fields */}
          {meta.fields.length > 0 && (
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#1c1c24]/40">
              {meta.fields.map((f, i) => (
                <div key={i} className="flex flex-col gap-0.5 bg-[#09090d] p-2 rounded-md border border-[#1c1c24]">
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-[#656570]">
                    {f.label}
                  </span>
                  <span className="text-xs text-text font-medium leading-normal truncate">
                    {f.value}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <pre className="overflow-x-auto rounded-md bg-[#09090d] p-3 font-mono text-[11px] text-[#888892] border border-[#1c1c24]">
          {prettyJson(event.event_data)}
        </pre>
      )}

      {/* Formatted Actions Executed Card */}
      {event.action_taken && (
        <div className="mt-2 rounded-md bg-[#09090d] p-3 border border-[#1c1c24] text-[11px] space-y-1">
          <span className="text-emerald-400 font-semibold block">✓ Action Executed by Agent:</span>
          {viewMode === "human" ? (
            <p className="text-text font-medium leading-relaxed">
              {formatHumanActionTaken(event.action_taken)}
            </p>
          ) : (
            <pre className="font-mono text-emerald-400 overflow-x-auto text-[11px]">
              {prettyJson(event.action_taken)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}