import { Settings } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";

export default function SettingsPage() {
  return (
    <AppShell>
      <PageHeader
        title="Settings"
        description="Configuration for the Order Supervisor application"
      />
      <div className="px-8 pb-10">
        <EmptyState
          icon={Settings}
          title="Settings coming soon"
          description="This POC does not include a settings panel. Configure the backend via the .env file."
        />
      </div>
    </AppShell>
  );
}