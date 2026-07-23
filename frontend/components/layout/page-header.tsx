import type { ReactNode } from "react";

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 px-8 py-6">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold text-text">{title}</h1>
        {description && (
          <div className="text-sm text-text-muted">{description}</div>
        )}
      </div>
      {action}
    </div>
  );
}