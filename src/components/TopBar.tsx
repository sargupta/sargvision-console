"use client";

import { ShieldAlert, Wifi, WifiOff } from "lucide-react";

import { cn } from "@/lib/cn";
import { useSwarmStore } from "@/lib/store";
import { MissionPicker } from "./MissionPicker";

export function TopBar() {
  const connected = useSwarmStore((s) => s.connected);
  const frame = useSwarmStore((s) => s.frame);
  const n = frame?.drones.length ?? 0;
  const t = frame?.t ?? 0;
  const msgs = frame?.stats.total_msgs ?? 0;
  const mps = frame?.stats.msgs_per_s ?? 0;

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-between gap-3 border-b border-[var(--color-line)] bg-[var(--color-canvas)]/85 px-4 py-2 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <ShieldAlert
          className="h-5 w-5 text-[var(--color-friend)]"
          aria-hidden
        />
        <div className="font-mono text-[13px] tracking-[0.18em] text-[var(--color-text)]">
          SARGVISION · SWARM
        </div>
        <span className="h-4 w-px bg-[var(--color-line)]" />
        <MissionPicker />
      </div>

      <div className="flex items-center gap-5 font-mono text-[11px]">
        <Stat label="T" value={`${t.toFixed(2)}s`} />
        <Stat label="N" value={n.toString().padStart(2, "0")} />
        <Stat label="MSGS" value={msgs.toLocaleString()} />
        <Stat label="MPS" value={mps.toFixed(0)} />
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-[2px] border px-2 py-0.5 uppercase tracking-[0.18em]",
            connected
              ? "border-[var(--color-status-ok)]/30 text-[var(--color-status-ok)]"
              : "border-[var(--color-status-crit)]/40 text-[var(--color-status-crit)]",
          )}
        >
          {connected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
          {connected ? "LINK UP" : "LINK DOWN"}
        </span>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="uppercase tracking-[0.18em] text-[var(--color-text-vdim)]">
        {label}
      </span>
      <span className="tabular-nums text-[var(--color-text)]">{value}</span>
    </div>
  );
}
