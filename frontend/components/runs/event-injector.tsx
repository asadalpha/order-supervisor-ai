"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useInjectEvent } from "@/hooks/use-runs";
import { EVENT_TYPES } from "@/lib/types";

export function EventInjector({ runId }: { runId: string }) {
  const [eventType, setEventType] = useState<string>("");
  const [eventData, setEventData] = useState("{}");
  const [error, setError] = useState<string | null>(null);
  const inject = useInjectEvent();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventType) return;
    setError(null);
    let parsed: Record<string, unknown> = {};
    try {
      parsed = JSON.parse(eventData);
    } catch {
      setError("Invalid JSON in event data");
      return;
    }
    try {
      await inject.mutateAsync({
        runId,
        event: { event_type: eventType, event_data: parsed },
      });
      setEventType("");
      setEventData("{}");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send event");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="event-type">Event Type</Label>
        <Select
          id="event-type"
          value={eventType}
          onChange={(e) => setEventType(e.target.value)}
        >
          <option value="">Select an event type…</option>
          {EVENT_TYPES.map((type) => (
            <option key={type} value={type}>
              {type.replace(/_/g, " ")}
            </option>
          ))}
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="event-data">Event Data (JSON)</Label>
        <Input
          id="event-data"
          value={eventData}
          onChange={(e) => setEventData(e.target.value)}
          placeholder='{"amount": 100, "currency": "USD"}'
          className="font-mono text-xs"
        />
      </div>

      {error && (
        <p className="text-xs text-danger">{error}</p>
      )}

      <Button
        type="submit"
        size="sm"
        disabled={!eventType || inject.isPending}
      >
        <Send className="h-3.5 w-3.5" />
        {inject.isPending ? "Sending…" : "Inject Event"}
      </Button>
    </form>
  );
}