"use client";

import { formatRelative } from "@/lib/utils";
import type { MemoryResponse } from "@/lib/types";

export function MemoryViewer({ memory }: { memory: MemoryResponse | undefined }) {
  if (!memory) {
    return (
      <div className="py-12 text-center text-xs text-[#888892] border border-[#1c1c24] rounded-lg bg-[#141418]">
        No memory snapshot generated yet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Compact Summary Prose Card */}
      <div className="rounded-lg border border-[#1c1c24] bg-[#141418] p-4 text-xs">
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[#888892]">
          Memory Summary Report
        </div>
        {memory.compact_summary ? (
          <p className="text-text leading-relaxed font-medium">
            {memory.compact_summary}
          </p>
        ) : (
          <p className="text-[#888892]">
            No summary generated yet.
          </p>
        )}
      </div>

      {/* State Metadata Row */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="rounded-lg border border-[#1c1c24] bg-[#141418] p-4">
          <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-[#888892]">
            Current State
          </div>
          <p className="font-semibold text-text capitalize">{memory.sleep_state}</p>
        </div>
        <div className="rounded-lg border border-[#1c1c24] bg-[#141418] p-4">
          <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-[#888892]">
            Next Automated Wake-up
          </div>
          <p className="font-semibold text-text">
            {memory.next_wake_up ? formatRelative(memory.next_wake_up) : "—"}
          </p>
        </div>
      </div>
    </div>
  );
}