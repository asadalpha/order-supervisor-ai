"use client";

import { useState } from "react";
import { Play, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useCreateRun } from "@/hooks/use-runs";
import { useSupervisors } from "@/hooks/use-supervisors";
import type { Supervisor } from "@/lib/types";

export function StartRunDialog({
  onClose,
  onStarted,
}: {
  onClose: () => void;
  onStarted?: (runId: string) => void;
}) {
  const { data: supervisors, isLoading } = useSupervisors();
  const create = useCreateRun();

  const [supervisorId, setSupervisorId] = useState("");
  const [orderId, setOrderId] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supervisorId || !orderId.trim()) return;
    try {
      const run = await create.mutateAsync({
        supervisor_id: supervisorId,
        order_id: orderId.trim(),
      });
      onStarted?.(run.id);
      onClose();
    } catch {
      // surfaced via mutation state
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative w-full max-w-md rounded-lg border border-border bg-surface p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-text">Start New Run</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="supervisor">Supervisor</Label>
            <Select
              id="supervisor"
              value={supervisorId}
              onChange={(e) => setSupervisorId(e.target.value)}
              disabled={isLoading}
            >
              <option value="">
                {isLoading ? "Loading…" : "Select a supervisor…"}
              </option>
              {supervisors?.map((sup: Supervisor) => (
                <option key={sup.id} value={sup.id}>
                  {sup.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="order">Order ID</Label>
            <Input
              id="order"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              placeholder="e.g. ORD-2024-001"
            />
          </div>

          {create.isError && (
            <p className="text-xs text-danger">
              {create.error instanceof Error
                ? create.error.message
                : "Failed to start run"}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!supervisorId || !orderId.trim() || create.isPending}
            >
              <Play className="h-3.5 w-3.5" />
              {create.isPending ? "Starting…" : "Start Run"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}