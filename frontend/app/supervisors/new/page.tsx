import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { SupervisorForm } from "@/components/supervisors/supervisor-form";

export default function NewSupervisorPage() {
  return (
    <AppShell>
      <PageHeader
        title="New Supervisor"
        description="Define a reusable supervisor template"
        action={
          <Link href="/supervisors">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </Button>
          </Link>
        }
      />
      <div className="max-w-2xl px-8 pb-10">
        <SupervisorForm />
      </div>
    </AppShell>
  );
}