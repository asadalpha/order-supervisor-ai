"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Plus } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
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
        <div className="p-8 text-center text-xs text-[#888892]">
          Loading supervisor template…
        </div>
      </AppShell>
    );
  }

  if (!supervisor) {
    return (
      <AppShell>
        <div className="p-8 max-w-5xl mx-auto space-y-4 text-xs">
          <Link
            href="/supervisors"
            className="inline-flex items-center gap-1 text-[#888892] hover:text-text"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Supervisors
          </Link>
          <p className="text-text font-semibold">Supervisor Not Found.</p>
        </div>
      </AppShell>
    );
  }

  const supervisorRuns =
    allRuns?.filter((r) => r.supervisor_id === supervisor.id) || [];

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
      // Handled in mutation
    }
  };

  return (
    <AppShell>
      <div className="p-8 max-w-7xl w-full mx-auto space-y-6">
        <div>
          <Link
            href="/supervisors"
            className="inline-flex items-center gap-1 text-xs text-[#888892] hover:text-text font-medium transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Supervisors
          </Link>
        </div>

        {/* Page Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text tracking-tight">
              {supervisor.name}
            </h1>
            <p className="text-xs text-[#888892] mt-1">
              Created {formatRelative(supervisor.created_at)} • Updated{" "}
              {formatRelative(supervisor.updated_at)}
            </p>
          </div>

          <Button
            size="sm"
            onClick={() => setShowStartRun(!showStartRun)}
            className="bg-[#1f1f26] border border-[#2a2a34] text-text hover:bg-[#282834]"
          >
            <Plus className="h-3.5 w-3.5" />
            Start Order Run
          </Button>
        </div>

        {/* Start Run Drawer */}
        {showStartRun && (
          <form
            onSubmit={handleStartRun}
            className="rounded-lg border border-[#1c1c24] bg-[#141418] p-5 text-xs space-y-4"
          >
            <h3 className="font-bold text-text">Launch New Order Run</h3>
            <div>
              <label className="block text-[#888892] font-semibold mb-1">
                Order ID
              </label>
              <input
                type="text"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                placeholder="e.g. ORD-9988"
                className="w-full rounded-lg border border-[#1c1c24] bg-[#0a0a0c] px-3 py-2 text-xs text-text focus:border-[#2a2a34] focus:outline-none"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowStartRun(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={createRun.isPending || !orderId.trim()}
                className="bg-[#1f1f26] text-text border border-[#2a2a34]"
              >
                {createRun.isPending ? "Starting…" : "Launch Workflow"}
              </Button>
            </div>
          </form>
        )}

        {/* Configuration Details Grid */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 text-xs">
          <div className="lg:col-span-2 rounded-lg border border-[#1c1c24] bg-[#141418] p-5 space-y-4">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#888892] block mb-1">
                System Directive & Base Instruction
              </span>
              <p className="text-text leading-relaxed font-medium">
                {supervisor.base_instruction}
              </p>
            </div>

            {supervisor.wake_up_guidance && (
              <div className="pt-3 border-t border-[#1c1c24]">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#888892] block mb-1">
                  Classifier & Wake-up Guidance
                </span>
                <p className="text-text leading-relaxed font-medium">
                  {supervisor.wake_up_guidance}
                </p>
              </div>
            )}
          </div>

          <div className="rounded-lg border border-[#1c1c24] bg-[#141418] p-5 space-y-4">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#888892] block mb-2">
                Enabled Tool Dispatches ({supervisor.available_tools.length})
              </span>
              <div className="flex flex-wrap gap-1.5">
                {supervisor.available_tools.map((tool) => (
                  <span
                    key={tool}
                    className="rounded-md border border-[#1c1c24] bg-[#0a0a0c] px-2.5 py-1 font-mono text-[11px] text-[#888892]"
                  >
                    {tool}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Associated Runs Table */}
        <div className="space-y-3 pt-2">
          <h2 className="text-sm font-bold text-text">
            Runs Powered by {supervisor.name} ({supervisorRuns.length})
          </h2>

          {supervisorRuns.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#888892] border border-[#1c1c24] rounded-lg bg-[#141418]">
              No runs have been launched with this supervisor template yet.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-[#1c1c24] bg-[#141418]">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#1c1c24] text-[#656570] font-medium text-[11px]">
                    <th className="py-3 px-4">Order ID</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Events / Actions</th>
                    <th className="py-3 px-4">Created Date</th>
                    <th className="py-3 pr-4 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1c1c24]">
                  {supervisorRuns.map((run) => {
                    const st = (run.current_state as {
                      event_count?: number;
                      action_count?: number;
                    }) || {};

                    return (
                      <tr
                        key={run.id}
                        className="transition-colors hover:bg-[#181820]"
                      >
                        <td className="py-3.5 px-4 font-semibold text-text">
                          Order {run.order_id}
                        </td>
                        <td className="py-3.5 px-4">
                          <StatusBadge status={run.status} />
                        </td>
                        <td className="py-3.5 px-4 text-[#888892]">
                          {st.event_count ?? 0} Events • {st.action_count ?? 0}{" "}
                          Actions
                        </td>
                        <td className="py-3.5 px-4 text-[#656570]">
                          {formatRelative(run.created_at)}
                        </td>
                        <td className="py-3.5 pr-4 text-right">
                          <Link
                            href={`/runs/${run.id}`}
                            className="inline-flex items-center gap-1 text-xs text-[#888892] hover:text-text font-medium"
                          >
                            View
                            <ArrowRight className="h-3 w-3" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
