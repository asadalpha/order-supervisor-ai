"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { useCreateSupervisor } from "@/hooks/use-supervisors";
import { AVAILABLE_TOOLS } from "@/lib/types";
import { cn } from "@/lib/utils";

export function SupervisorForm() {
  const router = useRouter();
  const create = useCreateSupervisor();

  const [name, setName] = useState("");
  const [baseInstruction, setBaseInstruction] = useState("");
  const [tools, setTools] = useState<string[]>([...AVAILABLE_TOOLS]);
  const [wakeUpGuidance, setWakeUpGuidance] = useState("");

  const toggleTool = (tool: string) => {
    setTools((prev) =>
      prev.includes(tool) ? prev.filter((t) => t !== tool) : [...prev, tool],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !baseInstruction.trim()) return;
    try {
      await create.mutateAsync({
        name: name.trim(),
        base_instruction: baseInstruction.trim(),
        available_tools: tools,
        wake_up_guidance: wakeUpGuidance.trim() || null,
      });
      router.push("/supervisors");
    } catch {
      // surfaced via mutation state
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-1.5">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Default Order Supervisor"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="instruction">Base Instruction</Label>
        <Textarea
          id="instruction"
          value={baseInstruction}
          onChange={(e) => setBaseInstruction(e.target.value)}
          placeholder="You are an AI order supervisor. Monitor the order lifecycle and intervene when needed…"
          rows={5}
        />
      </div>

      <div className="space-y-2">
        <Label>Available Actions</Label>
        <div className="grid grid-cols-2 gap-2">
          {AVAILABLE_TOOLS.map((tool: string) => (
            <button
              key={tool}
              type="button"
              onClick={() => toggleTool(tool)}
              className={cn(
                "flex items-center gap-2 rounded-md border px-3 py-2 text-left text-xs transition-colors",
                tools.includes(tool)
                  ? "border-accent/40 bg-accent/10 text-text"
                  : "border-border bg-surface-2 text-text-muted hover:text-text",
              )}
            >
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  tools.includes(tool) ? "bg-accent" : "bg-text-dim",
                )}
              />
              <span className="font-mono">{tool}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="guidance">Wake-up Guidance (optional)</Label>
        <Textarea
          id="guidance"
          value={wakeUpGuidance}
          onChange={(e) => setWakeUpGuidance(e.target.value)}
          placeholder="Guidance for how aggressively the agent should wake up on events…"
          rows={3}
        />
      </div>

      <div className="flex items-center gap-3">
        <Button
          type="submit"
          disabled={!name.trim() || !baseInstruction.trim() || create.isPending}
        >
          <Save className="h-3.5 w-3.5" />
          {create.isPending ? "Creating…" : "Create Supervisor"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push("/supervisors")}
        >
          Cancel
        </Button>
        {create.isError && (
          <span className="text-xs text-danger">
            {create.error instanceof Error
              ? create.error.message
              : "Failed to create"}
          </span>
        )}
      </div>
    </form>
  );
}