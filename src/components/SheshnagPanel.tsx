"use client";

/** SHESHNAG — offensive psyops (Couzin-Krause + SIR contagion + PQ-CCE + Kuramoto).
 *
 *  Drives enemy swarm into MILLING-VORTEX attractor via spoofed-beacon
 *  fear-contagion broadcasts; gated by BFT (K=7) authorisation.
 *
 *  Phase classification:  POLARIZED (organised attack) → MILLING (broken) → SWARM
 *  Telemetry: polarisation P, rotation R, mean panic <I_j>, broadcasts emitted.
 */

import { Radio, Zap } from "lucide-react";

import { cn } from "@/lib/cn";
import { useSwarmStore } from "@/lib/store";
import type { SwarmPhase } from "@/lib/types";

const PHASE_COLOR: Record<SwarmPhase, string> = {
  POLARIZED: "var(--color-hostile)",
  MILLING: "#facc15",                       // amber-400 — vortex
  SWARM: "var(--color-text-dim)",
};

const PHASE_LABEL: Record<SwarmPhase, string> = {
  POLARIZED: "ENEMY POLARIZED — incoming",
  MILLING: "ENEMY MILLING — vortex locked",
  SWARM: "ENEMY DISORGANISED",
};

export function SheshnagPanel() {
  const sheshnag = useSwarmStore((s) => s.frame?.sheshnag);

  if (!sheshnag) {
    return (
      <div className="rounded-md border border-[--color-border-soft] bg-[--color-panel] p-3 text-xs text-[--color-text-vdim]">
        SHESHNAG: idle (no hostile contact)
      </div>
    );
  }

  const phase = sheshnag.phase;
  const panicPct = Math.round(sheshnag.mean_panic * 100);
  const fracPct = Math.round(sheshnag.fraction_panicked * 100);
  const auth = sheshnag.authorized;

  return (
    <div className="rounded-md border border-[--color-border-soft] bg-[--color-panel] p-3 text-[11px]">
      <header className="mb-2 flex items-center gap-2 text-[10px] uppercase tracking-widest text-[--color-text-dim]">
        <Radio className="h-3 w-3" /> SHESHNAG — Psyops Layer
        <span
          className={cn(
            "ml-auto rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider",
            auth
              ? "bg-[--color-status-ok]/20 text-[--color-status-ok]"
              : "bg-[--color-text-vdim]/15 text-[--color-text-vdim]",
          )}
        >
          {auth ? "AUTHORIZED" : "DISARMED"}
        </span>
      </header>

      {/* Enemy phase banner */}
      <div
        className="mb-2 rounded-sm border px-2 py-1.5 text-[10px] font-bold uppercase"
        style={{
          borderColor: PHASE_COLOR[phase],
          color: PHASE_COLOR[phase],
          background: `${PHASE_COLOR[phase]}1a`,
        }}
      >
        {PHASE_LABEL[phase]}
      </div>

      {/* Polarisation / rotation gauges */}
      <div className="mb-2 grid grid-cols-2 gap-1 text-[9px]">
        <div>
          <div className="flex justify-between text-[--color-text-vdim]">
            <span>polarisation P</span>
            <span className="font-mono">{sheshnag.polarization.toFixed(2)}</span>
          </div>
          <div className="mt-0.5 h-1 w-full rounded-sm bg-[--color-bg]">
            <div
              className="h-full rounded-sm bg-[--color-hostile]"
              style={{ width: `${Math.round(sheshnag.polarization * 100)}%` }}
            />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-[--color-text-vdim]">
            <span>rotation R</span>
            <span className="font-mono">{sheshnag.rotation.toFixed(2)}</span>
          </div>
          <div className="mt-0.5 h-1 w-full rounded-sm bg-[--color-bg]">
            <div
              className="h-full rounded-sm"
              style={{
                width: `${Math.round(sheshnag.rotation * 100)}%`,
                background: "#facc15",
              }}
            />
          </div>
        </div>
      </div>

      {/* Panic + broadcasts */}
      <div className="grid grid-cols-3 gap-1 border-t border-[--color-border-soft] pt-2 text-[9px]">
        <div className="text-center">
          <div className="text-[--color-text-vdim]">⟨panic⟩</div>
          <div className="font-mono">{panicPct}%</div>
        </div>
        <div className="text-center">
          <div className="text-[--color-text-vdim]">|panicked|</div>
          <div className="font-mono">{fracPct}%</div>
        </div>
        <div className="text-center">
          <div className="text-[--color-text-vdim] flex items-center justify-center gap-0.5">
            <Zap className="h-2.5 w-2.5" /> emit
          </div>
          <div className="font-mono">{sheshnag.broadcasts_emitted}</div>
        </div>
      </div>

      <div className="mt-2 text-[9px] text-[--color-text-vdim]">
        composite value{" "}
        <span className="font-mono text-[--color-text-dim]">
          {sheshnag.composite_value.toFixed(2)}
        </span>
        {" · beacons "}
        <span className="font-mono text-[--color-text-dim]">{sheshnag.beacons.length}</span>
      </div>
    </div>
  );
}
