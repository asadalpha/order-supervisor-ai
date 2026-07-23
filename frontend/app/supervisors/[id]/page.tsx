"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Bot,
  Wrench,
  Play,
  Clock,
  Sparkles,
  Layers,
  FileText,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { LoadingRow } from "@/components/ui/empty-state";
import { useSupervisor } from "@/hooks/use-supervisors";
import { useCreateRun, useRuns } from "@/hooks/use-runs";
import { formatRelative, prettyJson } from "@/lib/utils";

export default function SupervisorDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();

  const { data: supervisor, isLoading } = useSupervisor(id);
  const { data: allRuns } = useRuns();
  const createRun = useCreateRun();

  const [orderId, setOrderId] = useState("");
  const [showStartRun, setShowStartRun] = useState(false);

  if (isLoading) {
    return (
      <AppShell>
        <LoadingRow label="Loading supervisor template…" />
      </AppShell>
    );
  }

  if (!supervisor) {
    return (
      <AppShell>
        <PageHeader title="Supervisor Not Found" />
        <div className="px-8">
          <Link href="/supervisors">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Supervisors
            </Button>
          </Link>
        </div>
      </AppShell>
    );
  }

  const supervisorRuns = allRuns?.filter(
    (r) => r.supervisor_id === supervisor.id
  ) || [];

  const handleStartRun = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId.trim()) return;
    try {
      const newRun = await createRun.mutateAsync({
        supervisor_id: supervisor.id,
        order_id: orderId.trim(),
      });
      router.push(`/runs/${newRun.id}`);
    } catch {
      // Error handled by mutation
    }
  };

  return (
    <AppShell>
      <PageHeader
        title={supervisor.name}
        description={
          <span className="flex items-center gap-3">
            <span>Created {formatRelative(supervisor.created_at)}</span>
            <span>•</span>
            <span>Updated {formatRelative(supervisor.updated_at)}</span>
          </span>
        }
        action={
          <div className="flex items-center gap-2">
            <Link href="/supervisors">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to Supervisors
              </Button>
            </Link>
            <Button size="sm" onClick={() => setShowStartRun(!showStartRun)}>
              <Play className="h-3.5 w-3.5" />
              Start Order Run
            </Button>
          </div>
        }
      />

      <div className="space-y-6 px-8 pb-10">
        {/* Quick Start Run Drawer / Box */}
        {showStartRun && (
          <Card className="border-accent/40 bg-accent/5 p-4">
            <form onSubmit={handleStartRun} className="flex items-end gap-3">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="orderId">Order ID</Label>
                <Input
                  id="orderId"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  placeholder="e.g. ORD-98765"
                  autoFocus
                />
              </div>
              <Button
                type="submit"
                disabled={!orderId.trim() || createRun.isPending}
              >
                <Play className="h-3.5 w-3.5" />
                {createRun.isPending ? "Starting Run…" : "Launch Workflow"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowStartRun(false)}
              >
                Cancel
              </Button>
            </form>
            {createRun.isError && (
              <p className="mt-2 text-xs text-danger">
                {createRun.error instanceof Error
                  ? createRun.error.message
                  : "Failed to start workflow run"}
              </p>
            )}
          </Card>
        )}

        {/* Base Instruction Card */}
        <Card className="space-y-3 p-5">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <FileText className="h-4 w-4 text-accent" />
            <h3 className="text-sm font-semibold text-text">Base Instructions</h3>
          </div>
          <p className="whitespace-pre-wrap font-sans text-xs leading-relaxed text-text-muted">
            {supervisor.base_instruction}
          </p>
        </Card>

        {/* Configurations Grid */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Available Tools */}
          <Card className="space-y-3 p-5">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <Wrench className="h-4 w-4 text-accent" />
              <h3 className="text-sm font-semibold text-text">Available Tools</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {supervisor.available_tools.map((tool) => (
                <span
                  key={tool}
                  className="inline-flex items-center gap-1.5 rounded-md border border-accent/30 bg-accent/10 px-2.5 py-1 font-mono text-[11px] font-medium text-text"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                  {tool}
                </span>
              ))}
            </div>
          </Card>

          {/* Wake-up Guidance & Model Config */}
          <Card className="space-y-3 p-5">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <Sparkles className="h-4 w-4 text-accent" />
              <h3 className="text-sm font-semibold text-text">Agent & Wake-Up Config</h3>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <span className="font-medium text-text-dim">Wake-Up Guidance:</span>
                <p className="mt-0.5 text-text-muted">
                  {supervisor.wake_up_guidance || "No explicit guidance set (uses standard priority rules)."}
                </p>
              </div>
              {supervisor.model_config && (
                <div>
                  <span className="font-medium text-text-dim">Model Configuration:</span>
                  <pre className="mt-1 overflow-x-auto rounded bg-surface-2 p-2 font-mono text-[11px] text-text-muted">
                    {prettyJson(supervisor.model_config)}
                  </pre>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Associated Workflow Runs */}
        <Card className="space-y-3 p-5">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-accent" />
              <h3 className="text-sm font-semibold text-text">
                Workflow Runs ({supervisorRuns.length})
              </h3>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowStartRun(true)}
            >
              + New Run
            </Button>
          </div>

          {!supervisorRuns.length ? (
            <p className="py-4 text-center text-xs text-text-dim">
              No workflow runs started with this supervisor yet. Click "+ New Run" above to start one.
            </p>
          ) : (
            <div className="space-y-2">
              {supervisorRuns.map((run) => (
                <Link
                  key={run.id}
                  href={`/runs/${run.id}`}
                  className="flex items-center justify-between rounded-md border border-border bg-surface p-3 transition-colors hover:border-border-hover"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-semibold text-text">
                      Order {run.order_id}
                    </span>
                    <span className="rounded bg-surface-2 px-2 py-0.5 text-[10px] font-medium text-text-muted uppercase">
                      {run.status}
                    </span>
                  </div>
                  <span className="text-[11px] text-text-dim">
                    {formatRelative(run.created_at)}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>
    </AppShell>
  );
}
