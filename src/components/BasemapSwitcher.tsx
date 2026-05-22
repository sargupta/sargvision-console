"use client";

import { Globe, Layers, Map as MapIcon } from "lucide-react";

import { cn } from "@/lib/cn";
import type { BasemapId } from "@/lib/basemaps";

const ITEMS: { id: BasemapId; label: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "satellite", label: "SAT", Icon: Globe },
  { id: "dark", label: "DARK", Icon: Layers },
  { id: "bhuvan", label: "BHUVAN", Icon: MapIcon },
];

interface Props {
  value: BasemapId;
  onChange: (id: BasemapId) => void;
}

export function BasemapSwitcher({ value, onChange }: Props) {
  return (
    <div className="pointer-events-auto absolute right-3 top-16 z-10 flex flex-col gap-0.5 rounded-[2px] border border-[var(--color-line)] bg-[var(--color-canvas)]/85 p-1 font-mono text-[10px] uppercase tracking-[0.18em] backdrop-blur-sm">
      {ITEMS.map(({ id, label, Icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          className={cn(
            "flex items-center gap-2 px-2 py-1.5 transition-colors",
            value === id
              ? "bg-[var(--color-friend)]/15 text-[var(--color-friend)]"
              : "text-[var(--color-text-dim)] hover:bg-[var(--color-elevated)]/60 hover:text-[var(--color-text)]",
          )}
        >
          <Icon className="h-3 w-3" />
          {label}
        </button>
      ))}
    </div>
  );
}
