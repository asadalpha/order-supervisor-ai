"use client";

import { useState } from "react";
import { Plus, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea, Label } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { useAddInstruction, useInstructions } from "@/hooks/use-runs";
import { formatRelative } from "@/lib/utils";

export function InstructionPanel({ runId }: { runId: string }) {
  const { data: instructions, isLoading } = useInstructions(runId);
  const [value, setValue] = useState("");
  const add = useAddInstruction();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) return;
    try {
      await add.mutateAsync({ runId, instruction: value });
      setValue("");
    } catch {
      // surfaced via mutation state
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="instruction">Add Run-Specific Instruction</Label>
          <Textarea
            id="instruction"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="e.g. For this order, prioritise speed over cost."
            rows={3}
          />
        </div>
        <Button
          type="submit"
          size="sm"
          disabled={!value.trim() || add.isPending}
        >
          <Send className="h-3.5 w-3.5" />
          {add.isPending ? "Sending…" : "Add Instruction"}
        </Button>
      </form>

      <div>
        <div className="mb-2 text-xs font-medium uppercase tracking-wider text-text-dim">
          Active Instructions
        </div>
        {isLoading ? (
          <p className="text-sm text-text-muted">Loading…</p>
        ) : !instructions?.length ? (
          <EmptyState
            icon={Plus}
            title="No instructions added"
            description="Run-specific guidance will appear here once added."
          />
        ) : (
          <div className="space-y-2">
            {instructions.map((inst) => (
              <div
                key={inst.id}
                className="rounded-md border border-border bg-surface p-3"
              >
                <p className="text-sm text-text">{inst.instruction}</p>
                <p className="mt-1.5 text-[11px] text-text-dim">
                  {formatRelative(inst.created_at)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}