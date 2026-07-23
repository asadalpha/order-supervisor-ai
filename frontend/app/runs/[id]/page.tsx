"use client";

import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Clock,
  Play,
  Pause,
  Square,
  MessageSquare,
  Brain,
  History,
  Send,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { Tabs } from "@/components/ui/tabs";
import { LoadingRow } from "@/components/ui/empty-state";
import { Timeline } from "@/components/runs/timeline";
import { MemoryViewer } from "@/components/runs/memory-viewer";
import { EventInjector } from "@/components/runs/event-injector";
import { InstructionPanel } from "@/components/runs/instruction-panel";
import { ActionsList } from "@/components/runs/actions-list";
import {
  useActions,
  useAddInstruction,
  useInstructions,
  useInterruptRun,
  useMemory,
  useResumeRun,
  useRun,
  useTerminateRun,
  useTimeline,
} from "@/hooks/use-runs";
import { formatRelative, prettyJson } from "@/lib/utils";

export default function RunDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();

  const { data: run, isLoading } = useRun(id);
  const { data: timeline } = useTimeline(id);
  const { data: memory } = useMemory(id);
  const { data: instructions } = useInstructions(id);
  const { data: actions } = useActions(id);

  const terminate = useTerminateRun();
  const interrupt = useInterruptRun();
  const resume = useResumeRun();

  if (isLoading) return (
    <AppShell>
      <LoadingRow label="Loading run…" />
    </AppShell>
  );

  if (!run) {
    return (
      <AppShell>
        <PageHeader title="Run not found" />
        <div className="px-8">
          <Link href="/runs">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to runs
            </Button>
          </Link>
        </div>
      </AppShell>
    );
  }

  const isActive = run.status === "running" || run.status === "paused";
  const state = run.current_state as {
    event_count?: number;
    action_count?: number;
  };

  return (
    <AppShell>
      <PageHeader
        title={`Order ${run.order_id}`}
        description={
          <span className="flex items-center gap-3">
            <StatusBadge status={run.status} />
            <span>Created {formatRelative(run.created_at)}</span>
            {run.next_wake_up_at && isActive && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                wake {formatRelative(run.next_wake_up_at)}
              </span>
            )}
          </span>
        }
        action={
          <div className="flex items-center gap-2">
            <Link href="/runs">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-3.5 w-3.5" />
                Back
              </Button>
            </Link>
            {run.status === "running" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => interrupt.mutate(run.id)}
                disabled={interrupt.isPending}
              >
                <Pause className="h-3.5 w-3.5" />
                Pause
              </Button>
            )}
            {run.status === "paused" && (
              <Button
                size="sm"
                onClick={() => resume.mutate(run.id)}
                disabled={resume.isPending}
              >
                <Play className="h-3.5 w-3.5" />
                Resume
              </Button>
            )}
            {isActive && (
              <Button
                variant="danger"
                size="sm"
                onClick={() => terminate.mutate({ runId: run.id })}
                disabled={terminate.isPending}
              >
                <Square className="h-3.5 w-3.5" />
                Terminate
              </Button>
            )}
          </div>
        }
      />

      <div className="px-8 pb-4">
        <div className="grid grid-cols-3 gap-3">
          <Card className="p-3">
            <p className="text-[11px] uppercase tracking-wider text-text-dim">
              Events
            </p>
            <p className="text-lg font-semibold text-text">
              {state.event_count ?? 0}
            </p>
          </Card>
          <Card className="p-3">
            <p className="text-[11px] uppercase tracking-wider text-text-dim">
              Actions
            </p>
            <p className="text-lg font-semibold text-text">
              {state.action_count ?? 0}
            </p>
          </Card>
          <Card className="p-3">
            <p className="text-[11px] uppercase tracking-wider text-text-dim">
              Instructions
            </p>
            <p className="text-lg font-semibold text-text">
              {instructions?.length ?? 0}
            </p>
          </Card>
        </div>
      </div>

      <div className="px-8 pb-10">
        <Tabs
          defaultValue="timeline"
          tabs={[
            {
              value: "timeline",
              label: "Timeline",
              content: (
                <Timeline events={timeline ?? []} />
              ),
            },
            {
              value: "memory",
              label: "Memory",
              content: <MemoryViewer memory={memory} />,
            },
            {
              value: "actions",
              label: "Actions",
              content: <ActionsList actions={actions ?? []} />,
            },
            {
              value: "events",
              label: "Inject Event",
              content: isActive ? (
                <EventInjector runId={run.id} />
              ) : (
                <p className="text-sm text-text-muted">
                  This run is not active. Events can only be injected into
                  running or paused runs.
                </p>
              ),
            },
            {
              value: "instructions",
              label: "Instructions",
              content: <InstructionPanel runId={run.id} />,
            },
            {
              value: "final",
              label: "Final Output",
              content: run.final_output ? (
                <Card className="p-4">
                  <pre className="overflow-x-auto font-mono text-xs text-text-muted">
                    {prettyJson(run.final_output)}
                  </pre>
                </Card>
              ) : (
                <p className="text-sm text-text-muted">
                  No final output yet. The workflow produces a summary on
                  completion.
                </p>
              ),
            },
          ]}
        />
      </div>
    </AppShell>
  );
}