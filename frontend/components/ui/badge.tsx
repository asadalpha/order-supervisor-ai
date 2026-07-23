import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import type { RunStatus } from "@/lib/types";

export function Badge({
  className,
  variant = "default",
  ...props
}: HTMLAttributes<HTMLSpanElement> & {
  variant?: "default" | "active" | "complete" | "paused" | "terminated";
}) {
  const variants = {
    default: "border-[#1c1c24] bg-[#141418] text-text-muted",
    active: "border-blue-500/20 bg-blue-500/10 text-blue-400",
    complete: "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
    paused: "border-amber-500/20 bg-amber-500/10 text-amber-400",
    terminated: "border-rose-500/20 bg-rose-500/10 text-rose-400",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium tracking-normal transition-colors",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}

export function StatusBadge({ status }: { status: RunStatus | string }) {
  switch (status) {
    case "running":
      return (
        <Badge variant="active">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
          Active
        </Badge>
      );
    case "paused":
      return (
        <Badge variant="paused">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
          Paused
        </Badge>
      );
    case "completed":
      return (
        <Badge variant="complete">
          <span>✓</span>
          Complete
        </Badge>
      );
    case "terminated":
      return (
        <Badge variant="terminated">
          <span>×</span>
          Terminated
        </Badge>
      );
    default:
      return <Badge>{status}</Badge>;
  }
}