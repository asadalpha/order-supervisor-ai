"use client";

import { useState } from "react";
import { Send, AlertTriangle, CreditCard, MessageSquare, CheckCircle, RefreshCw, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useInjectEvent } from "@/hooks/use-runs";

const EVENT_TYPES = [
  { value: "shipment_delayed", label: "Shipment Delayed (shipment_delayed)", priority: "high" },
  { value: "payment_failed", label: "Payment Failed (payment_failed)", priority: "high" },
  { value: "payment_confirmed", label: "Payment Confirmed (payment_confirmed)", priority: "medium" },
  { value: "shipment_created", label: "Shipment Created (shipment_created)", priority: "medium" },
  { value: "customer_message_received", label: "Customer Message Received (customer_message_received)", priority: "medium" },
  { value: "refund_requested", label: "Refund Requested (refund_requested)", priority: "high" },
  { value: "no_update_for_n_hours", label: "No Update Warning (no_update_for_n_hours)", priority: "low" },
  { value: "delivered", label: "Order Delivered - Terminal (delivered)", priority: "high" },
  { value: "custom", label: "Custom Custom Event Type", priority: "medium" },
];

const PRESETS = [
  {
    name: "Delay Shipment (+24h)",
    icon: AlertTriangle,
    type: "shipment_delayed",
    priority: "high",
    data: {
      delay_hours: 24,
      carrier: "FedEx Express",
      tracking_id: "TRK-987654",
      reason: "Severe weather disruption at main distribution hub",
    },
  },
  {
    name: "Payment Failed",
    icon: CreditCard,
    type: "payment_failed",
    priority: "high",
    data: {
      amount: 299.99,
      currency: "USD",
      reason: "card_declined_insufficient_funds",
      card_last4: "4242",
    },
  },
  {
    name: "Customer Inquiry",
    icon: MessageSquare,
    type: "customer_message_received",
    priority: "medium",
    data: {
      channel: "email",
      message: "Where is my order? It was supposed to arrive yesterday and I need an urgent update!",
      customer_email: "customer@example.com",
    },
  },
  {
    name: "Mark Delivered",
    icon: CheckCircle,
    type: "delivered",
    priority: "high",
    data: {
      signed_by: "Customer",
      delivery_location: "Front Porch",
      delivery_time: new Date().toISOString(),
    },
  },
  {
    name: "Refund Requested",
    icon: RefreshCw,
    type: "refund_requested",
    priority: "high",
    data: {
      amount: 299.99,
      reason: "Package packaging arrived damaged",
    },
  },
];

export function EventInjector({ runId }: { runId: string }) {
  const [eventType, setEventType] = useState("shipment_delayed");
  const [customEventType, setCustomEventType] = useState("");
  const [priority, setPriority] = useState<"high" | "medium" | "low">("high");
  const [eventDataJson, setEventDataJson] = useState(
    JSON.stringify(PRESETS[0].data, null, 2),
  );
  const [jsonError, setJsonError] = useState<string | null>(null);

  const inject = useInjectEvent();

  const handleSelectPreset = (preset: typeof PRESETS[number]) => {
    setEventType(preset.type);
    setPriority(preset.priority as "high" | "medium" | "low");
    setEventDataJson(JSON.stringify(preset.data, null, 2));
    setJsonError(null);
  };

  const handleEventTypeChange = (val: string) => {
    setEventType(val);
    const found = EVENT_TYPES.find((e) => e.value === val);
    if (found) {
      setPriority(found.priority as "high" | "medium" | "low");
    }
  };

  const handleInject = () => {
    setJsonError(null);
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(eventDataJson);
    } catch {
      setJsonError("Invalid JSON payload formatting.");
      return;
    }

    const finalEventType = eventType === "custom" ? customEventType || "custom_event" : eventType;

    inject.mutate({
      runId,
      event: {
        event_type: finalEventType,
        event_data: {
          ...parsed,
          priority: priority,
        },
      },
    });
  };

  return (
    <Card className="p-6 bg-[#141418] border-[#1c1c24] rounded-xl text-xs space-y-5">
      <div>
        <h3 className="text-sm font-bold text-text">Inject Order Event Signal</h3>
        <p className="text-xs text-[#888892] mt-0.5">
          Simulate real-time logistics, payment, or customer events to trigger supervisor evaluation
        </p>
      </div>

      {/* 1-Click Preset Buttons */}
      <div>
        <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-[#656570]">
          Quick Preset Triggers
        </label>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((preset) => {
            const Icon = preset.icon;
            const isSelected = eventType === preset.type;
            return (
              <button
                key={preset.name}
                type="button"
                onClick={() => handleSelectPreset(preset)}
                className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-all ${
                  isSelected
                    ? "border-blue-500/50 bg-[#1e1e2c] text-blue-400"
                    : "border-[#1c1c24] bg-[#09090d] text-[#888892] hover:border-[#2a2a38] hover:text-text"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{preset.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Event Selection Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1.5 block font-semibold text-text">
            Event Type Dropdown
          </label>
          <select
            value={eventType}
            onChange={(e) => handleEventTypeChange(e.target.value)}
            className="w-full rounded-md border border-[#1c1c24] bg-[#09090d] px-3 py-2 text-xs text-text focus:border-blue-500/50 focus:outline-none"
          >
            {EVENT_TYPES.map((et) => (
              <option key={et.value} value={et.value}>
                {et.label}
              </option>
            ))}
          </select>

          {eventType === "custom" && (
            <input
              type="text"
              value={customEventType}
              onChange={(e) => setCustomEventType(e.target.value)}
              placeholder="Enter custom event type name..."
              className="w-full mt-2 rounded-md border border-[#1c1c24] bg-[#09090d] px-3 py-1.5 text-xs text-text focus:border-blue-500/50 focus:outline-none"
            />
          )}
        </div>

        <div>
          <label className="mb-1.5 block font-semibold text-text">
            Event Priority Level
          </label>
          <div className="flex items-center rounded-md border border-[#1c1c24] bg-[#09090d] p-0.5 text-xs">
            {[
              { level: "high", label: "High Priority (Wake Agent)", color: "text-rose-400" },
              { level: "medium", label: "Medium", color: "text-amber-400" },
              { level: "low", label: "Low", color: "text-blue-400" },
            ].map((p) => (
              <button
                key={p.level}
                type="button"
                onClick={() => setPriority(p.level as "high" | "medium" | "low")}
                className={`flex-1 rounded py-1.5 font-medium text-center transition-all ${
                  priority === p.level
                    ? "bg-[#22222a] text-text shadow-sm"
                    : "text-[#888892] hover:text-text"
                }`}
              >
                <span className={priority === p.level ? p.color : ""}>{p.level.toUpperCase()}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* JSON Payload Editor */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="font-semibold text-text">
            Event Payload (JSON Data)
          </label>
          <span className="text-[11px] text-[#656570]">
            Priority <span className="font-mono text-blue-400">"{priority}"</span> will be included automatically
          </span>
        </div>
        <textarea
          rows={5}
          value={eventDataJson}
          onChange={(e) => {
            setEventDataJson(e.target.value);
            setJsonError(null);
          }}
          className="w-full rounded-md border border-[#1c1c24] bg-[#09090d] p-3 font-mono text-xs text-text focus:border-blue-500/50 focus:outline-none"
        />
        {jsonError && (
          <p className="mt-1 text-xs font-medium text-rose-400">{jsonError}</p>
        )}
      </div>

      <div className="flex justify-end pt-1 border-t border-[#1c1c24]">
        <Button
          onClick={handleInject}
          disabled={inject.isPending}
          size="sm"
          className="bg-[#1f1f26] border border-[#2a2a34] text-text hover:bg-[#282834]"
        >
          <Send className="h-3.5 w-3.5" />
          {inject.isPending ? "Sending Event…" : "Inject Event Signal"}
        </Button>
      </div>
    </Card>
  );
}