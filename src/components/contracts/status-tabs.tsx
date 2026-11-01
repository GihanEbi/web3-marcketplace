"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export interface StatusTabItem<T extends string> {
  value: T;
  label: string;
  count?: number;
}

interface StatusTabsProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  tabs: StatusTabItem<T>[];
}

/** Horizontally scrollable tab strip with optional count chips (tabs only; the page renders the content). */
export function StatusTabs<T extends string>({ value, onChange, tabs }: StatusTabsProps<T>) {
  return (
    <div className="max-w-full overflow-x-auto pb-1">
      <Tabs value={value} onValueChange={(next) => onChange(next as T)}>
        <TabsList className="w-max">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="px-3">
              {tab.label}
              {tab.count !== undefined && (
                <span className="rounded-full bg-foreground/10 px-1.5 text-[11px] leading-4 tabular-nums">{tab.count}</span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
}
