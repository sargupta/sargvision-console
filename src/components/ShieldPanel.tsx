"use client";

/** SHIELD — Sheaf-Harmonic Identity & Engagement-Loyalty Defender.
 *
 * SARGVISION's first proprietary algorithm on top of public primitives.
 * Composes 5 layered defenses:
 *   1. Sheaf-Laplacian sensor cross-check  → per-drone LOYALTY
 *   2. Damped PageRank trust propagation   → per-drone TRUST
 *   3. Bayesian threat-class posterior      → per-hostile DECOY / KINETIC / NUISANCE
 *   4. Trust-weighted engagement auction    → ED-CBBA bids gated by SHIELD
 *   5. Kill-switch on sub-threshold trust   → hijacked friendlies dropped
 */

import { Activity, ShieldCheck, Skull, Target, Zap } from "lucide-react";

import { cn } from "@/lib/cn";
import { useSwarmStore } from "@/lib/store";
import type { ThreatClass } from "@/lib/types";

const HTTP_URL = process.env.NEXT_PUBLIC_SWARM_HTTP_URL ?? "http://127.0.0.1:8765";

const THREAT_COLOR: Record<ThreatClass, string> = {
  decoy: "var(--color-status-caution)",
  kinetic: "var(--color-hostile)",
  nuisance: "var(--color-text-dim)",
  unknown: "var(--color-text-vdim)",
};

const THREAT_LABEL: Record<ThreatClass, string> = {
  decoy: "DECOY",
  kinetic: "KINETIC",
  nuisance: "NUISANCE",
  unknown: "UNKNOWN",
};

export function ShieldPanel() {
  const shield = useSwarmStore((s) => s.frame?.shield);
  const flags = useSwarmStore((s) => s.frame?.flags);

  if (!shield) return null;

  const hijackActive = flags?.hijack_active ?? shield.hijack_active;
  const total = shield.loyal + shield.suspect + shield.hijacked + shield.kill_switched;
  const loyalPct = total > 0 ? (shield.loyal / total) * 100 : 100;

  async function toggleHijack() {
    await fetch(`${HTTP_URL}/hijack/toggle`, { method: "POST" });
  }

  return (
    <aside className="pointer-events-auto absolute bottom-44 left-72 z-10 flex w-[26rem] flex-col rounded-[2px] border border-[var(--color-line)] bg-[var(--color-canvas)]/95 backdrop-blur-sm">
      <header className="flex items-center justify-between border-b border-[var(--color-line)] px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em]">
        <span className="inline-flex items-center gap-1.5 text-[var(--color-friend)]">
          <ShieldCheck className="h-3.5 w-3.5" />
          SHIELD · 5-layer defender
        </span>
        <button
          type="button"
          onClick={toggleHijack}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-[2px] border px-1.5 py-0.5 transition-colors",
            hijackActive
              ? "border-[var(--color-hostile)]/60 bg-[var(--color-hostile)]/15 text-[var(--color-hostile)]"
              : "border-[var(--color-line)] text-[var(--color-text-dim)] hover:border-[var(--color-status-warn)]/40 hover:text-[var(--color-status-warn)]",
          )}
          title="Inject sensor-spoofed friendlies — sheaf loyalty drops, PageRank trust collapses, kill-switch fires"
        >
          <Skull className="h-3 w-3" />
          {hijackActive ? "HIJACK ACTIVE" : "INJECT HIJACK"}
        </button>
      </header>

      <div className="px-3 py-2 font-mono text-[10.5px]">
        {/* Row 1: friendly loyalty distribution */}
        <div className="mb-2">
          <div className="mb-0.5 flex items-baseline justify-between uppercase tracking-[0.18em] text-[var(--color-text-vdim)]">
            <span className="inline-flex items-center gap-1.5">
              <Activity className="h-3 w-3" /> Friendlies · loyalty
            </span>
            <span className="tabular-nums text-[var(--color-text)]">{shield.loyal}/{total}</span>
          </div>
          <div className="flex h-1.5 w-full overflow-hidden rounded-[1px] bg-[var(--color-line)]">
            <div
              className="h-full bg-[var(--color-status-ok)] transition-[width] duration-300"
              style={{ width: `${(shield.loyal / Math.max(total, 1)) * 100}%` }}
            />
            <div
              className="h-full bg-[var(--color-status-caution)] transition-[width] duration-300"
              style={{ width: `${(shield.suspect / Math.max(total, 1)) * 100}%` }}
            />
            <div
              className="h-full bg-[var(--color-hostile)] transition-[width] duration-300"
              style={{ width: `${(shield.hijacked / Math.max(total, 1)) * 100}%` }}
            />
            <div
              className="h-full bg-[var(--color-text-vdim)] transition-[width] duration-300"
              style={{ width: `${(shield.kill_switched / Math.max(total, 1)) * 100}%` }}
            />
          </div>
          <div className="mt-1 flex gap-3 text-[9.5px] tabular-nums">
            <span className="text-[var(--color-status-ok)]">LOYAL {shield.loyal}</span>
            <span className="text-[var(--color-status-caution)]">SUSPECT {shield.suspect}</span>
            <span className="text-[var(--color-hostile)]">HIJACKED {shield.hijacked}</span>
            <span className="text-[var(--color-text-vdim)]">KILL-SW {shield.kill_switched}</span>
            <span className="ml-auto text-[var(--color-text-vdim)]">
              kill-thresh trust&lt;{shield.trust_kill_threshold.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Row 2: hostile threat-class posterior */}
        <div className="mb-2">
          <div className="mb-0.5 flex items-baseline justify-between uppercase tracking-[0.18em] text-[var(--color-text-vdim)]">
            <span className="inline-flex items-center gap-1.5">
              <Target className="h-3 w-3" /> Hostiles · Bayesian threat class
            </span>
            <span className="tabular-nums text-[var(--color-text)]">
              {Object.values(shield.threat_mix).reduce((a, b) => a + (b ?? 0), 0)}
            </span>
          </div>
          <div className="flex gap-1">
            {(["decoy", "kinetic", "nuisance"] as const).map((c) => (
              <div
                key={c}
                className="flex-1 rounded-[1px] border px-1.5 py-0.5 text-[9.5px] tabular-nums"
                style={{
                  borderColor: `${THREAT_COLOR[c]}50`,
                  background: `${THREAT_COLOR[c]}12`,
                  color: THREAT_COLOR[c],
                }}
              >
                {THREAT_LABEL[c]} {shield.threat_mix[c] ?? 0}
              </div>
            ))}
          </div>
        </div>

        {/* Row 3: SHIELD savings */}
        <div className="flex items-center gap-2 rounded-[1px] border border-[var(--color-status-warn)]/30 bg-[var(--color-status-warn)]/8 px-2 py-1">
          <Zap className="h-3 w-3 text-[var(--color-status-warn)]" />
          <span className="text-[var(--color-status-warn)]">
            DECOYS SKIPPED · <span className="tabular-nums">{shield.decoys_skipped}</span>
          </span>
          <span className="text-[var(--color-text-vdim)]">
            (munition saved · ED-CBBA bid for decoys ≈ 0 via trust × E[damage])
          </span>
        </div>
      </div>
    </aside>
  );
}
