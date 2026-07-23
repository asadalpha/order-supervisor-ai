"use client";

import Link from "next/link";
import { Plus, Bot } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { SupervisorCard } from "@/components/supervisors/supervisor-card";
import { useSupervisors } from "@/hooks/use-supervisors";

export default function SupervisorsPage() {
  const { data: supervisors, isLoading } = useSupervisors();

  return (
    <AppShell>
      <PageHeader
        title="Supervisors"
        description="Reusable supervisor templates that define agent behaviour"
        action={
          <Link href="/supervisors/new">
            <Button>
              <Plus className="h-3.5 w-3.5" />
              New Supervisor
            </Button>
          </Link>
        }
      />

      <div className="px-8 pb-10">
        {isLoading ? (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-32 animate-pulse rounded-lg border border-border bg-surface"
              />
            ))}
          </div>
        ) : !supervisors?.length ? (
          <EmptyState
            icon={Bot}
            title="No supervisors configured"
            description="Create a supervisor template to define how the AI agent should behave."
            action={
              <Link href="/supervisors/new">
                <Button size="sm">
                  <Plus className="h-3.5 w-3.5" />
                  Create Supervisor
                </Button>
              </Link>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {supervisors.map((sup) => (
              <SupervisorCard key={sup.id} supervisor={sup} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}