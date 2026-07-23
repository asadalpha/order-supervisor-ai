"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import { Timeline } from "@/components/runs/timeline";
import { MemoryViewer } from "@/components/runs/memory-viewer";
import { EventInjector } from "@/components/runs/event-injector";
import { InstructionPanel } from "@/components/runs/instruction-panel";
import { ActionsList } from "@/components/runs/actions-list";
import {
  useActions,
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

  const [activeTab, setActiveTab] = useState("timeline");
  const [finalViewMode, setFinalViewMode] = useState<"human" | "json">("human");

  const { data: run, isLoading } = useRun(id);
  const { data: timeline } = useTimeline(id);
  const { data: memory } = useMemory(id);
  const { data: instructions } = useInstructions(id);
  const { data: actions } = useActions(id);

  const terminate = useTerminateRun();
  const interrupt = useInterruptRun();
  const resume = useResumeRun();

  if (isLoading)
    return (
      <AppShell>
        <div className="p-8 text-center text-xs text-[#888892]">
          Loading supervision run details…
        </div>
      </AppShell>
    );

  if (!run) {
    return (
      <AppShell>
        <div className="p-8 max-w-5xl mx-auto space-y-4 text-xs">
          <Link
            href="/runs"
            className="inline-flex items-center gap-1 text-[#888892] hover:text-text"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Runs
          </Link>
          <p className="text-text font-semibold">Supervision Run Not Found.</p>
        </div>
      </AppShell>
    );
  }

  const isActive = run.status === "running" || run.status === "paused";
  const state = (run.current_state as {
    event_count?: number;
    action_count?: number;
  }) || {};

  return (
    <AppShell>
      <div className="p-8 max-w-7xl w-full mx-auto space-y-6">
        {/* Navigation back button */}
        <div>
          <Link
            href="/runs"
            className="inline-flex items-center gap-1 text-xs text-[#888892] hover:text-text font-medium transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Schedules & Runs
          </Link>
        </div>

        {/* Page Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-text tracking-tight">
                Order {run.order_id}
              </h1>
              <StatusBadge status={run.status} />
            </div>
            <div className="flex items-center gap-3 text-xs text-[#888892] mt-1">
              <span>Created {formatRelative(run.created_at)}</span>
              {run.next_wake_up_at && isActive && (
                <>
                  <span>•</span>
                  <span>Next wake {formatRelative(run.next_wake_up_at)}</span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {run.status === "running" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => interrupt.mutate(run.id)}
                disabled={interrupt.isPending}
                className="bg-[#141418] border-[#1c1c24] text-text"
              >
                Pause
              </Button>
            )}

            {run.status === "paused" && (
              <Button
                size="sm"
                onClick={() => resume.mutate(run.id)}
                disabled={resume.isPending}
                className="bg-[#1f1f26] border border-[#2a2a34] text-text"
              >
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
                Terminate
              </Button>
            )}
          </div>
        </div>

        {/* KPI Metrics Row */}
        <div className="grid grid-cols-3 gap-4 text-xs">
          <div className="rounded-lg border border-[#1c1c24] bg-[#141418] p-4">
            <span className="text-[11px] font-medium uppercase tracking-wider text-[#888892] block mb-1">
              Events Ingested
            </span>
            <span className="text-xl font-bold text-text">
              {state.event_count ?? (timeline?.length || 0)}
            </span>
          </div>

          <div className="rounded-lg border border-[#1c1c24] bg-[#141418] p-4">
            <span className="text-[11px] font-medium uppercase tracking-wider text-[#888892] block mb-1">
              Tool Actions Executed
            </span>
            <span className="text-xl font-bold text-text">
              {state.action_count ?? (actions?.length || 0)}
            </span>
          </div>

          <div className="rounded-lg border border-[#1c1c24] bg-[#141418] p-4">
            <span className="text-[11px] font-medium uppercase tracking-wider text-[#888892] block mb-1">
              Instructions Added
            </span>
            <span className="text-xl font-bold text-text">
              {instructions?.length ?? 0}
            </span>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="border-b border-[#1c1c24] pb-2">
          <div className="flex items-center gap-1 rounded-lg border border-[#1c1c24] bg-[#141418] p-0.5 text-xs w-fit">
            {[
              { id: "timeline", label: `Timeline (${timeline?.length || 0})` },
              { id: "memory", label: "Memory Summary" },
              { id: "actions", label: `Activity History (${actions?.length || 0})` },
              { id: "events", label: "Inject Event" },
              { id: "instructions", label: `Run Instructions (${instructions?.length || 0})` },
              { id: "final", label: "Final Report & Learnings" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-md px-3.5 py-1.5 font-medium transition-colors ${
                  activeTab === tab.id
                    ? "bg-[#22222a] text-text shadow-sm"
                    : "text-[#888892] hover:text-text"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Contents */}
        <div className="pt-2">
          {activeTab === "timeline" && <Timeline events={timeline ?? []} />}

          {activeTab === "memory" && <MemoryViewer memory={memory} />}

          {activeTab === "actions" && <ActionsList actions={actions ?? []} />}

          {activeTab === "events" &&
            (isActive ? (
              <EventInjector runId={run.id} />
            ) : (
              <div className="py-8 text-center text-xs text-[#888892] border border-[#1c1c24] rounded-lg bg-[#141418]">
                This run is not active. Events can only be injected into running or paused runs.
              </div>
            ))}

          {activeTab === "instructions" && <InstructionPanel runId={run.id} />}

          {activeTab === "final" &&
            (run.final_output ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-text">
                    Final Workflow Summary Report
                  </span>
                  <div className="flex items-center rounded-md border border-[#1c1c24] bg-[#141418] p-0.5 text-[11px]">
                    <button
                      onClick={() => setFinalViewMode("human")}
                      className={`rounded px-2.5 py-1 font-medium transition-colors ${
                        finalViewMode === "human"
                          ? "bg-[#22222a] text-text"
                          : "text-[#888892] hover:text-text"
                      }`}
                    >
                      Human View
                    </button>
                    <button
                      onClick={() => setFinalViewMode("json")}
                      className={`rounded px-2.5 py-1 font-mono transition-colors ${
                        finalViewMode === "json"
                          ? "bg-[#22222a] text-text"
                          : "text-[#888892] hover:text-text"
                      }`}
                    >
                      {"{ } Raw JSON"}
                    </button>
                  </div>
                </div>

                {finalViewMode === "human" ? (
                  <div className="rounded-lg border border-[#1c1c24] bg-[#141418] p-5 text-xs text-text space-y-3">
                    <p className="font-semibold text-sm leading-relaxed">
                      {String((run.final_output as any).summary || "Workflow completed.")}
                    </p>
                    <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#1c1c24] text-[#888892]">
                      <div>Total Events Processed: <strong className="text-text">{String((run.final_output as any).total_events ?? 0)}</strong></div>
                      <div>Total Actions Executed: <strong className="text-text">{String((run.final_output as any).total_actions ?? 0)}</strong></div>
                    </div>
                  </div>
                ) : (
                  <pre className="overflow-x-auto rounded-lg border border-[#1c1c24] bg-[#0a0a0c] p-4 font-mono text-xs text-[#888892]">
                    {prettyJson(run.final_output)}
                  </pre>
                )}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-[#888892] border border-[#1c1c24] rounded-lg bg-[#141418]">
                No final report generated yet. The workflow produces a summary on completion or termination.
              </div>
            ))}
        </div>
      </div>
    </AppShell>
  );
}