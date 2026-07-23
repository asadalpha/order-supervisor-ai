import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import type { RunStatus } from "@/lib/types";

type Tone = "default" | "success" | "warning" | "danger" | "info";

const TONES: Record<Tone, string> = {
  default: "bg-surface-2 text-text-muted border-border",
  success: "bg-success/10 text-success border-success/30",
  warning: "bg-warning/10 text-warning border-warning/30",
  danger: "bg-danger/10 text-danger border-danger/30",
  info: "bg-info/10 text-info border-info/30",
};

const STATUS_TONE: Record<RunStatus, Tone> = {
  running: "success",
  paused: "warning",
  completed: "info",
  terminated: "danger",
};

export function Badge({
  className,
  tone = "default",
  children,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium",
        TONES[tone],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: RunStatus }) {
  const tone = STATUS_TONE[status];
  const dot =
    status === "running"
      ? "bg-success"
      : status === "paused"
        ? "bg-warning"
        : status === "terminated"
          ? "bg-danger"
          : "bg-info";
  return (
    <Badge tone={tone}>
      <span className={cn("h-1.5 w-1.5 rounded-full", dot)} />
      <span className="capitalize">{status}</span>
    </Badge>
  );
}