"use client";

import { useState } from "react";
import { Plus, Activity, Bot, CheckCircle2, XCircle } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { RunCard } from "@/components/runs/run-card";
import { StartRunDialog } from "@/components/runs/start-run-dialog";
import { useRuns } from "@/hooks/use-runs";
import { useSupervisors } from "@/hooks/use-supervisors";
import type { RunStatus } from "@/lib/types";

export default function DashboardPage() {
  const [showStart, setShowStart] = useState(false);
  const { data: runs, isLoading } = useRuns();
  const { data: supervisors } = useSupervisors();

  const counts = (runs ?? []).reduce(
    (acc, run) => {
      acc[run.status] = (acc[run.status] ?? 0) + 1;
      return acc;
    },
    {} as Record<RunStatus, number>,
  );

  const activeRuns = (runs ?? [])
    .filter((r) => r.status === "running" || r.status === "paused")
    .slice(0, 12);

  return (
    <AppShell>
      <PageHeader
        title="Dashboard"
        description="Monitor active order supervision runs"
        action={
          <Button onClick={() => setShowStart(true)}>
            <Plus className="h-3.5 w-3.5" />
            Start Run
          </Button>
        }
      />

      <div className="px-8 pb-6">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            icon={Activity}
            label="Active Runs"
            value={(counts.running ?? 0) + (counts.paused ?? 0)}
          />
          <StatCard
            icon={CheckCircle2}
            label="Completed"
            value={counts.completed ?? 0}
          />
          <StatCard
            icon={XCircle}
            label="Terminated"
            value={counts.terminated ?? 0}
          />
          <StatCard
            icon={Bot}
            label="Supervisors"
            value={supervisors?.length ?? 0}
          />
        </div>
      </div>

      <div className="px-8 pb-10">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-text">Active Runs</h2>
          {(counts.running ?? 0) > 0 && (
            <span className="text-xs text-text-muted">
              {activeRuns.length} of {counts.running ?? 0} shown
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-24 animate-pulse rounded-lg border border-border bg-surface"
              />
            ))}
          </div>
        ) : activeRuns.length === 0 ? (
          <EmptyState
            icon={Activity}
            title="No active runs"
            description="Start a new supervision run to see it appear here."
            action={
              <Button onClick={() => setShowStart(true)} size="sm">
                <Plus className="h-3.5 w-3.5" />
                Start Run
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {activeRuns.map((run) => (
              <RunCard key={run.id} run={run} />
            ))}
          </div>
        )}
      </div>

      {showStart && <StartRunDialog onClose={() => setShowStart(false)} />}
    </AppShell>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-surface-2">
          <Icon className="h-4 w-4 text-text-muted" />
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wider text-text-dim">
            {label}
          </p>
          <p className="text-xl font-semibold text-text">{value}</p>
        </div>
      </div>
    </Card>
  );
}