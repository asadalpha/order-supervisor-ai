"use client";

import { useState } from "react";
import { Plus, Activity } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Select } from "@/components/ui/select";
import { RunCard } from "@/components/runs/run-card";
import { StartRunDialog } from "@/components/runs/start-run-dialog";
import { useRuns } from "@/hooks/use-runs";
import type { RunStatus } from "@/lib/types";

export default function RunsPage() {
  const [filter, setFilter] = useState<RunStatus | "all">("all");
  const [showStart, setShowStart] = useState(false);
  const { data: runs, isLoading } = useRuns(
    filter === "all" ? undefined : filter,
  );

  return (
    <AppShell>
      <PageHeader
        title="Runs"
        description="All workflow runs across every order"
        action={
          <Button onClick={() => setShowStart(true)}>
            <Plus className="h-3.5 w-3.5" />
            Start Run
          </Button>
        }
      />

      <div className="flex items-center gap-3 px-8 pb-4">
        <span className="text-xs text-text-muted">Filter:</span>
        <Select
          value={filter}
          onChange={(e) => setFilter(e.target.value as RunStatus | "all")}
          className="w-40"
        >
          <option value="all">All statuses</option>
          <option value="running">Running</option>
          <option value="paused">Paused</option>
          <option value="completed">Completed</option>
          <option value="terminated">Terminated</option>
        </Select>
      </div>

      <div className="px-8 pb-10">
        {isLoading ? (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-24 animate-pulse rounded-lg border border-border bg-surface"
              />
            ))}
          </div>
        ) : !runs?.length ? (
          <EmptyState
            icon={Activity}
            title="No runs found"
            description={
              filter === "all"
                ? "Start a new supervision run to see it here."
                : `No runs with status "${filter}".`
            }
            action={
              <Button onClick={() => setShowStart(true)} size="sm">
                <Plus className="h-3.5 w-3.5" />
                Start Run
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {runs.map((run) => (
              <RunCard key={run.id} run={run} />
            ))}
          </div>
        )}
      </div>

      {showStart && <StartRunDialog onClose={() => setShowStart(false)} />}
    </AppShell>
  );
}