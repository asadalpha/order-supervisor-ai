"use client";

import { Card } from "@/components/ui/card";
import { CheckCircle2, PauseCircle, PlayCircle, XCircle } from "lucide-react";

export function StatusDistribution({
  running = 0,
  paused = 0,
  completed = 0,
  terminated = 0,
}: {
  running?: number;
  paused?: number;
  completed?: number;
  terminated?: number;
}) {
  const total = running + paused + completed + terminated || 1;
  const runningPct = Math.round((running / total) * 100);
  const pausedPct = Math.round((paused / total) * 100);
  const completedPct = Math.round((completed / total) * 100);
  const terminatedPct = Math.round((terminated / total) * 100);

  const successRate = Math.round(((completed + running) / total) * 100);

  return (
    <Card className="flex flex-col justify-between p-5 bg-[#111118] border-[#1e1e2a] rounded-2xl">
      <div>
        <div className="flex items-center justify-between pb-2">
          <span className="text-xs uppercase tracking-wider text-text-dim font-medium">
            Run Success Rate
          </span>
          <span className="text-xs font-semibold text-emerald-400">
            {successRate}% Health Rate
          </span>
        </div>

        {/* Circular Gauge / Percentage Banner */}
        <div className="my-3 flex items-center justify-between rounded-xl bg-[#09090d] p-4 border border-[#1e1e2a]">
          <div>
            <p className="text-3xl font-bold text-text">{successRate}%</p>
            <p className="text-xs text-text-muted mt-0.5">Successful or Active Supervisors</p>
          </div>
          {/* Radial meter SVG */}
          <div className="relative h-14 w-14 flex items-center justify-center">
            <svg className="h-full w-full transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-[#1e1e2a]"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-emerald-400 transition-all duration-700 ease-out"
                strokeDasharray={`${successRate}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
          </div>
        </div>

        {/* Multi-segment stacked progress bar */}
        <div className="space-y-1.5 pt-1">
          <div className="flex justify-between text-xs text-text-dim">
            <span>Status Breakdown</span>
            <span>{total} Total Runs</span>
          </div>
          <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-[#1e1e2a]">
            {runningPct > 0 && (
              <div
                style={{ width: `${runningPct}%` }}
                className="bg-emerald-500 transition-all"
                title={`Running: ${running}`}
              />
            )}
            {pausedPct > 0 && (
              <div
                style={{ width: `${pausedPct}%` }}
                className="bg-amber-500 transition-all"
                title={`Paused: ${paused}`}
              />
            )}
            {completedPct > 0 && (
              <div
                style={{ width: `${completedPct}%` }}
                className="bg-indigo-500 transition-all"
                title={`Completed: ${completed}`}
              />
            )}
            {terminatedPct > 0 && (
              <div
                style={{ width: `${terminatedPct}%` }}
                className="bg-rose-500 transition-all"
                title={`Terminated: ${terminated}`}
              />
            )}
          </div>
        </div>
      </div>

      {/* Legend list */}
      <div className="grid grid-cols-2 gap-2 pt-4 border-t border-[#1e1e2a] text-xs">
        <div className="flex items-center gap-2">
          <PlayCircle className="h-3.5 w-3.5 text-emerald-400" />
          <span className="text-text-muted">Running:</span>
          <span className="font-semibold text-text">{running}</span>
        </div>
        <div className="flex items-center gap-2">
          <PauseCircle className="h-3.5 w-3.5 text-amber-400" />
          <span className="text-text-muted">Paused:</span>
          <span className="font-semibold text-text">{paused}</span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-3.5 w-3.5 text-indigo-400" />
          <span className="text-text-muted">Completed:</span>
          <span className="font-semibold text-text">{completed}</span>
        </div>
        <div className="flex items-center gap-2">
          <XCircle className="h-3.5 w-3.5 text-rose-400" />
          <span className="text-text-muted">Terminated:</span>
          <span className="font-semibold text-text">{terminated}</span>
        </div>
      </div>
    </Card>
  );
}
