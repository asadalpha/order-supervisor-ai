"use client";

import { useState } from "react";
import { Plus, SlidersHorizontal, Search, CheckSquare, Square as SquareIcon, ArrowRight } from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import { StartRunDialog } from "@/components/runs/start-run-dialog";
import { useRuns } from "@/hooks/use-runs";
import type { RunStatus } from "@/lib/types";

export default function RunsPage() {
  const [filter, setFilter] = useState<RunStatus | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showStart, setShowStart] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const { data: runs, isLoading } = useRuns(
    filter === "all" ? undefined : filter,
  );

  const filteredRuns = (runs ?? []).filter((r) =>
    searchQuery
      ? r.order_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.id.toLowerCase().includes(searchQuery.toLowerCase())
      : true,
  );

  const toggleSelectAll = () => {
    if (!filteredRuns) return;
    if (selectedIds.length === filteredRuns.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredRuns.map((r) => r.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  return (
    <AppShell>
      <div className="p-8 max-w-7xl w-full mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text tracking-tight">Supervision Runs</h1>
            <p className="text-xs text-[#888892] mt-1">
              Audit log of all order supervisor runs and executions
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => setShowStart(true)}
              size="sm"
              className="bg-[#1f1f26] border border-[#2a2a34] text-text hover:bg-[#282834] transition-all duration-200"
            >
              <Plus className="h-3.5 w-3.5" />
              Start Run
            </Button>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex items-center justify-between gap-4 pt-2">
          <div className="flex items-center gap-3">
            <div className="flex items-center rounded-lg border border-[#1c1c24] bg-[#141418] p-0.5 text-xs">
              {[
                { label: "All", value: "all" },
                { label: "Active", value: "running" },
                { label: "Paused", value: "paused" },
                { label: "Complete", value: "completed" },
                { label: "Terminated", value: "terminated" },
              ].map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setFilter(tab.value as RunStatus | "all")}
                  className={`rounded-md px-3 py-1.5 font-medium transition-all duration-200 ${
                    filter === tab.value
                      ? "bg-[#22222a] text-text shadow-sm"
                      : "text-[#888892] hover:text-text"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <button className="flex items-center gap-1.5 rounded-lg border border-[#1c1c24] bg-[#141418] px-3 py-1.5 text-xs font-medium text-[#888892] hover:text-text transition-colors">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span>Filters</span>
            </button>
          </div>

          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#656570]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search runs..."
              className="h-8 w-full rounded-lg border border-[#1c1c24] bg-[#141418] pl-9 pr-3 text-xs text-text placeholder:text-[#656570] focus:border-[#2a2a34] focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* Data Table */}
        <div className="w-full border-t border-[#1c1c24] pt-2">
          {isLoading ? (
            <div className="py-12 text-center text-xs text-[#888892]">
              Loading workflow runs…
            </div>
          ) : filteredRuns.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-xs text-[#888892]">No supervision runs found.</p>
              <Button
                onClick={() => setShowStart(true)}
                size="sm"
                className="mt-3 bg-[#1f1f26] border border-[#2a2a34] text-text"
              >
                <Plus className="h-3.5 w-3.5" />
                Start Run
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#1c1c24] text-[#656570] font-medium text-[11px]">
                    <th className="py-3 pl-2 pr-2 w-8">
                      <button
                        onClick={toggleSelectAll}
                        className="text-[#656570] hover:text-text transition-colors"
                      >
                        {selectedIds.length === filteredRuns.length && filteredRuns.length > 0 ? (
                          <CheckSquare className="h-3.5 w-3.5 text-blue-400" />
                        ) : (
                          <SquareIcon className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </th>
                    <th className="py-3 px-3">Order ID</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Supervisor</th>
                    <th className="py-3 px-3">Events / Actions</th>
                    <th className="py-3 px-3">Start Date</th>
                    <th className="py-3 pr-2 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1c1c24]">
                  {filteredRuns.map((run) => {
                    const isSelected = selectedIds.includes(run.id);
                    const state = (run.current_state as {
                      event_count?: number;
                      action_count?: number;
                    }) || {};

                    const formattedDate = new Date(run.created_at).toLocaleDateString("en-US", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    });

                    return (
                      <tr
                        key={run.id}
                        className={`group transition-all duration-200 hover:bg-[#161622] ${
                          isSelected ? "bg-[#181826]" : ""
                        }`}
                      >
                        <td className="py-3.5 pl-2 pr-2">
                          <button
                            onClick={() => toggleSelect(run.id)}
                            className="text-[#656570] hover:text-text transition-colors"
                          >
                            {isSelected ? (
                              <CheckSquare className="h-3.5 w-3.5 text-blue-400" />
                            ) : (
                              <SquareIcon className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </td>

                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1e1e28] text-blue-400 font-bold text-[10px] border border-[#262638] group-hover:border-blue-500/30 transition-colors">
                              G
                            </div>
                            <span className="font-semibold text-text group-hover:text-blue-400 transition-colors">
                              Order {run.order_id}
                            </span>
                          </div>
                        </td>

                        <td className="py-3.5 px-3">
                          <StatusBadge status={run.status} />
                        </td>

                        <td className="py-3.5 px-3 text-[#888892]">
                          {run.supervisor?.name || "Default Supervisor"}
                        </td>

                        <td className="py-3.5 px-3 text-[#888892]">
                          <span className="text-blue-400 font-medium">{state.event_count ?? 0}</span> Events
                          <span className="text-[#444450] mx-1.5">•</span>
                          <span className="text-purple-400 font-medium">{state.action_count ?? 0}</span> Actions
                        </td>

                        <td className="py-3.5 px-3 text-[#888892]">
                          {formattedDate}
                        </td>

                        <td className="py-3.5 pr-2 text-right">
                          <Link
                            href={`/runs/${run.id}`}
                            className="inline-flex items-center gap-1 text-xs text-[#888892] group-hover:text-blue-400 font-medium transition-colors"
                          >
                            View
                            <ArrowRight className="h-3 w-3 transform group-hover:translate-x-0.5 transition-transform" />
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

      {showStart && <StartRunDialog onClose={() => setShowStart(false)} />}
    </AppShell>
  );
}