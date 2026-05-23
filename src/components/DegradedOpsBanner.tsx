"use client";

import { AlertOctagon, Radio, ZapOff } from "lucide-react";

import { cn } from "@/lib/cn";
import { useSwarmStore } from "@/lib/store";

export function DegradedOpsBanner() {
  const flags = useSwarmStore((s) => s.frame?.flags);
  const jam = !!flags?.jamming;
  const gnss = !!flags?.gnss_denied;
  if (!jam && !gnss) return null;

  const tier =
    jam && gnss
      ? { label: "DEGRADED OPS — EW JAM + GNSS DENIED", color: "var(--color-hostile)" }
      : jam
        ? { label: "JAMMING ACTIVE — comm range halved · swarm slowed 55%", color: "var(--color-status-warn)" }
        : { label: "GNSS DENIED — drones blind, vision-SLAM drift +", color: "var(--color-status-caution)" };

  return (
    <div
      className={cn(
        "pointer-events-none absolute left-1/2 z-30 -translate-x-1/2 inline-flex items-center gap-2 rounded-[2px] border bg-[var(--color-canvas)]/95 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.22em] backdrop-blur-sm",
        "top-12",
      )}
      style={{ borderColor: `${tier.color}80`, color: tier.color }}
    >
      <AlertOctagon className="h-3.5 w-3.5 animate-pulse" />
      {tier.label}
      <span className="ml-2 inline-flex items-center gap-2">
        {jam && <ZapOff className="h-3 w-3" />}
        {gnss && <Radio className="h-3 w-3" />}
      </span>
    </div>
  );
}
