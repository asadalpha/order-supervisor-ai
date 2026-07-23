"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface TabsProps {
  tabs: { value: string; label: string; content: ReactNode }[];
  defaultValue?: string;
  className?: string;
}

export function Tabs({ tabs, defaultValue, className }: TabsProps) {
  const [value, setValue] = useState(defaultValue ?? tabs[0]?.value);
  const active = tabs.find((t) => t.value === value) ?? tabs[0];

  return (
    <div className={cn("flex flex-col", className)}>
      <div className="flex items-center gap-1 border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setValue(tab.value)}
            className={cn(
              "relative px-3.5 py-2.5 text-sm font-medium transition-colors",
              tab.value === value
                ? "text-text"
                : "text-text-muted hover:text-text",
            )}
          >
            {tab.label}
            {tab.value === value && (
              <span className="absolute inset-x-0 -bottom-px h-px bg-accent" />
            )}
          </button>
        ))}
      </div>
      <div className="flex-1 pt-4">{active?.content}</div>
    </div>
  );
}