"use client";

import Link from "next/link";
import { Plus, ArrowRight } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { useSupervisors } from "@/hooks/use-supervisors";
import { formatRelative, truncate } from "@/lib/utils";

export default function SupervisorsPage() {
  const { data: supervisors, isLoading } = useSupervisors();

  return (
    <AppShell>
      <div className="p-8 max-w-7xl w-full mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text tracking-tight">Supervisors</h1>
            <p className="text-xs text-[#888892] mt-1">
              Reusable supervisor configuration templates that define agent behaviors
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/supervisors/new">
              <Button
                size="sm"
                className="bg-[#1f1f26] border border-[#2a2a34] text-text hover:bg-[#282834]"
              >
                <Plus className="h-3.5 w-3.5" />
                New Supervisor
              </Button>
            </Link>
          </div>
        </div>

        {/* Supervisors Grid */}
        <div className="border-t border-[#1c1c24] pt-4">
          {isLoading ? (
            <div className="py-12 text-center text-xs text-[#888892]">
              Loading supervisor templates…
            </div>
          ) : !supervisors?.length ? (
            <div className="py-16 text-center">
              <p className="text-xs text-[#888892]">No supervisors configured yet.</p>
              <Link href="/supervisors/new" className="inline-block mt-3">
                <Button size="sm" className="bg-[#1f1f26] border border-[#2a2a34] text-text">
                  <Plus className="h-3.5 w-3.5" />
                  Create Supervisor
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {supervisors.map((sup) => (
                <Link
                  key={sup.id}
                  href={`/supervisors/${sup.id}`}
                  className="block group"
                >
                  <div className="rounded-lg border border-[#1c1c24] bg-[#141418] p-5 text-xs space-y-3 transition-colors hover:bg-[#181820] hover:border-[#282834]">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-sm text-text group-hover:text-blue-400 transition-colors">
                        {sup.name}
                      </h3>
                      <span className="text-[11px] font-mono text-[#888892]">
                        {sup.available_tools.length} tools
                      </span>
                    </div>

                    <p className="text-[#888892] leading-relaxed line-clamp-2 font-normal">
                      {truncate(sup.base_instruction, 140)}
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-[#1c1c24]/60 text-[11px] text-[#656570]">
                      <span>Updated {formatRelative(sup.updated_at)}</span>
                      <span className="inline-flex items-center gap-1 text-text opacity-0 group-hover:opacity-100 transition-opacity">
                        View Config
                        <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}