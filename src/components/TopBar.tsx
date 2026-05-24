"use client";

import { Crosshair, Radio, ShieldAlert, Wifi, WifiOff, ZapOff } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/cn";
import { useSwarmStore } from "@/lib/store";
import { MissionPicker } from "./MissionPicker";
import { VyuhaSelector } from "./VyuhaSelector";

const HTTP_URL = process.env.NEXT_PUBLIC_SWARM_HTTP_URL ?? "http://127.0.0.1:8765";

export function TopBar() {
  const connected = useSwarmStore((s) => s.connected);
  const frame = useSwarmStore((s) => s.frame);
  const n = frame?.drones.length ?? 0;
  const t = frame?.t ?? 0;
  const msgs = frame?.stats.total_msgs ?? 0;
  const mps = frame?.stats.msgs_per_s ?? 0;
  const threat = frame?.threat;
  const jamming = !!frame?.flags?.jamming;
  const gnss = !!frame?.flags?.gnss_denied;

  const [busy, setBusy] = useState(false);

  async function toggleJam() {
    setBusy(true);
    try {
      await fetch(`${HTTP_URL}/jam`, { method: "POST" });
    } finally {
      setBusy(false);
    }
  }
  async function toggleGnss() {
    setBusy(true);
    try {
      await fetch(`${HTTP_URL}/gnss/toggle`, { method: "POST" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-40 flex items-center justify-between gap-2 border-b border-[var(--color-line)] bg-[var(--color-canvas)]/85 px-2 md:px-4 py-2 backdrop-blur-sm">
      <div className="flex items-center gap-1.5 md:gap-3 min-w-0">
        <ShieldAlert className="h-5 w-5 shrink-0 text-[var(--color-friend)]" aria-hidden />
        <div className="hidden md:block font-mono text-[13px] tracking-[0.18em] text-[var(--color-text)]">
          SARGVISION · SWARM
        </div>
        <div className="md:hidden font-mono text-[11px] tracking-[0.18em] text-[var(--color-text)]">
          SARGVISION
        </div>
        <span className="hidden md:inline-block h-4 w-px bg-[var(--color-line)]" />
        <MissionPicker />
        <span className="hidden md:inline-block"><VyuhaSelector /></span>
        {threat && (
          <span className="pointer-events-auto inline-flex items-center gap-1 md:gap-1.5 rounded-[2px] border border-[var(--color-hostile)]/40 bg-[var(--color-hostile)]/8 px-1.5 md:px-2 py-0.5 md:py-1 font-mono text-[9px] md:text-[10px] uppercase tracking-[0.12em] md:tracking-[0.18em] text-[var(--color-hostile)]">
            <Crosshair className="h-3 w-3" />
            <span className="hidden sm:inline">HOSTILES</span>
            <span className="tabular-nums text-[var(--color-text)]">
              {String(threat.remaining).padStart(2, "0")}/{String(threat.total).padStart(2, "0")}
            </span>
            <span className="text-[var(--color-status-ok)]">· {threat.neutralized}</span>
            {(threat.impacted ?? 0) > 0 && (
              <span className="text-[var(--color-status-crit)]">· LEAK {threat.impacted}</span>
            )}
          </span>
        )}
      </div>

      <div className="flex items-center gap-1.5 md:gap-3 font-mono text-[10px] md:text-[11px]">
        <span className="hidden md:inline-flex"><Stat label="T" value={`${t.toFixed(2)}s`} /></span>
        <span className="hidden md:inline-flex"><Stat label="N" value={n.toString().padStart(2, "0")} /></span>
        <span className="hidden md:inline-flex"><Stat label="MSGS" value={msgs.toLocaleString()} /></span>
        <span className="hidden lg:inline-flex"><Stat label="MPS" value={mps.toFixed(0)} /></span>

        <button
          type="button"
          onClick={toggleJam}
          disabled={busy}
          className={cn(
            "pointer-events-auto inline-flex items-center gap-1.5 rounded-[2px] border px-2 py-0.5 uppercase tracking-[0.18em] transition-colors",
            jamming
              ? "border-[var(--color-hostile)]/60 bg-[var(--color-hostile)]/15 text-[var(--color-hostile)]"
              : "border-[var(--color-line)] text-[var(--color-text-dim)] hover:border-[var(--color-status-warn)]/40 hover:text-[var(--color-status-warn)]",
          )}
          title="Toggle EW jamming — halves comm range"
        >
          <ZapOff className="h-3 w-3" />
          <span className="hidden sm:inline">{jamming ? "JAMMED" : "JAM"}</span>
        </button>
        <button
          type="button"
          onClick={toggleGnss}
          disabled={busy}
          className={cn(
            "pointer-events-auto inline-flex items-center gap-1.5 rounded-[2px] border px-2 py-0.5 uppercase tracking-[0.18em] transition-colors",
            gnss
              ? "border-[var(--color-status-warn)]/60 bg-[var(--color-status-warn)]/15 text-[var(--color-status-warn)]"
              : "border-[var(--color-line)] text-[var(--color-text-dim)] hover:border-[var(--color-status-warn)]/40 hover:text-[var(--color-status-warn)]",
          )}
          title="Toggle GNSS-denied mode — drones flip to vision SLAM"
        >
          <Radio className="h-3 w-3" />
          <span className="hidden sm:inline">{gnss ? "GNSS-DENIED" : "GNSS-OK"}</span>
        </button>

        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-[2px] border px-2 py-0.5 uppercase tracking-[0.18em]",
            connected
              ? "border-[var(--color-status-ok)]/30 text-[var(--color-status-ok)]"
              : "border-[var(--color-status-crit)]/40 text-[var(--color-status-crit)]",
          )}
        >
          {connected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
          <span className="hidden sm:inline">{connected ? "LINK UP" : "LINK DOWN"}</span>
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
